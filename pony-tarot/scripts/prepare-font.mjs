import { writeFile } from 'node:fs/promises';
const text = '小马利亚魔法塔罗循着星光听见心的回响友谊今日一牌三占卜辰图鉴手札金橡书馆紫悦城堡甜点屋苹果庄园记录设置静下让答案浮现为你而亮每张都是个认识自己的窗口把那些被照瞬间留在这里座安温柔镇新开始力量愚者术师女祭皇帝教恋人战车隐士命运之轮正义倒吊死神节制恶高月太阳审判世界权杖圣杯宝剑币王牌侍从骑王后国给此刻方向可以这样顾过去未来';
const css = await fetch(`https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;600;700&text=${encodeURIComponent(text)}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' } });
if (!css.ok) throw new Error(`Font CSS: ${css.status}`);
const source = await css.text();
const urls = [...new Set([...source.matchAll(/url\((https:[^)]+)\)/g)].map(match => match[1]))];
for (let i = 0; i < urls.length; i++) {
  const response = await fetch(urls[i]);
  if (!response.ok) throw new Error(`Font file: ${response.status}`);
  await writeFile(`public/fonts/serif-sc-${i}.woff2`, Buffer.from(await response.arrayBuffer()));
}
await writeFile('asset-sources/font-source.css', source);
const license = await fetch('https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt');
if (!license.ok) throw new Error(`Font license: ${license.status}`);
await writeFile('public/fonts/OFL.txt', await license.text());
console.log(`Downloaded ${urls.length} title font files.`);
