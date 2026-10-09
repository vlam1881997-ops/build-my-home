# B2–B6 validation, 2026-10-09

Source: branch codex/b-v1-24, draft PR36. Node22.23.3; Chromium153.0.8010.0. npm test397 and37 additional B checks passed. See source-checks.json for tested source hashes.

Desktop1440×1040 and phone390×844 ran visible editor controls, angle37°, lock/delete/restore, 2D drag desktop, raycaster selection both, 3D drag desktop with unchanged camera, GLB download and binary vertex checks, all10 navigation tabs, file/defect report annotation and real local reload. No pageerror or document overflow. Failed bank-directory requested once; fallback retained, no render loop. Separate project namespaces preserved original evidence/style-image bytes when a second project reused the file ID.

**C01 is proposed, not integrated**: the test-served default schema injects furniture:[] before exercising the shared measured consumer. No production/A source is patched by the test. Without A's schema, production editor writes remain disabled. Provider requests are blocked/mock; this does not prove multi-device Storage/RLS, real merchant recovery or integrated A geometry/BOQ/revision acceptance.

Gallery:48 raster candidates from the actual measured8×18m, two-storey kitB, floor heights3.8m/3.4m. Geometry and opening coordinates stayed unchanged through all24 selected styles. Exterior/interior PNGs and two contact sheets are included. Existing generic asset/profile library and illustrative sky/ground are used. Capturing all styles does not establish visual approval or manufacturer sample equivalence.

Visual inspection: style changes affect roof family, trim/palette and room furnishing/materials. The exterior kit still shares a simple massing; classic/neo/French and some pitched-roof styles are too similar for final design-library acceptance. Interiors reuse a limited set of generic collections. The current candidates are **not approved commercial visuals**. A3 style-specific measured plans/roof/envelope constraints plus further B3 asset/detail refinement and owner review are required. No invented balconies/openings/structural geometry have been added just to make the screenshots prettier.

Reproduce logic:

    npm test
    node --test tests/team-b-bank-directory.test.mjs tests/team-b-furniture.test.mjs tests/team-b-media.test.mjs tests/team-b-workflow.test.mjs tests/team-b-style-materials.test.mjs

Reproduce UI and gallery on Node22 with Playwright and a compatible Chromium:

    BMH_CHROMIUM_EXECUTABLE=/path/to/chromium node tests/team-b-release.browser.cjs

All services remain isolated. BMH_SKIP_GALLERY=true runs only device stories; BMH_GALLERY_ONLY=true runs only gallery. Use BMH_EVIDENCE_OUT to separate runs; merge result files deliberately. No privileged/paid backend operation is run by this harness.

Final backend guard/timestamp/customer wording checks:434 total Node22 passed. Previous real-browser interactions and gallery retained; they are not reclassified as a fresh production browser run. RawGLB is not in GitHub; glb-validation.json records the downloaded binary hash/IDs/pose and reproduction path. Vercel preview READY but protected; authenticated connector fetch failed.
