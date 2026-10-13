'use client';
import { useEffect, useState } from 'react';

type Config = { configured: boolean; enabled: boolean; model: string; last4: string };
export function AISettings({ onSaved }: { onSaved?: () => void } = {}) {
  const [config, setConfig] = useState<Config>({ configured: false, enabled: false, model: 'glm-5.2', last4: '' });
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const load = async () => {
    const response = await fetch('/api/model-config/', { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? '读取配置失败');
    setConfig(data);
  };
  useEffect(() => { let alive = true; fetch('/api/model-config/', { cache: 'no-store' }).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); if (alive) setConfig(data); }).catch(() => { if (alive) setMessage('暂时无法读取 AI 配置，基础抽牌仍可使用。'); }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, []);
  const save = async (remove = false) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/model-config/', { method: remove ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, ...(remove ? {} : { body: JSON.stringify({ model: config.model.trim(), enabled: config.enabled, ...(key.trim() ? { apiKey: key.trim() } : {}) }) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? '保存失败');
      setKey(''); await load(); setMessage(remove ? 'Key 已从本站数据库删除。' : '已保存'); onSaved?.();
    } catch (error) { setMessage(error instanceof Error ? error.message : '保存失败，请稍后重试。'); }
    finally { setBusy(false); }
  };
  return <section className="ai-settings"><span className="pill">AI 解读</span><h3>模型配置</h3><p>使用自己的智谱标准 API Key，费用由提供方收取。</p><form onSubmit={event => { event.preventDefault(); void save(); }}>
    <label className="ai-field">标准 API Key<input type="password" value={key} onChange={event => setKey(event.target.value)} autoComplete="off" maxLength={512} placeholder={config.configured ? `已保存 · 尾号 ${config.last4}；留空保留原 Key` : '填写你自己的标准 API Key'} disabled={busy || loading}/></label>
    <label className="ai-field">模型 ID<input value={config.model} onChange={event => setConfig({ ...config, model: event.target.value })} maxLength={100} required disabled={busy || loading}/></label>
    <label className="ai-enable"><input type="checkbox" checked={config.enabled} onChange={event => setConfig({ ...config, enabled: event.target.checked })} disabled={busy || loading}/>开启 AI 解读</label>
    <div className="result-actions"><button className="primary-button" type="submit" disabled={busy || loading || (!config.configured && !key.trim())}>{loading ? '正在读取…' : busy ? '正在保存…' : '保存配置'}</button>{config.configured && <button className="secondary-button" type="button" disabled={busy || loading} onClick={() => void save(true)}>删除 Key</button>}</div>
  </form><p className="ai-status" role="status">{message}</p><p className="fine-print">Key 加密保存在本站服务端数据库，浏览器只保留匿名身份 Cookie；换浏览器或清 Cookie 后需要重新填写。仅主动解读时发送本次问题与牌义。图鉴不调用模型。</p></section>;
}
