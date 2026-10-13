// Local UI checks only. Uses a temporary database and intercepts model requests.
import { spawn } from 'node:child_process';
import { mkdtemp, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
const directory = await mkdtemp(join(tmpdir(), 'pony-ui-check-'));
const server = spawn(process.execPath, ['--import', './scripts/mock-model.mjs', 'node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3096'], {
  stdio: 'inherit',
  env: { ...process.env, MODEL_ENCRYPTION_KEY: randomBytes(32).toString('hex'), MODEL_DB_PATH: join(directory, 'test.sqlite'), APP_ORIGIN: 'http://127.0.0.1:3096' },
});
process.on('SIGINT', () => server.kill());
process.on('SIGTERM', () => server.kill());
server.on('exit', async code => {
  for (const file of ['test.sqlite', 'test.sqlite-wal', 'test.sqlite-shm']) await rm(join(directory, file), { force: true });
  await rmdir(directory);
  process.exitCode = code ?? 0;
});
