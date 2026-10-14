# A outdoor verification — 14 October 2026

Scope: PR48, branch `codex/a-massing-20261013`, parent `43a66a9587bedf2dfb1fea756897fac840cc3edc`. Exact tested source hashes are in `source-hashes.json`. All examples are synthetic TEST-ONLY fixtures, not surveyed projects or construction approval.

## Results

- Node 22.23.0: 160/160 A tests, no failures/skips. Includes atomic proposals, locks/tampering, legacy balcony migration, professional evidence and stale revisions, roof/slab/open edges, quantities, PDF revision guards, finance and sourced BOQ regressions.
- Chromium 133: 12/12 native cases, desktop and phone, three parcels × loggia/terrace. Preview/apply/undo/redo/save/reload tested; outside network blocked. No claim of final 3D or UI option-picker acceptance.
- Six native pdf-lib dossiers: 208 vector A3 PDF pages and corresponding SVGs; 16 DXF floor files. Independent pypdf/ezdxf checks verify page sizes, searchable revision on every page, no raster images, millimetres, measured bounds, parcel areas, outdoor edges and zero DXF audit errors/fixes.
- All208 pages rendered and strictly decoded; all six contact sheets inspected, with detailed section/elevation/outdoor-sheet checks. `visual-review.json` binds renders to final PDF hashes.
- Three parcels: 108 m² townhouse, 280 m² wide house, 176 m² concave parcel. Loggia keeps roof; terrace removes its roof and ceiling while retaining the slab. Section outdoor labels do not claim a ceiling height; elevations retain floor slabs at open edges.
- Pattern secret scan found no matches in changed A source/tests. Manual diff review covers escaping, mutation validation and missing-price handling. This is not the official Codex Security scan: its required preflight reference/capability remains unavailable. npm audit reports one moderate existing dev-only esbuild finding, no high/critical findings; dependencies unchanged.

## Reproduction

Use Node22 and existing project dependencies. Build using the unchanged `node scripts/build.cjs` before browser tests; the dev server alone does not rebuild. Set `BMH_CHROMIUM_EXECUTABLE` to an available working Chromium and make Playwright resolvable.

```sh
node --test tests/team-a-input-furniture.test.mjs tests/team-a-commercial.test.mjs tests/team-a-massing.test.mjs tests/team-a-prepayment.test.mjs tests/team-a-outdoor.test.mjs tests/team-a-pdf-revision.test.mjs tests/measured-design.test.mjs tests/architectural-dossier.test.mjs tests/drawing-contract.test.mjs tests/design-evidence.test.mjs tests/architecture.test.mjs tests/site-finance-contract.test.mjs tests/parcel-feng-pricing.test.mjs
node scripts/build.cjs
BMH_EVIDENCE_OUT=/tmp/bmh-a-browser node tests/team-a-outdoor.browser.cjs
```

For each `BMH_OUTDOOR_USE=loggia` and `terrace`, set an isolated `BMH_EVIDENCE_OUT` directory and run, in order:

```sh
node tests/team-a-massing-export.mjs
node tests/team-a-massing-pdf.browser.cjs
python tests/team-a-massing-export-qa.py "$BMH_EVIDENCE_OUT"
```

Render every PDF page with Poppler and inspect the outdoor detail, roof, elevations and sections. All generated fixture drawings must retain their TEST-ONLY/CHƯA DÙNG THI CÔNG notices. LibreCAD manual measurement has not been performed.

## Acceptance boundary

A source/data/export package is ready for later integration within the documented geometry scope. Customer option UI, final model parity, protected Vercel preview and integrated G1–G6 acceptance remain deferred/unverified. Professional/site/quote/bank inputs are required for a real project. No main merge or production deployment is included.
