"""Check the six vector exports for transparency, clipping and embedded backgrounds."""
from pathlib import Path
import json
import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
results = {}
for svg in sorted((root / 'svg').glob('*.svg')):
    element = ET.parse(svg).getroot()
    tags = [node.tag.split('}')[-1] for node in element.iter()]
    assert 'image' not in tags and 'rect' not in tags, svg.name
    assert 'path' in tags, svg.name
    image = Image.open(root / 'png' / (svg.stem + '.png')).convert('RGBA')
    pixels = np.asarray(image)
    alpha = pixels[:, :, 3]
    assert not alpha[0].any() and not alpha[-1].any() and not alpha[:, 0].any() and not alpha[:, -1].any(), svg.name
    assert alpha.max() == 255 and alpha.min() == 0, svg.name
    bbox = image.getchannel('A').getbbox()
    assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < image.width and bbox[3] < image.height, svg.name
    results[svg.stem] = {'size': image.size, 'alphaBounds': bbox, 'transparentBackground': True, 'pureVector': True}
    if svg.stem == 'twilight':
        white = np.all(pixels[:, :, :3] == 255, axis=2) & (alpha == 255)
        assert int(white.sum()) > 1000, 'White stars must remain opaque white'
        results[svg.stem]['opaqueWhitePixels'] = int(white.sum())
    if svg.stem == 'applejack':
        vx, vy, vw, vh = map(float, element.attrib['viewBox'].split())
        watermark_region = alpha[int((1020-vy)/vh*image.height):int((1080-vy)/vh*image.height), int((1000-vx)/vw*image.width):int((1148-vx)/vw*image.width)]
        assert not watermark_region.any(), 'Reference footer must not be traced'
(root / 'verification.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
print('PASS: six pure SVGs, transparent PNG edges, no clipping, opaque white stars, reference footer excluded.')
