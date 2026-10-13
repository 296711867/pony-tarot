'use client';
import { useEffect, useRef, useState } from 'react';
import type { Reading } from '../data/types';
import type { AIResult } from '../lib/model-stream';
import { personas, readerVoices } from '../data/personas';
import { readSSE } from '../lib/sse';
import { AISettings } from './AISettings';

export function AIReading({ reading, onComplete, onQuestion, onReader }: { onReader: (id: string) => void; reading: Reading; onComplete: (result: AIResult) => void; onQuestion: (question: string) => void }) {
  const daily = reading.kind === 'daily';
  const persona = personas.find(p => p.id === reading.readerId)!;
  const [configuration, setConfiguration] = useState<'loading' | 'ready' | 'missing' | 'disabled' | 'error'>('loading');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const enabled = configuration === 'ready';
  const [status, setStatus] = useState('');
  const [text, setText] = useState(reading.ai?.text ?? '');
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(!!reading.ai);
  const abort = useRef<AbortController | null>(null);
  const alive = useRef(true);
  const refreshConfig = async () => {
    setConfiguration('loading');
    try {
      const response = await fetch('/api/model-config/', { cache: 'no-store' });
      if (!response.ok) throw new Error('读取失败');
      const data = await response.json();
      if (alive.current) setConfiguration(!data.configured ? 'missing' : data.enabled ? 'ready' : 'disabled');
    } catch { if (alive.current) setConfiguration('error'); }
  };
  useEffect(() => {
    alive.current = true;
    void refreshConfig();
    return () => { alive.current = false; abort.current?.abort(); };
  }, []);
  const generate = async () => {
    if (!enabled || abort.current || complete || (!daily && !reading.question.trim())) return;
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setText(''); setStatus('正在连接…');
    let accumulated = ''; let finished = false; let lastPaint = 0;
    let paintTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const response = await fetch('/api/interpret/', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: reading.kind, date: reading.date, deckId: reading.deckId, readerId: reading.readerId, question: reading.question, draws: reading.draws.map(draw => ({ id: draw.card.id, reversed: draw.reversed })) }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? '暂时无法生成解读。'); }
      if (!response.body) throw new Error('未收到响应流。');
      for await (const event of readSSE(response.body)) {
        if (!alive.current || controller.signal.aborted) break;
        const data = JSON.parse(event.data);
        if (event.event === 'delta') {
          accumulated += data.text;
          if (Date.now() - lastPaint >= 80) { setText(accumulated); lastPaint = Date.now(); }
          else if (!paintTimer) paintTimer = setTimeout(() => { paintTimer = undefined; if (alive.current) { setText(accumulated); lastPaint = Date.now(); } }, 80);
          setStatus('正在解读…');
        } else if (event.event === 'done') {
          accumulated = data.text; setText(accumulated); setComplete(true); onComplete(data); finished = true;
          setStatus(data.cached ? '已读取解读' : '解读完成');
        } else if (event.event === 'error') throw new Error(data.error);
      }
      if (!finished) throw new Error('连接中断，解读未完成。');
    } catch (error) {
      if (alive.current) { setText(accumulated); setStatus(controller.signal.aborted ? '已停止 · 内容未完成' : `未完成 · ${error instanceof Error ? error.message : '请稍后主动重试。'}`); }
    } finally { clearTimeout(paintTimer); abort.current = null; if (alive.current) setBusy(false); }
  };
  return <section className="ai-reading reader-stage">
    <div className="reader-stage-heading"><span className="eyebrow">{daily ? 'DAILY READING' : 'AI READING'}</span><h3>小马 AI 解读</h3></div>
    <div className="ai-action-bar">
      <button type="button" className="primary-button" disabled={configuration === 'loading' || busy || complete || (enabled && !daily && !reading.question.trim())} onClick={() => { if (configuration === 'error') void refreshConfig(); else if (!enabled) setSettingsOpen(true); else void generate(); }}>{configuration === 'loading' ? '正在读取 AI 配置…' : configuration === 'error' ? '重新读取 AI 配置' : !enabled ? '设置 AI 解读' : busy ? `${persona.name}正在解读…` : complete ? `${persona.name}的解读` : `请${persona.name}解读`}</button>
      {busy && <button type="button" className="secondary-button" onClick={() => abort.current?.abort()}>停止</button>}
      <p className="ai-status" role="status">{status || (configuration === 'missing' ? '填写自己的 Key，保留本次牌面' : configuration === 'disabled' ? 'AI 尚未开启，可直接在这里开启' : configuration === 'error' ? '配置读取失败，请重试' : '选择下方小马，再点击解读')}</p>
    </div>
    {text && <div className={`ai-output${complete ? '' : ' incomplete'}`}>{text}</div>}
    {settingsOpen && <div className="reading-ai-settings"><AISettings onSaved={() => { setSettingsOpen(false); void refreshConfig(); }}/><button type="button" className="text-button" onClick={() => setSettingsOpen(false)}>返回解读</button></div>}
    <div className="reader-selector" aria-label="选择解读小马">{personas.map(p => <button type="button" key={p.id} disabled={busy || settingsOpen} aria-pressed={p.id === reading.readerId} className={p.id === reading.readerId ? 'reader-chip active' : 'reader-chip'} onClick={() => onReader(p.id)} style={{ '--reader-color': p.color } as React.CSSProperties}><span className="reader-mark" aria-hidden="true"><img src={`/icons/ponies/${p.id}.svg`} alt="" draggable={false} width={56} height={56}/></span><strong>{p.name}</strong><small>{readerVoices[p.id].label}</small>{p.id === reading.readerId && <span className="reader-selected" aria-hidden="true">✓</span>}</button>)}</div>
    <details className="ai-question"><summary>{daily ? '补充问题（可选）' : reading.question.trim() ? '修改问题' : '填写问题'}</summary><label className="ai-field"><span className="sr-only">解读问题</span><textarea rows={2} maxLength={200} value={reading.question} disabled={busy} placeholder={daily ? '今天有什么想问的？' : '写下你的问题…'} onChange={event => { onQuestion(event.target.value); setComplete(false); setText(''); setStatus(''); }}/></label></details>
    {!text && <p className="fine-print">仅点击解读时发送问题与牌义 · 使用你的 API 额度</p>}
  </section>;
}
