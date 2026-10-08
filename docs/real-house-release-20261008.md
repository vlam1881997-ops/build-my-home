# Measured house presentation · 2026-10-08

The whole-house view now uses a street-height camera, local daylight environment, photographed mineral/paint finishes and measured roof/opening details. Rooms, windows, stairs and elevators still come from the saved floor plan. An image generator does not supply the model geometry.

## Changes

- Flat roofs expose an optional parapet height in the existing advanced roof controls. The initial 380 mm is explicitly a design suggestion; a entered height overrides it and zero removes it. Pitched roofs do not receive flat-roof parapets. Coping and jamb returns use the same metre-based component registry as elevations and the Three/GLB model, including concave footprints and exploded levels. These remain provisional architectural details, not structural approval.
- Automatic timber facade finishes have vertical grain and bounded board joints. Selected wall/accent colours and supplier IDs remain authoritative. Window handles stay inside the actual opening span; adding presentation detail does not resize or recreate saved openings.
- Locally bundled 512 px colour, normal and roughness channels cover marble, roof tile and fine plaster. The colour channels are neutralized for the chosen customer tint. `assets/interior/real-house-provenance.json` records source URLs, licenses, physical tile sizes and processed hashes. These generic surfaces are not manufacturer samples or confirmed supplier SKUs.
- A bundled 1K HDR supplies daylight and reflections for the whole-house material view. The immediate procedural sky remains a fallback. Loads have a deadline and disposal guards. Neon-to-material toggles reuse the scene-owned texture. Ground and sky are illustrative context, not a surveyed site, planning information or verified sunlight analysis.
- The optional photographic renderer previously assigned the wrong material to walls and glass after a slab with a six-material array. The pinned path-tracer dependency merges one group per mesh while flattening every array entry. Photographic snapshots now split the actual indexed face groups into single-material meshes. The editable model and GLB retain the original six measured slab faces. The dependency-level regression test checks its actual generated material-index attribute.
- Photographs include the presentation ground and reuse the local HDR. Model exports omit presentation context. Fast 3D and sharp native PNG remain available without calling Gemini; high-quality progressive rendering stays optional with its existing time budget.

## Validation

`npm test` includes the new measured-house tests and the actual pinned path-tracer regression. Tests cover explicit parapet removal/height, inclined roofs, notched footprints, matching elevation/model parts, unchanged window spans and stair/elevator voids, source asset hashes and original GLB face groups.

`tests/architectural-identity.browser.cjs` covers desktop and 390 px phone controls, live finishes, native PNG downloads, actual parapet inputs, restored HDR after Neon mode, deleted-window undo, reload persistence and parsed GLB. It isolates the synthetic project before loading the app and blocks API writes and external services. Software WebGL first-frame timings are environment-specific and do not establish customer GPU performance.

## Accuracy and release scope

This release improves measured visualization. It does not certify commercial readiness, engineering, planning permission, an arbitrary reference-photo match, manufacturer fidelity or final construction costs. Suggested facade/parapet finish areas can overlap and are not added as priced net construction quantities. Their structure, waterproofing/drainage and quotations require project-specific confirmation.

No new provider charge, subscription, external runtime asset API, database migration or project deletion is introduced. Reverting the source commit restores the preceding architectural presentation; drawing/render revision keys invalidate stale imagery without erasing saved projects.
