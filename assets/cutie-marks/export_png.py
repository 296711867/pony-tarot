# -*- coding: utf-8 -*-
"""export_png.py — SVG原生渲染成长边2048px透明PNG，生成预览与对比图。"""
import os, re, subprocess, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SVG_DIR = os.path.join(HERE, "svg")
PNG_DIR = os.path.join(HERE, "png")
CMP_DIR = os.path.join(HERE, "compare")
HTML_DIR = os.path.join(HERE, "export-html")
for d in (PNG_DIR, CMP_DIR, HTML_DIR):
    os.makedirs(d, exist_ok=True)

NODE = r"C:\Asoftware\nodejs\node.exe"
LONG_EDGE = 2048

MARKS = {
    "applejack":  ("ref-applejack.png",  (0, 0, 1148, 1080)),
    "rarity":     ("ref-rarity.png",     (0, 0, 320, 682)),
    "pinkie":     ("ref-pinkie.png",     (0, 0, 580, 870)),
    "rainbow":    ("ref-rainbow.png",    (0, 0, 400, 800)),
    "twilight":   ("ref-twilight.png",   (264, 156, 850, 890)),
    "fluttershy": ("ref-fluttershy.png", (0, 0, 221, 225)),
}

def inline_svg(path):
    with open(path, encoding="utf-8") as f:
        svg = f.read()
    return re.sub(r"<\?xml[^>]*\?>", "", svg).strip()

def render(name, svg_text, w, h, out_png):
    """内联 SVG 页面，viewport 精确等于内容尺寸，普通截屏。"""
    html = f"""<!doctype html><html><head><meta charset="utf-8">
<style>*{{margin:0;padding:0}}svg{{width:100%;height:100%}}</style></head>
<body style="margin:0;padding:0;width:{w}px;height:{h}px;overflow:hidden;background:#20402000">
{svg_text}</body></html>"""
    hp = os.path.join(HTML_DIR, f"{name}.html")
    with open(hp, "w", encoding="utf-8") as f:
        f.write(html)
    subprocess.run([NODE, os.path.join(HERE, "render-svg.mjs"),
                    os.path.join(SVG_DIR, f"{name}.svg"), str(w), str(h), out_png],
                   check=True, capture_output=True, timeout=60)

def checkerboard(w, h, cell=12):
    im = Image.new("RGB", (w, h), (255, 255, 255))
    px = im.load()
    for y in range(0, h, cell):
        for x in range(0, w, cell):
            if (x // cell + y // cell) % 2:
                for yy in range(y, min(y + cell, h)):
                    for xx in range(x, min(x + cell, w)):
                        px[xx, yy] = (228, 228, 228)
    return im

def main():
    only = sys.argv[1:] or list(MARKS)
    for name in only:
        ref_name, _ = MARKS[name]
        svg_path = os.path.join(SVG_DIR, f"{name}.svg")
        svg = inline_svg(svg_path)
        m = re.search(r'viewBox="([-\d. ]+)"', svg)
        vx, vy, vw, vh = [float(v) for v in m.group(1).split()]
        scale = LONG_EDGE / max(vw, vh)
        w, h = round(vw * scale), round(vh * scale)
        out = os.path.join(PNG_DIR, f"{name}.png")
        render(name, svg, w, h, out)
        im = Image.open(out)
        print(f"{name}: viewBox {vx},{vy} {vw}x{vh} -> PNG {im.size}")

    # 对比图：左参考(转灰衬) 右渲染(棋盘格衬，验透明)
    for name in only:
        ref_name, ref_crop = MARKS[name]
        ref = Image.open(os.path.join(HERE, "refs", ref_name)).convert("RGB")
        if ref_crop != (0, 0, ref.width, ref.height):
            ref = ref.crop(ref_crop)
        ren = Image.open(os.path.join(PNG_DIR, f"{name}.png")).convert("RGBA")
        H = 640
        rw = int(ref.width * H / ref.height)
        nw = int(ren.width * H / ren.height)
        ref_s = ref.resize((rw, H))
        board = checkerboard(nw, H)
        ren_s = ren.resize((nw, H), Image.LANCZOS)
        board.paste(ren_s, (0, 0), ren_s)
        cmp_im = Image.new("RGB", (rw + nw + 30, H + 20), (40, 40, 40))
        cmp_im.paste(ref_s, (10, 10))
        cmp_im.paste(board, (rw + 20, 10))
        cmp_im.save(os.path.join(CMP_DIR, f"cmp-{name}.png"))
        print(f"cmp-{name}.png {cmp_im.size}")

if __name__ == "__main__":
    main()
