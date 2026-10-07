# BMH — integrated rounds 3, 4 and 5

Release target: vlam1881997-ops/build-my-home, main; existing Vercel project and www.huiminhbach.id.vn.
Baseline: GitHub main 481161273da1bcc7ae1beb17dc1c6344f35294ed, tree 684ca17f48deb38f39f8771233c69b5281fd98da.

## Customer changes

- Material catalog filters by brand, SKU, style suggestion and price status. Source prices retain actual units, specification, quote/retrieval dates, expiry and nullable VAT/labour/transport scope. Missing amounts stay unknown. Web prices do not become project quotes. Old quotes are retained in history when SKU/specification/unit changes.
- Supplier-to-preview bindings include product identity, surface, room, metre scale and generic exactness. Apply to rooms without manual finishes, a selected room, or explicitly the whole house. Manual colour/profile/collection changes remove unsupported supplier associations. Stale bindings fall back to the selected design style.
- Measured A3 plans, sections, elevations and schedules share parcel/slab/opening geometry and revision. Stair/lift voids stay open. Long Vietnamese labels wrap and continue on later sheets. DXF is millimetres at 1:1 with entity IDs/revision; PDF is vector A3 with explicit preliminary status and printable scale. Unknown structural information is not generated.
- Cultural Feng research sends anonymous derived roles/kua and measured context rather than dates of birth, names, addresses or finance. Each suggestion carries its school, verified source linkage, missing criteria and coverage. Book metadata comes from retrieved page metadata; missing edition/chapter/page stays unknown. Responses retain their own source identities across reload. Research does not move rooms or fixtures.
- House facades distinguish existing design styles while preserving the measured model. GLB exports measured geometry, identities, revision, style and finishes. Camera and walking controls check paths against room boundaries, furniture and voids. Walking is within the selected room; room/floor controls select another view.
- Custom floor programs accept exact width/depth, name, quantity and floor. A request that does not fit remains available with an explanation. Floor transfers retain IDs and update openings/fixtures atomically; locks, undo, saved finishes and authored room collections are preserved.
- Three distinct 1120×630 intake illustrations replace illustration URLs only. Intake inputs, validators and navigation remain. Ten project routes, including Materials and Banking, remain; tabs 7–10 keep their business flows. Occasional controls use native disclosures that retain open state during edits.

## Verification evidence

- Integrated build and app syntax check passed.
- 348 local Node checks passed; 57 BMH Team coordinator checks passed.
- Local PostgreSQL/PGlite execution was unavailable because the pinned package symlink target was missing in the resumed workspace. The full unchanged SQL migration test remains required in npm test and GitHub Actions; merge requires CI success after npm ci installs dependencies.
- Isolated Chromium desktop/phone material story passed: three new assets, room scope, protected manual finishes, unchanged renderer/camera/position buffers, stale SKU, reload, anonymous mocked Feng request, source display and reload. Latest measured finish interactions: 37 ms desktop / 29 ms phone on this software-GPU test environment; not a universal latency guarantee.
- Desktop/phone customer experience passed: exact 2.4 × 2.2 m laundry, measured room cards, touch/keyboard movement, whole-house return and reload. Gemini image responses were mocked.
- Desktop customer design passed: floor program, direct edits, locks, undo/persistence, ten routes and banking. Native GLB was downloaded and parsed with GLTFLoader; finite geometry, current revision/opening IDs and exact measured altar bounds were checked. Native PDF was also downloaded.
- Desktop/phone dossier flow passed with a two-floor proposal, elevator, off-centre opening at .137 and long Vietnamese labels. All SVG sheets were rendered. Separate 5×20/two-floor and irregular/three-floor sheet/PDF fixtures were exported. A3 PDFs were opened with Poppler and rendered for visual review.
- Fixture third-party, provider and payment requests were blocked or explicitly mocked. No real orders or paid generation were used.

## Operational boundaries

New source research remains gated by server configuration and confirmed provider quota: GEMINI_SEARCH_ENABLED, GEMINI_FENG_RESEARCH_ENABLED with GEMINI_FENG_RESEARCH_QUOTA=free-verified; material Search uses GEMINI_MATERIAL_SEARCH_QUOTA=allowed. Cache, deduplication, call caps, timeouts and quota/permission blocking remain bounded. These flags do not prove free quota by themselves. Existing deployment secrets were not changed.

Vendor images require verified commercial permission before embedding/proxying; otherwise customers open the product source. Procedural textures are generic approximations, not verified manufacturer SKU imagery. New intake image provenance is recorded separately.

This release improves architectural design and customer workflow. It is not a structural, MEP, surveyed-planning or construction certification. Professional reviews and manufacturer installation requirements remain explicit prerequisites. Payment/cloud capabilities depend on their existing live configuration; no production migration or merchant settings were changed.

## Publication

Publish source/tests/assets only. Verify the remote tree against the locally tested tree, require GitHub CI and Vercel build success, then merge using the expected PR head. Check production deployment status and changed live assets/behaviour after merge.
