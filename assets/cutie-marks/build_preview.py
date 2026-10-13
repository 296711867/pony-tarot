"""Build inline vector acceptance page and a portable visual contact sheet."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent
names = [('twilight', 'TWILIGHT'), ('pinkie', 'PINKIE'), ('fluttershy', 'FLUTTERSHY'), ('rainbow', 'RAINBOW'), ('rarity', 'RARITY'), ('applejack', 'APPLEJACK')]
cards = []
sheet = Image.new('RGB', (1200, 820), '#171124')
draw = ImageDraw.Draw(sheet)
draw.text((28, 22), 'CUTIE MARKS / REPAIRED VECTORS', fill='#eadac5', font_size=22)
for i, (name, label) in enumerate(names):
    svg = (root / 'svg' / f'{name}.svg').read_text(encoding='utf-8')
    cards.append(f'<article><h2>{label}</h2><div class="pair"><div class="dark">{svg}</div><div class="light">{svg}</div></div><div class="small">{svg}<span>48 px</span></div></article>')
    x, y = 22 + i % 3 * 400, 65 + i // 3 * 370
    draw.rounded_rectangle((x, y, x+375, y+345), radius=15, fill='#251d34', outline='#493951')
    draw.text((x+16, y+14), label, fill='#eadac5', font_size=15)
    icon = Image.open(root / 'png' / f'{name}.png').convert('RGBA')
    icon.thumbnail((150, 235), Image.Resampling.LANCZOS)
    for offset, color in [(12, '#302443'), (193, '#ece7ef')]:
        tile = Image.new('RGB', (168, 265), color)
        tile.paste(icon, ((168-icon.width)//2, (265-icon.height)//2), icon)
        sheet.paste(tile, (x+offset, y+45))
    draw.text((x+15, y+319), 'DARK / LIGHT · TRANSPARENT', fill='#bca9c9', font_size=11)
sheet.save(root / 'preview.png')
html = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>六马标记 · 矢量修复验收</title><style>
*{box-sizing:border-box}body{margin:0;padding:24px;background:#171124;color:#eadac5;font:14px system-ui}h1{font-size:22px;margin:0 0 20px;letter-spacing:2px}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}article{border:1px solid #493951;border-radius:15px;background:#251d34;padding:16px}h2{font-size:12px;letter-spacing:2px;margin:0 0 12px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pair>div{height:175px;display:flex;align-items:center;justify-content:center;padding:12px;border-radius:8px}.dark{background:#302443}.light{background:#ece7ef}.pair svg{width:100%;height:100%}.small{display:flex;align-items:center;gap:12px;margin-top:12px;color:#bca9c9;font-size:11px}.small svg{width:48px;height:48px}@media(max-width:650px){main{grid-template-columns:1fr}.pair>div{height:250px}}
</style><h1>六马标记 · 透明矢量修复</h1><main>''' + ''.join(cards) + '</main></html>'
(root / 'preview.html').write_text(html, encoding='utf-8')
print('preview.html / preview.png ready')
