# B3 material illustrations, reference prices and measured finishes

Baseline: integrated main42d8653 and resume branch b04de868. Scope is B-owned material/UI/3D consumers; no A measured geometry, schema, build, quantities or finance change.

## Delivered behavior

- Catalog cards use original BMH category illustrations with explicit generic labels. No unlicensed retailer photo is presented as exact SKU. Local CC0 finish samples remain preview textures, not supplier products.
- Catalog95 products contains13 published reference prices: six undated retail web prices checked2026-10-09, seven historical2025/2026-06 prices clearly marked old. The remaining82 retain null. Unit/pack size/region/publisher/source and VAT/labour/transport uncertainty are visible. No assumed daily quote date, shipping/VAT entitlement or project quote overwrite. See price-sources.json.
- Measured cutaway caps follow actual wall colour. Skirting/cornice follows room geometry and floor clear heights, excluding door/low fixture intervals and shafts. Drapery uses exact floor level; bedding is a folded cloth surface. Generic/provisional details never claim structural approval.

## Verification

Node22.23.3 full suite460/460 passed. Real Chromium153 desktop and390px phone material story checks native controls, local images, source/date/stale labels, selected SKU and unchanged measured plan after reload, actual 3D details, all10 routes and no overflow/JS/WebGL errors. See showroom-result.json and validation.json.

Reproduce with declared Node22 and existing Playwright/browser setup:

```sh
npm test
node tests/team-b-style-materials.browser.cjs
BMH_SKIP_GALLERY=true node tests/team-b-release.browser.cjs
```

External paid services are isolated. Runtime uses a software GPU; timings are fixture wall times, not customer hardware guarantees. Screenshot hashes are recorded; images and GLB are reproducible test outputs, not claimed uploaded binaries.

## Remaining work

Exact SKU product photos/texture licences and82 unknown prices need actual supplier evidence. This source is not approval of24 exterior/interior designs. Complete per-style facades/roof/interior assets and owner visual review next. Construction/BOQ/cloud/payment/professional gates retain the status in the integrated commercial-readiness report.
