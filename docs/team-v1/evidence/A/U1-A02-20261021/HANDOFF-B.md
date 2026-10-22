# U1-A02 — refuse prices for a different saved room material

Status: **consumer contract ready_for_integration; actual supplier/native acceptance pending**. Date21/10/2026 Asia/Saigon.

## Problem reproduced

With an explicit TEST-ONLY room material and sourced test quote, applying a different saved SKU to that room left commercialBoq pricing the old SKU. A whole-project floor application could also price mixed room SKUs as one material. Stale product specifications and a binding assigned to another room did not invalidate the price. Three new regression cases reproduced these failures before the source fix; they were not native/supplier tests.

## A-only change

- `src/team-a-boq.js`: reconcile actual saved applications with B's existing finishPalette/catalogMaterials/materialBindingStatuses and exterior facade resolver. Supported binding roles are dryfloor,wetArea,wall,facade,joinery, matching current B floor/paint/cabinetry bindings. Unsupported/unbound manual application roles retain the existing explicit-application contract; this is not full SKU/photo coverage for all categories.
- A conflicting or invalid binding adds a row issue and leaves amount:null/status:missing. No automatic quote retarget, price guess, material application or schema change. The user must update the application/quote to the chosen SKU/specification.
- Merely browsing a different catalog selection is not a saved material change. A room-specific application is not invalidated by another room; wet-area flooring does not override dry-floor scope; exterior paint is reconciled separately from interior walls.
- Validation happens before transport allocation so an invalid material row cannot consume the shared delivery charge required by a remaining valid room.
- Standalone costedApplication/compareSourcedAlternatives remain proposal calculations; comparison does not require silently applying its candidate. commercialBoq remains the authoritative current-design total.
- No B source/progress/UI, state schema, pricing rates, build/dependency or production change.

## Verification

- Syntax check passed. Five new registered tests in existing team-a-commercial.test.mjs cover room/browsing/replacement/missingprice, wholehouse versus room/wetarea, stale spec/wrongroom, exterior isolation/alternative preview/immutability, and shared delivery after stale material.
- Three behavior regressions failed before correction; all five pass after correction. Local Node24.19.0.
- Full affected A-commercial + existing B-workflow run:52/53 passed; only failing case was ENOENT for src/46_architectural_render.js in this sparse snapshot. Recovered that exact8a03c90 source read-only, then reran only that case:1/1pass. No fixture placeholder, skipped test or B edit. These results are not a native/GPU or Node22 run; exact remote Node22 CI is required on the source checkpoint.
- Test quotes/products are explicit synthetic records, not supplier imagery, commercial prices, tax guidance or professional review.

## B consumer / dependency

Existing row.issues and row.amount:null/status:missing are sufficient for the current dashboard/CSV/handover consumer; no new UI API is required. Show the existing missing/stale message and allow the customer to update the application/quote; never replace null with0.

Actual U1-B02 Modern SKU/spec/unit/role/room/source/photo/rights manifest is still needed before validating the real supplier set. Existing PR75 image/native/service gates remain open. Do not mark the whole upgrade1 commercial-ready from these source tests.

Next A: integrated package checks U1-A03 when B sample handoff is available; independent U2-A01 uses the existing shared Modern fixture. Preserve U1-A01 baseline artifacts as the pinned8a03c90 snapshot, not as evidence of this later source patch.
