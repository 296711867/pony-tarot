# -*- coding: utf-8 -*-
"""export_cursor.py — 渲染光标多尺寸 PNG + 深浅底预览表。"""
import os, re, subprocess
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
SIZES = [128, 48, 32, 24]

svg = open(os.path.join(HERE, "wand.svg"), encoding="utf-8").read()

def checkerboard(w, h, cell=10):
    im = Image.new("RGB", (w, h), (236, 231, 239))
    px = ImageDraw.Draw(im)
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2:
                px.rectangle([x, y, min(x+cell, w), min(y+cell, h)], fill=(48, 36, 67))
    return im

def render(px_size, out):
    page = re.sub(r'width="\d+" height="\d+"', f'width="{px_size}" height="{px_size}"', svg, count=1)
    html = os.path.join(HERE, "_render.html")
    open(html, "w", encoding="utf-8").write(
        f'<!doctype html><body style="margin:0;width:{px_size}px;height:{px_size}px;overflow:hidden">{page}</body>')
    subprocess.run([EDGE, "--headless", "--disable-gpu", "--default-background-color=00000000",
                    f"--window-size={px_size},{px_size}", f"--screenshot={out}", html],
                   check=True, capture_output=True, timeout=60)

for s in SIZES:
    render(s, os.path.join(HERE, f"wand-{s}.png"))
    print(f"wand-{s}.png")

# 预览表：三行尺寸 × 深底/浅底
row_h = 150
sheet = Image.new("RGB", (760, len(SIZES) * row_h + 40), (23, 17, 36))
d = ImageDraw.Draw(sheet)
d.text((20, 10), "MAGIC WAND CURSOR  (dark / light)", fill="#eadac5", font_size=16)
for r, s in enumerate(SIZES):
    y = 40 + r * row_h
    d.text((20, y + 4), f"{s}px", fill="#bca9c9", font_size=14)
    icon = Image.open(os.path.join(HERE, f"wand-{s}.png")).convert("RGBA")
    tile = (s + 40, s + 40)
    for c, bg in enumerate([(30, 24, 43), (220, 214, 228)]):
        x = 90 + c * (tile[0] + 30)
        t = Image.new("RGB", tile, bg)
        t.paste(icon, (20, 20), icon)
        sheet.paste(t, (x, y))
    # 放大 4x 的 32px 版本，检查小尺寸形状
    if s == 32:
        big = icon.resize((128, 128), Image.NEAREST)
        sheet.paste(big, (390, y + 5), big)
        d.text((388, y + 2), "32px x4 zoom", fill="#bca9c9", font_size=12)
sheet.save(os.path.join(HERE, "preview.png"))
print("preview.png", sheet.size)
