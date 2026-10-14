"""Independent millimetre DXF/SVG checks for changed A-R2 synthetic cases."""
import json
import math
import hashlib
import sys
from pathlib import Path
import xml.etree.ElementTree as ET
import ezdxf

root=Path(sys.argv[1]);results=[]
def meta(e):
    return dict(t.value.split('=',1) for t in e.get_xdata('BMH') if t.code==1000 and '=' in t.value) if e.has_xdata('BMH') else {}
def points(e):
    return [(float(x),float(y)) for x,y,*_ in e.get_points()]
for case in ['townhouse','wide','concave']:
    d=root/case;ev=json.loads((d/'evidence.json').read_text());plan=json.loads((d/'plan.json').read_text());revision=ev['revision']
    for name in ['quantities','boq']:assert json.loads((d/(name+'.json')).read_text())['revision']==revision
    svgs=list(d.glob('sheet-*.svg'))
    for file in svgs:
        svg=ET.parse(file).getroot();assert svg.attrib['viewBox']=='0 0 420 297';assert svg.attrib['data-revision']==revision
        assert svg.attrib['data-model-unit']=='m' and svg.attrib['data-dimension-unit']=='mm'
        assert 'CHƯA DÙNG THI CÔNG' in ''.join(svg.itertext())
    floors=[]
    for floor in range(ev['site']['floors']):
        doc=ezdxf.readfile(d/f'floor-{floor}.dxf');assert doc.header['$INSUNITS']==4
        audit=doc.audit();assert not audit.errors and not audit.fixes
        entities=list(doc.modelspace());boundary=next(e for e in entities if e.dxf.layer=='PLOT');pts=points(boundary)
        area=abs(sum(x*pts[(i+1)%len(pts)][1]-pts[(i+1)%len(pts)][0]*y for i,(x,y) in enumerate(pts)))/2/1e6
        assert math.isclose(area,ev['parcelArea'],abs_tol=1e-6)
        for e in entities:assert meta(e)['revision']==revision and meta(e)['units']=='mm'
        for room in [r for r in plan['rooms'] if r['floor']==floor and r['type'] not in ['stairs','elevator']]:
            panels=[e for e in entities if meta(e).get('kind')=='slab-panel' and meta(e).get('roomId')==room['id']]
            assert panels,room['id'];ps=[q for e in panels for q in points(e)]
            for actual,expected in [(min(x for x,y in ps),room['x']*1000),(max(x for x,y in ps),(room['x']+room['w'])*1000),(min(y for x,y in ps),-(room['y']+room['h'])*1000),(max(y for x,y in ps),-room['y']*1000)]:assert abs(actual-expected)<.002,(room['id'],actual,expected)
        floors.append({'floor':floor,'INSUNITS':4,'auditErrors':0,'auditFixes':0,'parcelAreaM2':area,'roomBoundsMm':True})
    pdf_result={'status':'not-generated'}
    pdf_file=d/'BMH-A3.pdf'
    if pdf_file.exists():
        from pypdf import PdfReader
        pdf=PdfReader(pdf_file);assert len(pdf.pages)==len(svgs)
        for page in pdf.pages:
            assert abs(float(page.mediabox.width)-420*72/25.4)<.01
            assert abs(float(page.mediabox.height)-297*72/25.4)<.01
            text=page.extract_text()
            assert revision in text and 'CHƯA DÙNG THI CÔNG' in text
            assert not page.images
        pdf_result={'status':'checked','pages':len(pdf.pages),'a3':True,'searchableRevisionEveryPage':True,'rasterImages':0,'sha256':hashlib.sha256(pdf_file.read_bytes()).hexdigest()}
    results.append({'fixture':case,'revision':revision,'sheets':len(svgs),'floors':floors,'pdf':pdf_result,'professionalReview':'awaiting-review'})
(root/'export-validation.json').write_text(json.dumps(results,indent=2)+'\n');print(json.dumps(results,indent=2))
