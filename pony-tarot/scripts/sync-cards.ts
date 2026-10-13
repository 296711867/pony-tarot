import { readdir, writeFile } from 'node:fs/promises';
import { allCards } from '../data/cards.ts';
const directory = new URL('../public/cards/', import.meta.url);
const files = await readdir(directory);
const manifest: Record<string, string> = {};
for (const card of allCards) {
  const file = files.find(name => ['webp', 'png', 'jpg', 'jpeg', 'avif'].some(ext => name.toLowerCase() === `${card.id}.${ext}`));
  if (file) manifest[card.id] = `/cards/${file}`;
}
await writeFile(new URL('manifest.json', directory), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(new URL('../card-list.csv', directory), '\uFEFFid,中文名称,建议文件名\n' + allCards.map(c => `${c.id},${c.nameCn},${c.id}.webp`).join('\n') + '\n');
console.log(`Card art ready: ${Object.keys(manifest).length}/78. The remaining cards use an explicit placeholder.`);
