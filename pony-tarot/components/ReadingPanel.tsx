'use client';
import { useEffect, useRef, useState } from 'react';
import type { Deck, Draw, Reading, Settings } from '../data/types';
import { dailyDraw, dateKey, drawCards, makeReading, positionNames, interpret, cardContent } from '../lib/engine';
import { TarotCard } from './TarotCard';
import { Icon } from './Icon';
import { AIReading } from './AIReading';

export function ReadingPanel({ kind, settings, onSave, deck }: { deck: Deck; kind: 'daily' | 'reading'; settings: Settings; onSave: (reading: Reading) => boolean }) {
  const daily = kind === 'daily';
  const [draws, setDraws] = useState<Draw[]>(() => daily ? [dailyDraw(new Date(), deck)] : []);
  const [revealed, setRevealed] = useState<boolean[]>([false, false, false]);
  const [question, setQuestion] = useState('');
  const [reading, setReading] = useState<Reading | null>(null);
  const [readerId, setReaderId] = useState('twilight');
  const [shuffling, setShuffling] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');
  const [today, setToday] = useState(() => dateKey());
  const resultRef = useRef<HTMLDivElement>(null);
  const complete = reading !== null;

  useEffect(() => {
    if (!complete) return;
    const motion = settings.motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => {
      if (window.matchMedia('(min-width: 1100px)').matches) resultRef.current?.closest('dialog')?.scrollTo({ top: 0, behavior: motion ? 'smooth' : 'instant' });
      else resultRef.current?.previousElementSibling?.scrollIntoView({ block: 'start', behavior: motion ? 'smooth' : 'instant' });
    }, motion ? 650 : 0);
    return () => clearTimeout(timer);
  }, [complete, settings.motion]);

  useEffect(() => {
    if (!daily) return;
    const update = () => { const key = dateKey(); if (key !== today) { setToday(key); setDraws([dailyDraw(new Date(), deck)]); setRevealed([false]); setReading(null); setSaved(false); setMessage('新的一天，新的温柔指引。'); } };
    const timer = setInterval(update, 30000);
    window.addEventListener('focus', update);
    return () => { clearInterval(timer); window.removeEventListener('focus', update); };
  }, [daily, today, deck]);

  useEffect(() => {
    if (!shuffling) return;
    const timer = setTimeout(() => setShuffling(false), settings.motion ? 700 : 0);
    return () => clearTimeout(timer);
  }, [shuffling, settings.motion]);

  const begin = () => {
    const next = drawCards(3, settings.reversed, undefined, deck);
    setDraws(next); setRevealed([false, false, false]); setReading(null); setSaved(false); setMessage(''); setShuffling(true);
  };
  const reveal = (index?: number) => {
    const next = revealed.map((value, i) => index === undefined || i === index ? true : value);
    setRevealed(next);
    if (draws.every((_, i) => next[i])) setReading(makeReading(kind, draws, question, readerId, deck));
  };
  const changeReader = (id: string) => { if (id === readerId) return; setReaderId(id); if (reading) { setReading({ ...reading, readerId: id, ai: undefined, text: interpret(draws, id) }); setSaved(false); setMessage(''); } };
  const save = () => { if (reading && onSave(reading)) { setSaved(true); setMessage('已保存'); } else setMessage('浏览器未能保存。你仍可以阅读本次指引。'); };

  if (!daily && deck.cards.length < 3) return <div className="empty-state"><h3>这套卡组适合单牌指引</h3><p>当前仅有 {deck.cards.length} 张牌，三牌抽取至少需要 3 张不同的牌。请使用今日一牌，或在设置中切换卡组。</p></div>;

  return <div className={`reading-panel ${daily ? 'daily-panel' : ''}`}>
    <div className="reading-header"><span className="pill">{daily ? today.replaceAll('-', '.') : '处境 · 行动 · 方向'}</span><p>{deck.name}</p></div>
    {!daily && draws.length === 0 && <form className="question-form" onSubmit={e => { e.preventDefault(); begin(); }}>
      <h3>你想问什么？</h3><label htmlFor="question" className="sr-only">你的问题</label><textarea id="question" value={question} onChange={e => setQuestion(e.target.value)} maxLength={200} rows={3} placeholder="写下你的问题…" required/><button className="primary-button" type="submit"><Icon name="cards"/> 开始占卜</button>
    </form>}
    {daily && !reading && <p className="draw-hint">翻开今日牌</p>}
    {draws.length > 0 && <div className={`reading-layout ${reading ? 'has-reading' : ''}`}><div className="reading-stage">
      {question && <p className="question-preview">{question}</p>}
      <div className={`draw-area ${shuffling ? 'is-shuffling' : ''}`} aria-busy={shuffling}>{draws.map((draw, index) => <TarotCard key={`${draw.card.id}-${index}`} draw={draw} revealed={!shuffling && !!revealed[index]} onReveal={() => { if (!shuffling) reveal(index); }} label={daily ? '今日牌' : ['现状', '行动', '方向'][index]} deck={deck}/>)}</div>
      {!reading && <div className="reveal-controls">{shuffling ? <button className="text-button" onClick={() => setShuffling(false)}>跳过洗牌</button> : !daily ? <button className="secondary-button" onClick={() => reveal()}>翻开全部</button> : null}</div>}
      {reading && <div className="reading-next"><button type="button" className="secondary-button" onClick={() => resultRef.current?.scrollIntoView({ block: 'start', behavior: settings.motion && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant' })}><Icon name="sparkle"/>选择小马 · AI 解读<Icon name="arrow"/></button></div>}
      </div>{reading && <div className="reading-result" ref={resultRef}>
        <AIReading key={`${reading.id}-${reading.readerId}`} reading={reading} onReader={changeReader} onComplete={ai => { setReading(value => value ? { ...value, ai } : value); setSaved(false); }} onQuestion={value => { setQuestion(value); setReading(current => current ? { ...current, question: value, ai: undefined } : current); setSaved(false); }}/>
        <details className="local-meanings"><summary>查看牌义</summary>{draws.map((draw, i) => <div className="local-meaning" key={draw.card.id}><strong>{daily ? '今日牌' : positionNames[i]} · {draw.card.nameCn}{draw.reversed ? '（逆位）' : ''}</strong><p>{cardContent(draw).meaning}</p></div>)}</details>
        <div className="result-actions"><button className="secondary-button" disabled={saved} onClick={save}><Icon name="heart"/>{saved ? '已保存' : '保存'}</button>{!daily && <button className="text-button" onClick={() => { setDraws([]); setReading(null); setMessage(''); setSaved(false); }}>重新占卜</button>}</div>
        <p className="save-message" role="status">{message}</p>
      </div>}
    </div>}
  </div>;
}
