import catalogue from './decks.generated.json' with { type: 'json' };
import type { Deck } from './types';

export const decks = catalogue as Deck[];
export const defaultDeck = decks[0];
export function getDeck(id?: string): Deck { return decks.find(deck => deck.id === id) ?? defaultDeck; }
