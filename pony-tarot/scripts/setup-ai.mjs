import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const file = new URL('../.env.local', import.meta.url);
const existing = await readFile(file, 'utf8').catch(error => { if (error.code === 'ENOENT') return ''; throw error; });
if (!/^MODEL_ENCRYPTION_KEY=/m.test(existing)) {
  await writeFile(file, existing + `\nMODEL_ENCRYPTION_KEY=${randomBytes(32).toString('hex')}\n`, { mode: 0o600 });
  console.log('Created local database encryption key. Keep .env.local private and back it up with the database.');
} else console.log('Existing encryption key preserved.');
