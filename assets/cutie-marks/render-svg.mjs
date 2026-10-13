import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
const require = createRequire(new URL('../../pony-tarot/package.json', import.meta.url));
const sharp = require('sharp');
const [source, width, height, destination] = process.argv.slice(2);
await sharp(await readFile(source), { density: 288 }).resize(Number(width), Number(height)).png().toFile(destination);
