# BMH image pipeline

Locate the current checkout of `vlam1881997-ops/build-my-home`.

- `src/45_studio3d.js`: measured scene, camera, image reference capture, cinematic signature and Gemini calls.
- `src/46_architectural_render.js`: immediate PNG, sharper raster capture, optional physical renderer, budgets, disposal and download controls.
- `src/43_scene_assets.js`: scene materials, procedural textures and furniture geometry.
- `src/85_interior_collections.js`, `src/86_visual_materials.js`: complete selected collection and visual material metadata. Supplier SKUs and simulated finishes are separate.
- `api/gemini-render.mjs`: bounded server render request and image response.
- `server/_home_finish_handler.mjs`, `src/80_home_finish.js`: photograph-based finishing.
- `tests/instant-preview.test.mjs`, `tests/instant-preview.browser.cjs`: caching, exports, material changes and camera preservation.

Cache a generated image against both design identity and reference-image identity. Changing the camera must not reuse a previous view. Check persistence per project and per room. Do not wait for an AI call before displaying or exporting interactive 3D.

For raster exports, preserve camera framing, tone mapping and colour space; cap pixel count on phones, restore canvas/composer size and post-processing state, and reject a scene replaced while encoding. Measure from the user's click to an actual PNG download. Check PNG signature, dimensions, visible content and absence of path-tracer/AI requests.
