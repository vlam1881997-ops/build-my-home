# A-only native verification — 14 October 2026

Source baseline: PR48 `8dbff47f6f35f61f7443b86a015917687e44b4ee`. This checkpoint adds tests/evidence, no production engine/dependency change.

- Node 22.23.0: 148/148 A-focused checks pass. Initial run could not import a sparse-checkout file `server/_material_catalog.mjs`; restored the exact base blob `7599570596a50ae3148ae1858cb6821fb35ad742`, no server modification.
- Chromium 133.0.6943.0: replacement QA binary downloaded only after explicit owner approval; npm SHA512 verified. No app dependency added. Old corrupt binary preserved.
- Six native massing cases: desktop/390px phone × three measured synthetic parcels; preview/apply, stale refusal, undo/redo, save/reload, same revision, no page errors. This tests engine calls in the native app; it does not assert a new option-picker UI or 3D approval.
- Two A5 form cases: desktop and touch/mobile; entered terms 120m VND / 12 months / 12% annual, equal principal, month3 extra18m + fee360k. Independent expected month3 closing72m, month4 principal8m. Persistence and malformed missing-fee atomic refusal passed; finance does not change drawing revision.
- Three native vector PDFs use the exact 102 SVG sheets from R2-R5-20261014 (34/33/35). Every PDF page is A3 420×297mm, has searchable revision, and contains no raster images. Poppler rendered all pages; contact-sheet review found no gross clipping. These are synthetic QA drawings, not professionally approved construction documents. Fine-print proof at print scale remains a separate professional review.
- Existing 8 DXFs were independently audited and measured in R2-R5-20261014. No price/engineering/North/planning data was invented.

## Reproduce

Set `BMH_CHROMIUM_EXECUTABLE` to a working Chromium and `NODE_PATH` to the installed Playwright runtime. Use Node22.

1. `BMH_EVIDENCE_OUT=/tmp/a-massing node tests/team-a-massing.browser.cjs`
2. `BMH_EVIDENCE_OUT=/tmp/a-finance node tests/team-a-finance.browser.cjs`
3. `BMH_EVIDENCE_OUT=/tmp/a-export node tests/team-a-massing-export.mjs`
4. `BMH_EVIDENCE_OUT=/tmp/a-export node tests/team-a-massing-pdf.browser.cjs`
5. `python tests/team-a-massing-export-qa.py /tmp/a-export`

## Scope and outstanding work

Owner instruction 14/10: work only on A; postpone checking B and merging A+B. No B task inspection, B edits, merge or deployment in this checkpoint. Older B gate references are historical/future integration requirements, not a current work queue.

A2 outdoor semantics (usable balcony/loggia/terrace, roof/railing/drainage and review evidence) are still incomplete. Current room allocation supports enclosed office/laundry/storage or an explicitly unassigned area only. Source quotes/professional documents remain unknown/awaiting-review. Official Codex Security capability/preflight unavailable; do not read passing functional tests as a security scan.
