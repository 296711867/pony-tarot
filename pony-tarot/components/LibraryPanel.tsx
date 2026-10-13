'use client';
import { useState } from 'react';
import type { Deck } from '../data/types';
import { cardContent } from '../lib/engine';
import { CardFace } from './TarotCard';
import type { TarotCard } from '../data/types';
import { Icon } from './Icon';
const filters = [{ id: 'all', name: '全部' }, { id: 'major', name: '大阿卡纳' }, { id: 'wands', name: '权杖' }, { id: 'cups', name: '圣杯' }, { id: 'swords', name: '宝剑' }, { id: 'pentacles', name: '星币' }];
export function LibraryPanel({ deck }: { deck: Deck }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TarotCard | null>(null);
  const [reversed, setReversed] = useState(false);
  const cards = deck.cards.filter(c => (filter === 'all' || c.type === filter || c.suit === filter) && `${c.nameCn} ${c.name} ${c.keywords.upright.join(' ')}`.toLowerCase().includes(search.toLowerCase().trim()));
  if (selected) return <div className="card-detail-page"><button className="text-button" onClick={() => { setSelected(null); setReversed(false); }}>← 返回图鉴</button><div className="library-detail"><div className="detail-card"><CardFace draw={{ card: selected, reversed }}/></div><div><p className="eyebrow">{selected.name}</p><h3>{selected.nameCn}</h3>{deck.supportsReversed && <div className="segmented"><button aria-pressed={!reversed} onClick={() => setReversed(false)}>正位</button><button aria-pressed={reversed} onClick={() => setReversed(true)}>逆位</button></div>}<div className="keywords">{selected.keywords[reversed ? 'reversed' : 'upright'].map(k => <span key={k}>{k}</span>)}</div><p className="detail-meaning">{selected.meaning[reversed ? 'reversed' : 'upright']}</p><div className="action-note"><div><strong>小行动</strong><p>{cardContent({ card: selected, reversed }).action}</p><strong>思考</strong><p>{cardContent({ card: selected, reversed }).reflection}</p></div></div></div></div></div>;
  return <div><div className="section-intro"><span className="pill">{deck.name} · {deck.cards.length} 张牌</span></div><label className="search-box"><span className="sr-only">搜索塔罗牌</span><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索牌名或关键词…"/><Icon name="book"/></label><div className="filter-row" aria-label="按牌类筛选">{(deck.system === 'tarot' ? filters : filters.slice(0, 1)).map(f => <button key={f.id} aria-pressed={filter === f.id} className={filter === f.id ? 'filter-button active' : 'filter-button'} onClick={() => setFilter(f.id)}>{f.name}</button>)}</div><p className="results-count">找到 {cards.length} 张牌</p><div className="library-grid">{cards.map(c => <button className="library-item" key={c.id} onClick={() => setSelected(c)}><CardFace draw={{ card: c, reversed: false }} lazy/><strong>{c.nameCn}</strong><span>{c.keywords.upright.slice(0, 2).join(' · ')}</span></button>)}</div>{cards.length === 0 && <div className="empty-state"><Icon name="book"/><h3>没有匹配的牌</h3><p>试试其他关键词。</p><button className="secondary-button" onClick={() => { setSearch(''); setFilter('all'); }}>查看全部</button></div>}{deck.system === 'tarot' && <details className="intro-guide"><summary>塔罗简介</summary><p>大阿卡纳的 22 张牌描述人生里的主题；小阿卡纳的 56 张牌则更贴近日常。权杖关乎行动，圣杯关乎感受，宝剑关乎思考，星币关乎生活与资源。把它们当作整理想法的提示，不用急着学会所有牌义。</p></details>}</div>;
}
