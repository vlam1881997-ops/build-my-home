# A R2/R3/R5 — 2026-10-14

TEST-ONLY, WIP on PR48. No commercial/professional/visual acceptance claimed.

## Changes

- Explicit `releasedUse` choices (`unassigned`, `office`, `laundry`, `storage`) preserve the bedroom and core, add a measured room and its own corridor door when feasible, and transfer an affected outside window with an explicit change record. No implicit application. Preview/commit equality, source revision/locks, history and furniture rules still apply. Unsupported balcony/terrace use rejects; no fake open-space slab.
- `compareRoomDepthOptions` reports feasible/rejected alternatives and existing provisional assessment; missing sourced prices remain unknown. Wide fixture cannot fit the office under this packer's limits and correctly rejects it; laundry/storage fit with a requested 3m bedroom depth.
- `prepayments` extends the monthly loan engine for supplied end-month extra principal/fee. Only `prepaymentMode: reduce-payment` is supported: keep maturity, recast next payment, charge explicit fees once. Missing fee keeps total unknown; excessive principal and unsupported term-shortening reject. Existing A finance form includes the input; B UI is unchanged.

## Evidence

Node22.23.0: 62/62 component/regression tests, build and syntax check pass. SHA256 source map attached. Official Node runtime archive was checksum-verified. No app dependencies changed.

Commands:

```sh
node --test tests/team-a-massing.test.mjs tests/team-a-prepayment.test.mjs tests/team-a-commercial.test.mjs tests/customer-design.test.mjs
BMH_EVIDENCE_OUT=/tmp/bmh-r2 node tests/team-a-massing-export.mjs
python tests/team-a-massing-export-qa.py /tmp/bmh-r2
```

102 native SVG sheets (34/33/35) emitted from A production engines; all parse as 420x297mm with correct revision/units/preliminary label. Eight DXFs independently checked by ezdxf: INSUNITS4, 0 audit errors/fixes, parcel areas108/280/176m² and non-shaft room bounds measured in mm. BOQ/quantity JSON revisions match. SHA256 of every output is in summary.json.

All SVG sheets rasterized with existing Sharp and inspected in three contact sheets; enlarged changed townhouse/wide plans and a BOQ sheet inspected. This is SVG visual QA, not native browser/PDF or owner aesthetic approval. Raw reproducible outputs remain in isolated QA scratch, not a customer construction dossier.

## Gates still open

- Existing Chromium is truncated (111MB with ELF section headers expected beyond209MB) and crashes before a page opens. Automatic approval review rejected downloading @sparticuz/chromium133 from npm, citing the user requirement to use the existing browser. No bypass/alternate browser execution attempted after rejection. Replacing this broken QA browser requires explicit permission. Native desktop/mobile and native pdf-lib PDF remain blocked, not passed.
- Full-suite asset checks still need omitted PR47 assets restored; no full-suite result claimed for this patch.
- B explicit room-option UI, outdoor/loggia/terrace enclosure/roof/railing contract, final 3D parity and visual approval remain open.
- Official Codex Security scan unavailable: mandatory config-preflight reference/capability missing. No scan completion claimed.
- Survey/planning/geotech/structural/MEP/lift/real quote inputs remain unknown/awaiting-review. No engineering or banking approval inferred.
