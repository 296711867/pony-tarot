import { readdir, readFile, writeFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

const directory = new URL('../data/deck-definitions/', import.meta.url);
const decks = [];
for (const filename of (await readdir(directory)).filter(name => name.endsWith('.json')).sort()) {
  const deck = JSON.parse(await readFile(new URL(filename, directory), 'utf8'));
  assert(typeof deck.id === 'string' && /^[a-z0-9-]+$/.test(deck.id) && deck.name, `${filename}: invalid deck id/name`);
  assert(['tarot', 'custom'].includes(deck.system) && typeof deck.supportsReversed === 'boolean', `${filename}: specify system and supportsReversed`);
  assert(!decks.some(item => item.id === deck.id), `${filename}: duplicate deck id`);
  assert(Array.isArray(deck.cards) && deck.cards.length > 0, `${filename}: cards must not be empty`);
  const ids = new Set();
  for (const [i, card] of deck.cards.entries()) {
    assert(typeof card.id === 'string' && !ids.has(card.id) && typeof card.nameCn === 'string' && typeof card.meaning?.upright === 'string' && card.meaning.upright.trim() && Array.isArray(card.keywords?.upright) && card.keywords.upright.length, `${filename}: card ${i + 1} needs unique id/nameCn/meaning/keywords`);
    ids.add(card.id);
    if (deck.supportsReversed) assert(typeof card.meaning.reversed === 'string' && card.meaning.reversed.trim() && Array.isArray(card.keywords.reversed) && card.keywords.reversed.length, `${filename}: ${card.id} needs reversed meaning/keywords`);
    card.type ??= 'custom'; card.number ??= i + 1; card.name ??= card.nameCn;
    card.meaning.reversed ??= card.meaning.upright;
    card.keywords.reversed ??= [];
    assert(['major', 'minor', 'custom'].includes(card.type), `${filename}: invalid card type`);
    assert(card.image?.startsWith('/') && !card.image.includes('..'), `${filename}: ${card.id} needs a local image path`);
    await access(new URL(`../public${card.image}`, import.meta.url));
  }
  if (deck.backImage) {
    assert(deck.backImage.startsWith('/') && !deck.backImage.includes('..'), `${filename}: invalid backImage`);
    await access(new URL(`../public${deck.backImage}`, import.meta.url));
  }
  decks.push(deck);
}
assert(decks.length, 'At least one deck is required');
// Keep the established default independent of filename order.
decks.sort((a, b) => Number(b.id === 'pony-v2') - Number(a.id === 'pony-v2'));
await writeFile(new URL('../data/decks.generated.json', import.meta.url), JSON.stringify(decks, null, 2) + '\n');
console.log(`Decks ready: ${decks.map(deck => `${deck.name} (${deck.cards.length})`).join(', ')}`);
