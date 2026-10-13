'use client';
import { useState } from 'react';
import type { Deck, Draw } from '../data/types';
import { Icon } from './Icon';

export function CardFace({ draw, lazy = false }: { draw: Draw; lazy?: boolean }) {
  const [failed, setFailed] = useState(false);
  const image = draw.card.image;
  return <div className="card-face">
    {image && !failed ? <img draggable={false} src={image} width={768} height={1152} loading={lazy ? 'lazy' : 'eager'} decoding="async" alt={`${draw.card.nameCn}主题卡面`} onError={() => setFailed(true)} className={draw.reversed ? 'card-art reversed' : 'card-art'}/> : <div className="card-placeholder">
      <span className="card-number">{draw.card.type === 'major' ? String(draw.card.number).padStart(2, '0') : draw.card.suit?.toUpperCase()}</span>
      <div className="placeholder-emblem"><Icon name="sparkle"/></div>
      <span className="placeholder-name">{draw.card.nameCn}</span>
      <span className="placeholder-note">主题卡面待补</span>
    </div>}
  </div>;
}

export function TarotCard({ draw, revealed, onReveal, label, deck }: { draw: Draw; revealed: boolean; onReveal: () => void; label: string; deck: Deck }) {
  return <div className="tarot-slot" onPointerMove={event => {
    if (event.pointerType !== 'mouse' || event.currentTarget.closest('.reduce-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--tilt-x', `${(event.clientY - rect.top - rect.height / 2) / rect.height * -7}deg`);
    event.currentTarget.style.setProperty('--tilt-y', `${(event.clientX - rect.left - rect.width / 2) / rect.width * 9}deg`);
  }} onPointerLeave={event => { event.currentTarget.style.setProperty('--tilt-x', '0deg'); event.currentTarget.style.setProperty('--tilt-y', '0deg'); }}>
    <button type="button" className={`tarot-card ${revealed ? 'is-revealed' : ''}`} onClick={onReveal} disabled={revealed} aria-label={revealed ? `${label}：${draw.card.nameCn}${draw.reversed ? '逆位' : '正位'}` : `翻开${label}`}>
      <span className="card-aura" aria-hidden="true"/>
      <div className="card-turn">
        <div className="card-back" aria-hidden={revealed}>{deck.backImage ? <img draggable={false} className="card-art" src={deck.backImage} alt=""/> : <><span className="back-star small-star">✧</span><div className="back-orbit"><span className="orbit-marks">✦ · ✧ · ✦ · ✧</span><Icon name="sparkle"/></div><span className="back-caption">{deck.name}</span><span className="back-star bottom-star">✧</span></>}</div>
        <div className="card-front" aria-hidden={!revealed}><CardFace draw={draw}/></div>
      </div>
      <span className="card-shimmer" aria-hidden="true"/>
    </button>
    <span className="slot-label">{label}</span>
    {revealed && <span className="revealed-name">{draw.card.nameCn}<small>{draw.reversed ? '逆位' : '正位'}</small></span>}
  </div>;
}
