import { cp, mkdir, readdir } from 'node:fs/promises';
const root = new URL('../../', import.meta.url);
const source = new URL('assets/cutie-marks/svg/', root);
const icons = new URL('pony-tarot/public/icons/', root);
await mkdir(new URL('ponies/', icons), { recursive: true });
for (const file of (await readdir(source)).filter(file => file.endsWith('.svg'))) {
  await cp(new URL(file, source), new URL(`ponies/${file}`, icons));
}
await cp(new URL('assets/ui-icons/magic.svg', root), new URL('magic.svg', icons));
console.log('Icons ready: pony cutie marks and magic UI sprite.');
