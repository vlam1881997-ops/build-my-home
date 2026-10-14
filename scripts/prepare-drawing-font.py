"""Regenerate licensed Latin/Vietnamese drawing fonts; no network or paid service."""
import base64, io, json
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
out = root / 'assets/fonts'
out.mkdir(parents=True, exist_ok=True)
fonts = []
for style, filename in [('Regular', 'DejaVuSans.ttf'), ('Bold', 'DejaVuSans-Bold.ttf')]:
    font = TTFont('/usr/share/fonts/truetype/dejavu/' + filename)
    options = subset.Options()
    options.layout_features = []
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=list(range(32, 592)) + list(range(0x1E00, 0x1F00)) + list(range(0x2000, 0x2070)) + list(range(0x2100, 0x2200)) + list(range(0x2500, 0x2600)))
    sub.subset(font)
    # Modified fonts have a distinct family name under the upstream license.
    names = {1: 'BMH Plan Sans', 2: style, 3: 'BMHPlanSans-' + style, 4: 'BMH Plan Sans ' + style, 6: 'BMHPlanSans-' + style, 16: 'BMH Plan Sans', 17: style}
    for record in font['name'].names:
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    stream = io.BytesIO()
    font.save(stream)
    cmap = font.getBestCmap()
    glyphs = {str(cp): {'id': font.getGlyphID(name), 'advanceWidth': font['hmtx'][name][0], 'codePoints': [cp]} for cp, name in cmap.items()}
    head, hhea, os2 = font['head'], font['hhea'], font['OS/2']
    fonts.append({'style': style, 'data': base64.b64encode(stream.getvalue()).decode(), 'postscriptName': names[6], 'unitsPerEm': head.unitsPerEm, 'ascent': hhea.ascent, 'descent': hhea.descent, 'capHeight': getattr(os2, 'sCapHeight', hhea.ascent), 'xHeight': getattr(os2, 'sxHeight', 0), 'italicAngle': 0, 'bbox': {'minX': head.xMin, 'minY': head.yMin, 'maxX': head.xMax, 'maxY': head.yMax}, 'glyphs': glyphs})
(out / 'bmh-plansans.json').write_text(json.dumps({'format': 'bmh-font-metrics-1', 'fonts': fonts}, separators=(',', ':')), encoding='utf-8')
(out / 'LICENSE.txt').write_bytes(Path('/usr/share/doc/fonts-dejavu-core/copyright').read_bytes())
print('Prepared regular/bold drawing fonts with Vietnamese glyphs.')
