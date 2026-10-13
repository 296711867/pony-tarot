'use client';
import { decks } from '../data/decks';

export function DeckSelector({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return <label className="deck-selector"><span>当前卡组</span><select value={value} onChange={event => onChange(event.target.value)}>{decks.map(deck => <option key={deck.id} value={deck.id}>{deck.name} · {deck.cards.length} 张</option>)}</select></label>;
}
