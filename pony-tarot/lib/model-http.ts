import type { NextRequest } from 'next/server';
import { ownerHash } from './model-store.ts';

export const COOKIE = 'pony-model-owner';
export function requestOwner(request: NextRequest): string | undefined {
  const token = request.cookies.get(COOKIE)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? ownerHash(token) : undefined;
}
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  try {
    const source = new URL(origin);
    if (process.env.APP_ORIGIN) return source.origin === new URL(process.env.APP_ORIGIN).origin;
    // Next's internal URL can say localhost even when the browser used 127.0.0.1.
    // Host preserves the actual browser destination; do not trust arbitrary forwarded hosts.
    return source.host === request.headers.get('host') && source.protocol === new URL(request.url).protocol;
  } catch { return false; }
}
export async function jsonBody(request: Request): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new Error('请使用 JSON 请求');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('缺少请求内容');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.length; if (size > 8192) throw new Error('请求内容过长'); chunks.push(value);
    }
    const value = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('请求格式不正确');
    return value;
  } finally { await reader.cancel().catch(() => {}); }
}
