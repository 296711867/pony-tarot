export type Suit = 'wands' | 'cups' | 'swords' | 'pentacles';
export interface TarotCard {
  id: string;
  name: string;
  nameCn: string;
  type: 'major' | 'minor' | 'custom';
  suit?: Suit;
  number: number;
  image: string;
  keywords: { upright: string[]; reversed: string[] };
  meaning: { upright: string; reversed: string };
  action?: { upright: string; reversed: string };
  reflection?: { upright: string; reversed: string };
}
export type Deck = { id: string; name: string; description: string; system: 'tarot' | 'custom'; supportsReversed: boolean; backImage?: string; cards: TarotCard[] };
export type Panel = 'daily' | 'reading' | 'library' | 'journal' | 'settings' | null;
export type Draw = { card: TarotCard; reversed: boolean };
export type Reading = {
  id: string; createdAt: string; kind: 'daily' | 'reading'; question: string;
  readerId: string; draws: Draw[]; text: string;
  deckId?: string; deckName?: string;
  date?: string;
  ai?: { text: string; model: string; createdAt: string; readerId?: string; readerName?: string; usage?: Record<string, number> };
};
export type Theme = 'light' | 'dark';
export type Settings = { motion: boolean; reversed: boolean; theme: Theme; deckId?: string };
