# -*- coding: utf-8 -*-
"""check_cursor.py — 光标资产程序化验收：纯矢量、透明边、无裁切、尺寸正确。"""
import os
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image

root = os.path.dirname(os.path.abspath(__file__))
tree = ET.parse(os.path.join(root, "wand.svg"))
tags = [n.tag.split("}")[-1] for n in tree.getroot().iter()]
assert "image" not in tags and "rect" not in tags, "SVG 必须是纯矢量 path/circle"
assert "path" in tags
assert tree.getroot().get("width") == "32" and tree.getroot().get("height") == "32", "SVG 光标需要内在尺寸 32x32"

for s in (128, 48, 32, 24):
    a = np.asarray(Image.open(os.path.join(root, f"wand-{s}.png")).convert("RGBA"))
    alpha = a[:, :, 3]
    assert not alpha[0].any() and not alpha[-1].any() and not alpha[:, 0].any() and not alpha[:, -1].any(), f"{s}px 边缘不透明"
    ys, xs = np.where(alpha > 8)
    assert 0 < xs.min() and xs.max() < s - 1 and 0 < ys.min() and ys.max() < s - 1, f"{s}px 内容触边(裁切)"
    assert alpha.max() == 255 and alpha.min() == 0, f"{s}px alpha 不满量程"
print("PASS: 纯矢量 / 四边透明 / 无裁切 / 32x32 内在尺寸")
