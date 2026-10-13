"""Run as ubuntu on this host: python3 redeploy.py ARCHIVE EXPECTED_SHA256.

Validate the new standalone app before stopping the service. Preserve secrets
and SQLite separately, restore the old app on failure, delete old code on success.
"""
from pathlib import Path, PurePosixPath
import hashlib, json, os, re, secrets, shutil, sqlite3, subprocess, sys, tempfile, time, urllib.request, zipfile

HOME = Path('/home/ubuntu')
APP = HOME / 'pony-tarot'
DATA = HOME / 'pony-tarot-data'
NODE = '/usr/local/bin/node22'
SERVICE = 'pony-tarot.service'
archive = Path(sys.argv[1]).resolve()
assert archive.parent == HOME and archive.is_file(), 'Unexpected archive path'
assert hashlib.sha256(archive.read_bytes()).hexdigest() == sys.argv[2], 'Archive checksum differs'
assert APP.is_dir() and not APP.is_symlink() and APP.resolve() == APP, 'Unexpected current app path'

def remove_release(path):
    path = Path(path)
    assert path.parent == HOME and path.name.startswith(('pony-tarot-stage-', 'pony-tarot-old-')), 'Refusing unrelated cleanup'
    assert not path.is_symlink() and path.resolve() == path, 'Refusing symlink cleanup'
    shutil.rmtree(path)

def env_values(path):
    values = {}
    for line in path.read_text().splitlines():
        key, separator, value = line.strip().partition('=')
        if separator and not key.startswith('#'):
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values

def health(base):
    def get(path):
        with urllib.request.urlopen(base + path, timeout=10) as response:
            assert response.status == 200, path
            return response.read()
    page = get('/').decode()
    resources = set(re.findall(r'(?:src|href)="(/(?:_next/|art/)[^"#]+)"', page))
    resources.update(['/icon.png', '/opengraph-image.jpg', '/cards/major-00.webp', '/icons/magic.svg', '/icons/ponies/applejack.svg', '/icons/ponies/fluttershy.svg'])
    for path in resources:
        assert len(get(path)) > 0, path
    assert 'configured' in json.loads(get('/api/model-config/')), 'Configuration route missing'
    return len(resources)

stage = Path(tempfile.mkdtemp(prefix='pony-tarot-stage-', dir=HOME))
staged_app = stage / 'pony-tarot'
with zipfile.ZipFile(archive) as bundle:
    for item in bundle.infolist():
        parts = PurePosixPath(item.filename).parts
        assert parts and parts[0] == 'pony-tarot' and '..' not in parts and '\\' not in item.filename, 'Unsafe archive entry'
        assert (item.external_attr >> 16) & 0o170000 != 0o120000, 'Symlink entry not supported'
    bundle.extractall(stage)
for forbidden in ['.env', '.env.local', '.runtime']:
    assert not (staged_app / forbidden).exists(), 'Private data bundled'
release = json.loads((staged_app / 'release.json').read_text())
print('STAGED build:', release['buildId'], flush=True)

preflight_env = dict(os.environ, PORT='3101', HOSTNAME='127.0.0.1', APP_ORIGIN='http://127.0.0.1:3101', MODEL_ENCRYPTION_KEY=secrets.token_hex(32), MODEL_DB_PATH=str(stage / 'test.sqlite'))
with (stage / 'preflight.log').open('w') as log:
    preflight = subprocess.Popen([NODE, 'start.mjs'], cwd=staged_app, env=preflight_env, stdout=log, stderr=log)
    try:
        for attempt in range(40):
            if preflight.poll() is not None:
                raise RuntimeError('Preflight process exited; inspect preflight.log')
            try:
                count = health('http://127.0.0.1:3101')
                print('PREFLIGHT passed, resources:', count, flush=True)
                break
            except (OSError, AssertionError):
                time.sleep(.5)
        else:
            raise RuntimeError('Preflight health timed out')
    finally:
        preflight.terminate()
        preflight.wait(timeout=15)

original_env = env_values(APP / '.env')
assert len(original_env.get('MODEL_ENCRYPTION_KEY', '')) == 64, 'Existing encryption key missing'
source_db = Path(original_env.get('MODEL_DB_PATH', str(APP / '.runtime' / 'pony-tarot.sqlite')))
if not source_db.is_absolute():
    source_db = APP / source_db
source_runtime = source_db.parent.resolve()
assert source_runtime in [(APP / '.runtime').resolve(), (DATA / 'runtime').resolve()], 'Unexpected database directory'
assert not DATA.is_symlink(), 'Unexpected data directory'
DATA.mkdir(mode=0o700, exist_ok=True)
DATA.chmod(0o700)
backup = DATA / 'backups' / time.strftime('%Y%m%d-%H%M%S')
backup.mkdir(parents=True, mode=0o700)
old = HOME / ('pony-tarot-old-' + time.strftime('%Y%m%d-%H%M%S'))
assert not old.exists(), 'Old release path already exists'
subprocess.run(['sudo', '-n', 'systemctl', 'stop', SERVICE], check=True)
swapped = False
try:
    shutil.copy2(APP / '.env', backup / '.env')
    shutil.copytree(source_runtime, backup / 'runtime')
    runtime = DATA / 'runtime'
    if source_runtime != runtime:
        shutil.copytree(source_runtime, runtime, dirs_exist_ok=True)
    runtime.chmod(0o700)
    for file in runtime.iterdir():
        if file.is_file():
            file.chmod(0o600)
    original_env.update(MODEL_DB_PATH=str(runtime / source_db.name), PORT='3100', HOSTNAME='0.0.0.0')
    persistent_env = DATA / '.env'
    persistent_env.write_text(''.join(f'{key}={value}\n' for key, value in original_env.items()))
    persistent_env.chmod(0o600)
    assert env_values(persistent_env)['MODEL_ENCRYPTION_KEY'] == env_values(backup / '.env')['MODEL_ENCRYPTION_KEY'], 'Encryption key changed'
    (staged_app / '.env').symlink_to(persistent_env)
    APP.rename(old)
    swapped = True
    staged_app.rename(APP)
    subprocess.run(['sudo', '-n', 'systemctl', 'start', SERVICE], check=True)
    for attempt in range(40):
        try:
            count = health('http://127.0.0.1:3100')
            break
        except (OSError, AssertionError):
            time.sleep(.5)
    else:
        raise RuntimeError('New service health timed out')
    assert json.loads((APP / 'release.json').read_text())['buildId'] == release['buildId'], 'Wrong release running'
    for table in ['credentials', 'ai_cache']:
        with sqlite3.connect(backup / 'runtime' / source_db.name) as before, sqlite3.connect(runtime / source_db.name) as after:
            assert before.execute(f'SELECT count(*) FROM {table}').fetchone() == after.execute(f'SELECT count(*) FROM {table}').fetchone(), 'Database contents differ'
    print('LIVE passed, resources:', count, 'database and encryption key preserved', flush=True)
except Exception:
    subprocess.run(['sudo', '-n', 'systemctl', 'stop', SERVICE], check=False)
    if swapped:
        if APP.exists():
            assert APP.resolve() == APP and not APP.is_symlink()
            shutil.rmtree(APP)
        old.rename(APP)
    subprocess.run(['sudo', '-n', 'systemctl', 'start', SERVICE], check=False)
    raise
remove_release(old)
remove_release(stage)
print('DONE: old program directory deleted; persistent backup:', backup, flush=True)
