import { DatabaseSync } from 'node:sqlite';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

type Credential = { owner: string; model: string; enabled: number; cipher: string; iv: string; tag: string; last4: string; revision: number };
let database: DatabaseSync | undefined;
let lastCleanup = 0;
function db() {
  if (database) { cleanup(database); return database; }
  // This path is a runtime writable database, never a deployment asset to trace.
  const path = resolve(/* turbopackIgnore: true */ process.env.MODEL_DB_PATH ?? '.runtime/pony-tarot.sqlite');
  mkdirSync(dirname(path), { recursive: true });
  database = new DatabaseSync(path);
  database.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS credentials(owner TEXT PRIMARY KEY,model TEXT NOT NULL,enabled INTEGER NOT NULL,cipher TEXT NOT NULL,iv TEXT NOT NULL,tag TEXT NOT NULL,last4 TEXT NOT NULL,revision INTEGER NOT NULL,updated INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS ai_cache(owner TEXT NOT NULL,fingerprint TEXT NOT NULL,result TEXT NOT NULL,created INTEGER NOT NULL,PRIMARY KEY(owner,fingerprint));
    CREATE TABLE IF NOT EXISTS ai_calls(owner TEXT NOT NULL,created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS ai_calls_owner ON ai_calls(owner,created);`);
  cleanup(database);
  return database;
}
function cleanup(store: DatabaseSync) {
  const now = Date.now();
  if (now - lastCleanup < 3600000) return;
  store.prepare('DELETE FROM credentials WHERE updated < ?').run(now - 30 * 86400000);
  store.prepare('DELETE FROM ai_cache WHERE created < ?').run(now - 7 * 86400000);
  store.prepare('DELETE FROM ai_calls WHERE created < ?').run(now - 3600000);
  lastCleanup = now;
}
function encryptionKey() {
  const value = process.env.MODEL_ENCRYPTION_KEY ?? '';
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('服务端尚未配置数据库加密密钥，请运行 npm run ai:setup 后重启。');
  return Buffer.from(value, 'hex');
}
export const ownerHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function getCredential(owner: string): Credential | undefined {
  const item = db().prepare('SELECT * FROM credentials WHERE owner=?').get(owner) as Credential | undefined;
  if (item) db().prepare('UPDATE credentials SET updated=? WHERE owner=?').run(Date.now(), owner);
  return item;
}
export function saveCredential(owner: string, model: string, enabled: boolean, apiKey?: string) {
  const old = getCredential(owner);
  if (!apiKey && !old) throw new Error('请填写你的标准 API Key。');
  let encrypted = old;
  if (apiKey) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
    cipher.setAAD(Buffer.from(owner));
    encrypted = { owner, model, enabled: Number(enabled), cipher: Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]).toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), last4: apiKey.slice(-4), revision: 0 };
  }
  db().prepare('INSERT OR REPLACE INTO credentials VALUES(?,?,?,?,?,?,?,?,?)').run(owner, model, Number(enabled), encrypted!.cipher, encrypted!.iv, encrypted!.tag, encrypted!.last4, (old?.revision ?? 0) + 1, Date.now());
  db().prepare('DELETE FROM ai_cache WHERE owner=?').run(owner);
}
export function decryptCredential(item: Credential) {
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(item.iv, 'base64'));
  decipher.setAAD(Buffer.from(item.owner));
  decipher.setAuthTag(Buffer.from(item.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(item.cipher, 'base64')), decipher.final()]).toString('utf8');
}
export function deleteCredential(owner: string) {
  db().prepare('DELETE FROM credentials WHERE owner=?').run(owner);
  db().prepare('DELETE FROM ai_cache WHERE owner=?').run(owner);
}
export function cachedResult(owner: string, fingerprint: string): string | undefined {
  return (db().prepare('SELECT result FROM ai_cache WHERE owner=? AND fingerprint=? AND created>?').get(owner, fingerprint, Date.now() - 7 * 86400000) as { result: string } | undefined)?.result;
}
export function cacheResult(owner: string, fingerprint: string, result: unknown) {
  db().prepare('INSERT OR REPLACE INTO ai_cache VALUES(?,?,?,?)').run(owner, fingerprint, JSON.stringify(result), Date.now());
}
export function reserveCall(owner: string): boolean {
  const store = db();
  store.exec('BEGIN IMMEDIATE');
  try {
    const row = store.prepare('SELECT COUNT(*) AS count FROM ai_calls WHERE owner=? AND created>?').get(owner, Date.now() - 3600000) as { count: number };
    if (row.count >= 10) { store.exec('ROLLBACK'); return false; }
    store.prepare('INSERT INTO ai_calls VALUES(?,?)').run(owner, Date.now());
    store.exec('COMMIT'); return true;
  } catch (error) { store.exec('ROLLBACK'); throw error; }
}
