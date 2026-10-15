import type { Reading, Settings } from '../data/types';
import { getDeck, defaultDeck } from '../data/decks.ts';
const HISTORY = 'pony-tarot-history-v1';
const PREFERENCES = 'pony-tarot-settings-v1';
export const defaults: Settings = { motion: true, reversed: true, theme: 'dark', deckId: defaultDeck.id };

export function readHistory(): Reading[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(HISTORY) ?? '[]');
    if (!Array.isArray(items)) return [];
    return items.filter((r): r is Reading => r && typeof r.id === 'string' && typeof r.text === 'string' && typeof r.createdAt === 'string' && Array.isArray(r.draws)).slice(0, 50);
  } catch { return []; }
}
export function writeHistory(items: Reading[]): void {
  localStorage.setItem(HISTORY, JSON.stringify(items.slice(0, 50)));
}
export function readSettings(): Settings {
  try {
    const value = JSON.parse(localStorage.getItem(PREFERENCES) ?? '{}');
    return { motion: typeof value?.motion === 'boolean' ? value.motion : true, reversed: typeof value?.reversed === 'boolean' ? value.reversed : true, theme: value?.theme === 'light' ? 'light' : 'dark', deckId: getDeck(value?.deckId).id };
  } catch { return defaults; }
}
export function writeSettings(value: Settings): void { localStorage.setItem(PREFERENCES, JSON.stringify(value)); }
