import { mkdir, rename } from 'node:fs/promises';
import sharp from 'sharp';

const art = 'public/art';
const out = 'app';
await mkdir(out, { recursive: true });

const starField = (dots) => dots
  .map(([x, y, r, o]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#f6d78d" opacity="${o}"/>`)
  .join('');

const iconBackground = (size, radius) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="30%" cy="18%" r="110%">
      <stop offset="0%" stop-color="#54397a"/>
      <stop offset="55%" stop-color="#2e1f50"/>
      <stop offset="100%" stop-color="#170e2e"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#bg)"/>
  ${starField(size === 512
    ? [[398, 82, 4, 0.95], [451, 164, 2.5, 0.7], [82, 317, 3, 0.8], [358, 410, 2.5, 0.6], [123, 123, 2, 0.6]]
    : [[141, 29, 1.6, 0.95], [159, 58, 1, 0.7], [29, 113, 1.2, 0.8], [126, 144, 1, 0.6]])}
</svg>`;

async function icon(size, radius, file) {
  const pony = await sharp(`${art}/twilight-guide.webp`)
    .extract({ left: 24, top: 0, width: 356, height: 356 })
    .resize(size, size)
    .toBuffer();
  const layers = [
    { input: Buffer.from(iconBackground(size, radius)) },
    { input: pony, left: 0, top: 0 },
  ];
  if (radius > 0) {
    layers.push({
      input: Buffer.from(`<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="#fff"/></svg>`),
      blend: 'dest-in',
    });
  }
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toFile(file);
}

await icon(512, 110, `${out}/.icon-512.tmp.png`);
await icon(180, 0, `${out}/.icon-180.tmp.png`);
await rename(`${out}/.icon-512.tmp.png`, `${out}/icon.png`);
await rename(`${out}/.icon-180.tmp.png`, `${out}/apple-icon.png`);

const village = await sharp(`${art}/village-night-wide.webp`)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .toBuffer();
const pony = await sharp(`${art}/twilight-guide.webp`)
  .resize(500, 600)
  .toBuffer();
const overlay = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="halo" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#8f6bd4" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#8f6bd4" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="55%" stop-color="#170e2e" stop-opacity="0"/>
      <stop offset="100%" stop-color="#170e2e" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)"/>
  <circle cx="930" cy="300" r="330" fill="url(#halo)"/>
</svg>`);
await sharp(village)
  .composite([
    { input: overlay },
    { input: pony, left: 930 - 250, top: 630 - 600 + 12 },
  ])
  .jpeg({ quality: 88 })
  .toFile(`${out}/opengraph-image.jpg`);

console.log('生成完成：app/icon.png、app/apple-icon.png、app/opengraph-image.jpg');
