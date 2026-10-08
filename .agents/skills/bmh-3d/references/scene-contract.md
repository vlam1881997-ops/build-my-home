# BMH scene contract

- Repository: `vlam1881997-ops/build-my-home`; find the active checkout.
- Pinned dependencies: inspect `package.json`. The existing renderer uses Three 0.160.1 and a lazy physical renderer; do not mix imports from another Three revision.
- `src/45_studio3d.js`: scenePlanGeometry, measured walls/openings/slabs, camera, compositor, disposal and rendering lifecycle.
- `src/43_scene_assets.js`: detailed parametric furniture and surface materials.
- `src/78_design_workflow.js`: measured furniture placements, GLB loading and a lightweight SVG fallback.
- `src/79_stair_design.js`: stairGeometry and slabPanels. `src/87_elevator_design.js`, when present: shared shaft reservations, elevatorGeometry and landing doors.
- `src/85_interior_collections.js`, `src/86_visual_materials.js`: selected collections, visual materials, immutable texture caches and preservation of the customer's camera.
- `src/46_architectural_render.js`: snapshot exports and optional path-tracing lifetime.
- `src/88_customer_studio.js`, when present: saved views, presentation mode and customer design-only exports.
- `src/89_guided_interface.js`, `src/90_product_polish.js`, when present: final studio controls, cached cover, supplier preview bindings and in-place finish changes. Inspect the final overrides before changing earlier screens.
- `scripts/build.cjs`: explicit entry list and locally vendored Three modules. Add any new module to the build graph.

Read actual implementations before modifying. A view rebuild must not silently launch AI/path tracing. Own and dispose each render target, geometry, material and scene-owned texture once. Do not dispose a shared template image or another project's renderer.

For a finish-only edit, prefer the existing semantic material slots and scene-owned cache. Keep renderer, scene, measured position buffers and camera intact; update physical properties and metre-based UVs together. Preserve each cutaway wall's clipping plane, isolate room assignments and release retired material sets without disposing shared textures. Rebuild for changed structure, furniture collection, project, or an unsupported imported model. Measure the full interaction, including first shader compilation, rather than only the state assignment.

Keep supplier SKU/quotes separate from generic visual profiles. Describe an approximation clearly, carry a binding only when the current product and profile still match, and allowlist any supplier data included in client exports.

For browser tests, use the environment's installed Playwright/Chromium when available; do not install a new browser without need. Apply a proxy only for external URLs when required by the environment. Never log proxy credentials or provider tokens. Test with mocked paid APIs unless a real generated deliverable is requested.

Primary references: https://threejs.org/docs/ and https://github.com/KhronosGroup/glTF/tree/main/specification/2.0 . Consult documentation matching the pinned revision for APIs.
