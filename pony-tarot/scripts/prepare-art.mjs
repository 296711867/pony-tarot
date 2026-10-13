import sharp from 'sharp';
import { stat } from 'node:fs/promises';
for (const name of ['village-wide', 'village-tall', 'village-night-wide', 'village-night-tall', 'twilight-guide']) {
  const source = `asset-sources/${name}.png`;
  const metadata = await sharp(source).metadata();
  await sharp(source).resize({ width: name === 'twilight-guide' ? 600 : 1800, withoutEnlargement: true }).webp({ quality: 88 }).toFile(`public/art/${name}.webp`);
  console.log(`${name}: ${metadata.width}x${metadata.height}, alpha=${metadata.hasAlpha}, webp=${Math.round((await stat(`public/art/${name}.webp`)).size / 1024)} KB`);
}
