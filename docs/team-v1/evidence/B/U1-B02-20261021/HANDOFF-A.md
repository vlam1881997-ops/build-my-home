# U1-B02 — Modern image/SKU inventory and source-photo guard

Owner B; status **in_progress / inventory ready, real assets pending**. Baseline PR75 `8a03c900459cb2b4df03fd11ed8846ed2c0d400b`. No main or production write.

Reused A U1-A01 handoff from branch A `110133d0d037f74521e9371998167b21ebd418ba` and the original B `Modern-5x20-V01/project.json`. Current derived revision `7BADC039-9AD609B4-AI4-RH3`;11rooms,27resolved furniture. No new house or modified fixture.

## Data for A

`SKU_IMAGE_REGISTER.json` contains52review targets,27furniture references and103existing catalog candidates. Each review target carries role/category/scope/room/floor, current unresolved category choice, binding/product/SKU/spec/unit when actually present, visual profile, sample metadata, source-photo eligibility, candidate IDs and explicit missing fields. This is an image review register, NOT measured BOQ applications; quantity remains null and owned by A. Category candidate IDs do not assert style compatibility or customer selection.

Actual fixture has0confirmed scoped supplier bindings,0eligible supplier photos and0reviewed exact-SKU photos. Do not select a supplier on the owner's behalf to fill these gaps. Generic finishes remain simulations; no supplier image bytes copied and no license flags changed. Rights evidence and actual SKU/spec appearance review are separate.

Reproduce from repo root:
`node tests/team-b-sku-image-register.mjs /absolute/scratch/SKU_IMAGE_REGISTER.json`

## Runtime delta

`src/75_completion.js`: read-only `materialProductPhotoStatus(product)` is used both by catalog card rendering and adoption. A source photograph now requires a nonblank SKU, concrete specification (not catalog placeholder), HTTPS product/image URLs, and existing verified commercial-use source. Eligibility is labelled source-photo-not-product-approval, never commercial acceptance. Missing evidence keeps the generic illustration and source link; products remain selectable and price logic unchanged. No state/schema/geometry/formula/dependency/API registration change.

## Validation

New regression reproduced missing-SKU photo embedding before the fix. After fix all28material-source tests pass on local Node24.19.0. Style/material suite:36cases passed initially;4backup cases hit old82source in the sparse local snapshot, not a runtime regression. Restored exact read-only82from common8a03c90 and reran those4cases:4/4PASS. Combined68cases have passing results. New inventory regression verifies current revision, unresolved selections, candidate-vs-application boundary, room/furniture IDs, null quantities/prices and no invented acceptance. Source syntax passes. Exact Node22 CI and browser/visual acceptance still pending.

## Blockers and next

U1-B01 native preview remains blocked by prior browser observation denial and provider403. This session's metadata read of the recorded preview deployment returned404 not_found; no alternate access/bypass/protection mutation attempted. Provider resource/access must be corrected before native QA. No physical phone GPU is attached in this environment; no device timing invented.

Need source photo + matching SKU/spec + reuse grant + reviewer for products the owner actually chooses. Do not treat all103catalog entries as selected Modern products. A can consume this register now and keep actual supplier gates pending.

Auth/cloud awaits confirmed BMH Supabase resource mapping and U4-A01 contract. MoMo awaits sandbox merchant/configuration. Owner/professional visual and technical approvals remain separate. No paid calls, real payment, supplier messages, production deployment or A file edits.
