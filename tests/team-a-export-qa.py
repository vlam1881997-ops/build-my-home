"""Inspect native TASK A exports. Check-only tools; no application dependencies.

python tests/team-a-export-qa.py /tmp/bmh-task-a --render
Requires existing pypdf, ezdxf, Pillow and pdftoppm in the QA environment.
This fixture proves software geometry/export behavior, not construction approval.
"""
import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path

import ezdxf
from PIL import Image
from pypdf import PdfReader


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metadata(entity):
    if not entity.has_xdata("BMH"):
        return {}
    return dict(tag.value.split("=", 1) for tag in entity.get_xdata("BMH")
                if tag.code == 1000 and "=" in tag.value)


def verify(root, render):
    package = root / "package"
    manifest = json.loads((package / "revision-va-ban-giao.json").read_text())
    evidence = json.loads((root / "evidence.json").read_text())
    revision = manifest["revision"]
    assert revision == evidence["revision"]
    assert manifest["financeIncluded"] is False
    assert manifest["boq"]["completeTotal"] is None
    assert manifest["status"]["certifiedForConstruction"] is False
    outputs = []
    for item in manifest["outputs"]:
        path = package / item["fileReference"]
        assert path.is_file() and sha(path) == item["fileHash"], item
        assert item["designRevision"] == revision
        outputs.append({"type": item["outputType"], "file": item["fileReference"],
                        "sha256": sha(path)})
    assert len({x["type"] for x in outputs}) == 10
    texts = [p.read_text() for p in package.rglob("*")
             if p.is_file() and p.suffix in {".txt", ".csv", ".json", ".html", ".svg"}]
    joined = "\n".join(texts)
    for private in ["987654321", "ownerBirth", "PRIVATE-RAW-SURVEY"]:
        assert private not in joined, private
    svgs = list((package / "ban-ve").glob("*.svg"))
    assert len(svgs) == len(evidence["sheets"]) == 32
    for path in svgs:
        content = path.read_text()
        assert 'data-revision="' + revision + '"' in content
        assert "undefined" not in content and "NaN" not in content

    pdf = package / "bo-ban-ve-A3.pdf"
    reader = PdfReader(pdf)
    assert len(reader.pages) == len(svgs)
    pages = []
    render_root = root / "pdf-render"
    if render:
        render_root.mkdir(exist_ok=True)
        subprocess.run(["pdftoppm", "-r", "60", "-png", str(pdf),
                        str(render_root / "page")], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    for i, page in enumerate(reader.pages, 1):
        assert abs(float(page.mediabox.width) * 25.4 / 72 - 420) < .01
        assert abs(float(page.mediabox.height) * 25.4 / 72 - 297) < .01
        content = page.extract_text()
        assert revision in content and "CHƯA DÙNG THI CÔNG" in content
        assert "undefined" not in content and "NaN" not in content
        assert len(page.images) == 0, "A3 export must remain vector"
        image = render_root / f"page-{i:02d}.png"
        if render:
            try:
                with Image.open(image) as im:
                    im.load()
            except (OSError, ValueError):
                # Some renderer environments return zero with a truncated PNG.
                subprocess.run(["pdftoppm", "-f", str(i), "-l", str(i),
                                "-r", "60", "-png", "-singlefile", str(pdf),
                                str(image.with_suffix(""))], check=True)
                with Image.open(image) as im:
                    im.load()
        pages.append({"page": i, "A3": True, "searchable": True,
                      "vector": True, "renderDecoded": image.exists() if render else None})

    floors = []
    parcel = [(0, 0), (10000, 0), (10000, -12000),
              (7000, -12000), (7000, -20000), (0, -20000)]
    for f in range(3):
        path = root / f"floor-{f}.dxf"
        doc = ezdxf.readfile(path)
        assert doc.header["$INSUNITS"] == 4
        audit = doc.audit()
        assert not audit.errors and not audit.fixes, (f, audit.errors, audit.fixes)
        model = list(doc.modelspace())
        boundary = next(e for e in model if metadata(e).get("kind") == "parcel-boundary")
        points = [(float(x), float(y)) for x, y, *_ in boundary.get_points()]
        assert points == parcel and boundary.closed
        area = abs(sum(points[i][0] * points[(i + 1) % len(points)][1]
                       - points[(i + 1) % len(points)][0] * points[i][1]
                       for i in range(len(points)))) / 2 / 1e6
        assert area == evidence["fixtureArea"] == 176
        furniture = [e for e in model if metadata(e).get("kind") == "furniture"]
        for e in furniture:
            assert e.dxftype() == "LWPOLYLINE" and e.closed
            assert metadata(e)["revision"] == revision
        chair_error = None
        if f == 0:
            chair = next(e for e in furniture if metadata(e)["furnitureId"] == "test-seat-37")
            tags = metadata(chair)
            assert [tags[k] for k in ["rotationDeg", "widthMm", "depthMm", "heightMm"]] == ["37", "400", "400", "940"]
            theta = math.radians(37)
            expected = [(3000 + x * math.cos(theta) - y * math.sin(theta),
                         -(3000 + x * math.sin(theta) + y * math.cos(theta)))
                        for x, y in [(-200, -200), (200, -200), (200, 200), (-200, 200)]]
            got = [(float(x), float(y)) for x, y, *_ in chair.get_points()]
            chair_error = max(abs(a - b) for p, q in zip(got, expected) for a, b in zip(p, q))
            assert chair_error < .001
        floors.append({"floor": f, "units": "mm", "areaM2": area,
                       "entities": len(model), "auditErrors": 0, "auditFixes": 0,
                       "furnitureIds": [metadata(e)["furnitureId"] for e in furniture],
                       "chairCornerMaxErrorMm": chair_error, "sha256": sha(path)})
    result = {"testOnly": True, "revision": revision, "pdf": {"file": pdf.name,
              "pages": len(pages), "sha256": sha(pdf), "checks": pages},
              "SVGCount": len(svgs), "outputHashes": outputs,
              "publicCanaryCheck": "passed; specific synthetic private fields only",
              "dxf": {"parser": "ezdxf " + ezdxf.__version__, "floors": floors},
              "visualReview": "recorded separately by reviewer; automated checks do not prove layout"}
    (root / "export-validation.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    (root / "dxf-validation.json").write_text(json.dumps({"revision": revision, **result["dxf"]}, indent=2) + "\n")
    print(json.dumps({"pages": len(pages), "revision": revision, "outputHashes": len(outputs),
                      "DXFFloors": len(floors), "passed": True}))


if __name__ == "__main__":
    args = argparse.ArgumentParser()
    args.add_argument("root", type=Path)
    args.add_argument("--render", action="store_true")
    options = args.parse_args()
    verify(options.root, options.render)
