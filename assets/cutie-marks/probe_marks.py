# -*- coding: utf-8 -*-
"""probe_marks.py — 探测 6 张可爱标志参考图的几何与配色（探测，不目测）。"""
import sys, os
import numpy as np
from PIL import Image

REFS = os.path.join(os.path.dirname(__file__), "refs")

def load(name):
    return np.array(Image.open(os.path.join(REFS, name)).convert("RGB")).astype(int)

def hexc(rgb):
    return "#%02X%02X%02X" % tuple(int(round(v)) for v in rgb)

def dominant_colors(a, topn=6, bucket=16):
    """量化后的主色分布（排除占绝对多数的背景由调用方判断）。"""
    q = (a // bucket) * bucket + bucket // 2
    flat = q.reshape(-1, 3)
    keys, counts = np.unique(flat, axis=0, return_counts=True)
    order = np.argsort(-counts)[:topn]
    return [(tuple(keys[i]), counts[i] / len(flat)) for i in order]

def components(mask, min_area=200):
    """连通域盒子（4邻域，BFS，图小够用）。"""
    from collections import deque
    h, w = mask.shape
    lab = np.zeros((h, w), dtype=int)
    boxes = []
    cur = 0
    for y in range(h):
        xs = np.where(mask[y] & (lab[y] == 0))[0]
        for x in xs:
            if lab[y, x]:
                continue
            cur += 1
            q = deque([(y, x)])
            lab[y, x] = cur
            x0 = x1 = x; y0 = y1 = y; area = 0
            while q:
                cy, cx = q.popleft()
                area += 1
                x0 = min(x0, cx); x1 = max(x1, cx)
                y0 = min(y0, cy); y1 = max(y1, cy)
                for ny, nx in ((cy-1,cx),(cy+1,cx),(cy,cx-1),(cy,cx+1)):
                    if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                        lab[ny, nx] = cur
                        q.append((ny, nx))
            if area >= min_area:
                boxes.append(dict(x0=int(x0), y0=int(y0), x1=int(x1), y1=int(y1), area=int(area)))
    return sorted(boxes, key=lambda b: (-b["area"]))

for name in ["ref-applejack.png", "ref-rarity.png", "ref-pinkie.png",
             "ref-rainbow.png", "ref-twilight.png", "ref-fluttershy.png"]:
    a = load(name)
    h, w = a.shape[:2]
    print(f"\n===== {name}  {w}x{h} =====")
    print("主色:", [(hexc(c), f"{p:.1%}") for c, p in dominant_colors(a)])
    # 背景四角取色
    corners = [tuple(a[2,2]), tuple(a[2,-3]), tuple(a[-3,2]), tuple(a[-3,-3])]
    print("四角:", [hexc(c) for c in corners])
    # 每个主色（非角背景）做连通域
    for c, p in dominant_colors(a, topn=4):
        mask = (np.abs(a - np.array(c)).sum(axis=2) < 60)
        if mask.mean() > 0.55:   # 背景跳过
            print(f"  [背景跳过] {hexc(c)} {p:.1%}")
            continue
        if mask.sum() < 300:
            continue
        boxes = components(mask)
        print(f"  {hexc(c)} 占比{p:.1%} 连通域{len(boxes)}个:")
        for b in boxes[:6]:
            print(f"    box x:{b['x0']}-{b['x1']} y:{b['y0']}-{b['y1']} w={b['x1']-b['x0']} h={b['y1']-b['y0']} area={b['area']}")
