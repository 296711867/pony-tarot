"""Probe reference colors, preserve individual silhouettes, and emit editable SVG paths.

Curves smooth raster stair steps; sharp corners remain sharp. SVGs contain no bitmap.
"""
from pathlib import Path
import json
import shutil
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
# Background is a classification swatch only, never an exported shape.
PALETTES = {
    'rainbow': ['#000000', '#0093d0', '#fee96c', '#ef4135', '#ffffff'],
    'pinkie': ['#000000', '#7bd4f9', '#fff7ad'],
    'rarity': ['#ffffff', '#71cdf2', '#0d91c6'],
    'applejack': ['#000000', '#ea3f40', '#5eb84f'],
    'twilight': ['#daabdf', '#e64176', '#ffffff'],
    'fluttershy': ['#000000', '#f4b6d2', '#6ccbc8'],
}

def rgb(value):
    return [int(value[i:i+2], 16) for i in (1, 3, 5)]

def cleaned(mask, minimum):
    count, labels, stats, _ = cv2.connectedComponentsWithStats(mask.astype('uint8'))
    keep = [i for i in range(1, count) if stats[i, cv2.CC_STAT_AREA] >= minimum]
    return np.isin(labels, keep).astype('uint8')

def contour_path(contour, epsilon, curved):
    points = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2).astype(float)
    if len(points) < 3:
        return ''
    fmt = lambda p: f'{p[0]:.2f},{p[1]:.2f}'
    if not curved:
        return 'M' + ' L'.join(map(fmt, points)) + ' Z'
    tangents = []
    for i, p in enumerate(points):
        a, b = p - points[i-1], points[(i+1) % len(points)] - p
        cosine = np.dot(a, b) / max(np.linalg.norm(a) * np.linalg.norm(b), 1)
        # Preserve pointed wing notches, knots and lightning corners.
        tangents.append((a+b) / 6 if cosine > .35 else np.zeros(2))
    path = 'M' + fmt(points[0])
    for i, p in enumerate(points):
        j = (i+1) % len(points)
        path += f' C{fmt(p+tangents[i])} {fmt(points[j]-tangents[j])} {fmt(points[j])}'
    return path + ' Z'

def paths(mask, epsilon, curved):
    contours, _ = cv2.findContours(mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    return ' '.join(contour_path(c, epsilon, curved) for c in contours if cv2.contourArea(c) > 2)

report = {}
smooth_shapes = json.loads((ROOT / 'smooth_shapes.json').read_text(encoding='utf-8'))
archive = ROOT / 'archive-v1'
if not archive.exists():
    for folder in ('svg', 'png', 'compare'):
        shutil.copytree(ROOT / folder, archive / folder)

for name, palette in PALETTES.items():
    source = np.array(Image.open(ROOT / 'refs' / f'ref-{name}.png').convert('RGB'))
    if name == 'fluttershy':
        source = cv2.GaussianBlur(source, (3, 3), .65)
    source = source.astype(float)
    swatches = np.array([rgb(c) for c in palette])
    classes = ((source[:, :, None, :] - swatches) ** 2).sum(axis=3).argmin(axis=2)
    minimum = 2000 if name == 'applejack' else (8 if name == 'fluttershy' else 60)
    masks = [cleaned(classes == i, minimum) for i in range(1, len(palette))]
    foreground = np.maximum.reduce(masks)
    yy, xx = np.where(foreground)
    x, y, w, h = int(xx.min()), int(yy.min()), int(xx.max()-xx.min()+1), int(yy.max()-yy.min()+1)
    pad = max(w, h) * .04
    viewbox = [x-pad, y-pad, w+2*pad, h+2*pad]
    curved = name not in ('twilight', 'rarity')
    epsilon = .75 if name == 'fluttershy' else (1.3 if not curved else .85)
    layers = []
    if name == 'rarity':
        # Diamond silhouettes stay angular; central oval contours stay smooth.
        layers.append(f'<path fill="{palette[1]}" fill-rule="evenodd" d="{paths(foreground, epsilon, False)}"/>')
        outline = paths(foreground, epsilon, False)
        layers.insert(0, f'<defs><clipPath id="diamond-bounds"><path d="{outline}"/></clipPath></defs>')
        layers.append(f'<path clip-path="url(#diamond-bounds)" fill="{palette[2]}" fill-rule="evenodd" d="{paths(masks[1], 1.8, True)}"/>')
    else:
        # One continuous silhouette per connected symbol prevents hairline gaps
        # between wings/body and adjoining lightning stripes. White stars each
        # get a white base, so their edges never inherit magenta.
        count, labels = cv2.connectedComponents(foreground)
        for component in range(1, count):
            region = labels == component
            base = int(np.bincount(classes[region], minlength=len(palette)).argmax())
            if name == 'rainbow':
                base = 1
            layers.append(f'<path fill="{palette[base]}" fill-rule="evenodd" d="{paths(region.astype("uint8"), epsilon, curved)}"/>')
            for index, (color, mask) in enumerate(zip(palette[1:], masks), 1):
                if index != base and np.any(mask[region]):
                    layer = (mask & region).astype('uint8')
                    layers.append(f'<path fill="{color}" fill-rule="evenodd" d="{paths(layer, epsilon, curved)}"/>')
    if name in smooth_shapes:
        # User-approved aesthetic smoothing: hand-authored cubic curves replace
        # low-resolution traced edges; each individual pose remains distinct.
        layers = []
        for shape in smooth_shapes[name]:
            attrs = f'fill="{shape["fill"]}"'
            if 'stroke' in shape:
                attrs += f' stroke="{shape["stroke"]}" stroke-width="{shape["strokeWidth"]}" stroke-linecap="round" stroke-linejoin="round"'
            # Separate overlapping petals so opposite contour winding cannot
            # punch transparent holes through their joined roots.
            parts = [part.strip() + ' Z' for part in shape['d'].split('Z') if part.strip()] if shape['fill'] != 'none' else [shape['d']]
            layers.extend(f'<path {attrs} d="{part}"/>' for part in parts)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{" ".join(f"{v:.2f}" for v in viewbox)}" role="img" aria-label="{name} cutie mark">\n<!-- Reference layout; hand-smoothed curves where configured; transparent background. -->\n' + '\n'.join(layers) + '\n</svg>\n'
    (ROOT / 'svg' / f'{name}.svg').write_text(svg, encoding='utf-8')
    report[name] = {'palette': palette[1:], 'viewBox': viewbox, 'foregroundPixels': int(foreground.sum()), 'epsilon': epsilon}
    print(name, 'viewBox', [round(v, 2) for v in viewbox])
(ROOT / 'probe' / 'repair-geometry.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
