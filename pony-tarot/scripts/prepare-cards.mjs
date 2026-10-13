// Originals stay untouched. Map numbered Chinese filenames to the existing card IDs.
import sharp from 'sharp';
import assert from 'node:assert/strict';
import { readdir, stat, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allCards } from '../data/cards.ts';

const source = process.argv[2] ? resolve(process.argv[2]) : fileURLToPath(new URL('../../卡牌版本1/', import.meta.url));
const output = fileURLToPath(new URL('../public/cards/', import.meta.url));
const groups = { '22张大阿尔卡那': 'major', '权杖组（14张）': 'wands', '圣杯组（14张）': 'cups', '宝剑组（14张）': 'swords', '星币组（14张）': 'pentacles' };
const sources = new Map();
for (const entry of await readdir(source, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !/\.(png|jpe?g|webp)$/i.test(entry.name)) continue;
  const group = groups[basename(entry.parentPath)];
  const number = entry.name.match(/^(\d{2})/);
  assert(group && number, `Unrecognized card: ${entry.name}`);
  const id = `${group}-${number[1]}`;
  assert(!sources.has(id), `Duplicate card: ${id}`);
  sources.set(id, join(entry.parentPath, entry.name));
}
assert.equal(sources.size, allCards.length, 'Expected exactly 78 card images');
for (const card of allCards) assert(sources.has(card.id), `Missing card: ${card.id}`);

const report = [];
for (const card of allCards) {
  const input = sources.get(card.id);
  const before = await sharp(input).metadata();
  assert(before.width * 3 === before.height * 2, `Expected 2:3 art: ${input}`);
  const info = await sharp(input).rotate().resize({ width: 768, withoutEnlargement: true }).webp({ quality: 86, effort: 6 }).toFile(join(output, `${card.id}.webp`));
  assert(info.width * 3 === info.height * 2, `Output aspect ratio changed: ${card.id}`);
  report.push({ id: card.id, name: card.nameCn, source: input.slice(source.length + 1), originalBytes: (await stat(input)).size, webpBytes: info.size, width: info.width, height: info.height });
}
await writeFile(new URL('../asset-sources/card-import.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
const original = report.reduce((sum, card) => sum + card.originalBytes, 0);
const compressed = report.reduce((sum, card) => sum + card.webpBytes, 0);
console.log(`${report.length}/78 cards: ${(original / 1048576).toFixed(2)} MiB → ${(compressed / 1048576).toFixed(2)} MiB, ${(100 * (1 - compressed / original)).toFixed(1)}% smaller. 768×1152 WebP, quality 86; originals preserved.`);
