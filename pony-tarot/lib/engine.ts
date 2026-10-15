import { defaultDeck } from '../data/decks.ts';
import { personas } from '../data/personas.ts';
import type { Deck, Draw, Reading } from '../data/types.ts';

export const positionNames = ['当前处境', '可以尝试的行动', '值得留意的方向'];

const randomValue = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
export function drawCards(count: number, reversed = false, random = randomValue, source: Deck = defaultDeck): Draw[] {
  if (!Number.isInteger(count) || count < 1 || count > source.cards.length) throw new Error('抽牌数量超出当前卡组范围');
  const deck = [...source.cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count).map(card => ({ card, reversed: source.supportsReversed && reversed && random() < .5 }));
}

export function dateKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dailyDraw(date = new Date(), deck: Deck = defaultDeck): Draw {
  let hash = 5381;
  for (const c of `${deck.id}:${dateKey(date)}`) hash = ((hash << 5) + hash) ^ c.charCodeAt(0);
  return { card: deck.cards[(hash >>> 0) % deck.cards.length], reversed: false };
}

export function cardContent(draw: Draw) {
  const side = draw.reversed ? 'reversed' : 'upright';
  return { meaning: draw.card.meaning[side], keywords: draw.card.keywords[side], action: draw.card.action?.[side] ?? '从这张牌的提示中，选一个适合你的小行动。', reflection: draw.card.reflection?.[side] ?? '这张牌与你现在的经历有什么联系？' };
}

export function positionContent(draw: Draw, index: number, daily = false): string {
  const content = cardContent(draw);
  const context = daily ? '今天可以留意' : ['观察当前处境', '选择可以尝试的行动', '留意接下来需要照顾的方向'][index];
  return `${context}：${content.meaning}\n思考：${content.reflection}\n小行动：${content.action}`;
}

export function overallContent(draws: Draw[]): string {
  return draws.map((draw, i) => `${positionNames[i]} · ${draw.card.nameCn}${draw.reversed ? '（逆位）' : ''}：${cardContent(draw).keywords.slice(0, 2).join('、')}`).join('；') + '。把这三条线索与你的问题对照，先从行动位的小建议开始；方向位是观察角度，不是确定的预测。';
}

export function interpret(draws: Draw[], readerId = 'twilight'): string {
  const persona = personas.find(p => p.id === readerId) ?? personas[0];
  return [persona.intro, ...draws.map((d, i) => `${draws.length === 1 ? '今日指引' : positionNames[i]} · ${d.card.nameCn}${d.reversed ? '（逆位）' : '（正位）'}\n${positionContent(d, i, draws.length === 1)}`), ...(draws.length > 1 ? [overallContent(draws)] : []), persona.closing].join('\n\n');
}

export function makeReading(kind: Reading['kind'], draws: Draw[], question: string, readerId: string, deck: Deck = defaultDeck): Reading {
  // getRandomValues also works on HTTP origins, unlike randomUUID.
  const id = kind === 'daily' ? `daily:${deck.id}:${dateKey()}` : Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
  return { id, createdAt: new Date().toISOString(), kind, ...(kind === 'daily' ? { date: dateKey() } : {}), draws, question: question.trim(), readerId, deckId: deck.id, deckName: deck.name, text: interpret(draws, readerId) };
}
