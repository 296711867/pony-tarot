import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getCredential, saveCredential, deleteCredential, ownerHash } from '../../../lib/model-store';
import { COOKIE, requestOwner, sameOrigin, jsonBody } from '../../../lib/model-http';
export const runtime = 'nodejs';

const json = (value: unknown, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: NextRequest) {
  try {
    const owner = requestOwner(request);
    const item = owner ? getCredential(owner) : undefined;
    return json({ configured: !!item, enabled: !!item?.enabled, model: item?.model ?? 'glm-5.2', last4: item?.last4 ?? '' });
  } catch { return json({ error: '暂时无法读取 AI 配置。' }, 503); }
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: '请求来源不正确。' }, 403);
  try {
    const body = await jsonBody(request);
    if (typeof body.model !== 'string' || !/^[a-zA-Z0-9._:-]{1,100}$/.test(body.model) || typeof body.enabled !== 'boolean' || (body.apiKey !== undefined && (typeof body.apiKey !== 'string' || body.apiKey.length > 512))) return json({ error: '请检查模型名称和 Key。' }, 400);
    const token = requestOwner(request) ? request.cookies.get(COOKIE)!.value : randomBytes(32).toString('hex');
    saveCredential(ownerHash(token), body.model, body.enabled, typeof body.apiKey === 'string' ? body.apiKey.trim() || undefined : undefined);
    const response = json({ ok: true });
    response.cookies.set(COOKIE, token, { httpOnly: true, secure: new URL(process.env.APP_ORIGIN ?? request.url).protocol === 'https:', sameSite: 'strict', path: '/', maxAge: 30 * 86400 });
    return response;
  } catch { return json({ error: '保存失败，请检查 Key 是否已填写、服务器加密密钥及数据库是否可用。' }, 400); }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return json({ error: '请求来源不正确。' }, 403);
  try {
    const owner = requestOwner(request); if (owner) deleteCredential(owner);
    const response = json({ ok: true }); response.cookies.delete(COOKIE); return response;
  } catch { return json({ error: '删除失败，请稍后再试。' }, 503); }
}
