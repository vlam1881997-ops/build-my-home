# Modern R1 measured visual review

Resume source: PR63 B branch; baseline6de507f. Runtime ownership stays B for43/45/85/103 and B-prefixed review/test files. A state/schema/drawing/finance/build files were restored only to execute the existing measured fixture, without changes.

## Review environment

Pinned app Three0.160.1 is unchanged. Isolated review tools: Node22.23.0, @napi-rs/canvas for the actual production Canvas factories, Blender4.5.13 official archive SHA256 da4e69b06b75b9e642d106496c50e7e240218b411d2f6e18271c1d1d819cef91. These are authoring/review tools, not application runtime dependencies. No new paid service or plugin activation.

Install Canvas/Three into a separate runtime and expose its node_modules to this review checkout. If this renderer should become a mandatory CI job, ask A to register its dev dependency/build job rather than silently editing the app package manifest.

```
BMH_REVIEW_COLLECTION=modern-natural node tests/team-b-modern-scene.mjs living /tmp/modern-review
BMH_REVIEW_SAMPLES=48 BMH_REVIEW_WIDTH=1600 BMH_REVIEW_HEIGHT=1300 blender -b -t 4 --python-exit-code 1 --python tests/team-b-modern-render.py -- /tmp/modern-review/scene-living.json REPO /tmp/modern-review/living.png
```

Valid views: exterior/whole/living/kitchen/bed/bath/stairs/terrace. Scene output includes preserved plan assertion, new finish revision, exact transformed production meshes, vertex colors and production Canvas/PBR maps. Sun position/target/color/intensity are serialized from the actual scene constructor. Focused-room daylight is aligned to the largest measured opening and explicitly marked presentation-only, not a solar study. HDR background, fill and tone mapper are offline review presentation; this is not native WebGL appearance or a surveyed surroundings/solar study.

Without BMH_REVIEW_COLLECTION, the original reference finish selections remain. With it, the existing public applyInteriorCollection API selects the new collection; the measured plan is asserted unchanged. It is a generic visual design, not an exact manufacturer SKU or construction approval.

Only changed related regressions should run. Required new targeted file: team-b-modern-natural.test.mjs. Relevant existing scene tests: upholstery/envelopes, collection selection, finish isolation, texture channels, cache and disposal. Full-house geometry/import gates from W20 need not be repeated for unchanged plan geometry.

Next visual gate: compare the measured views against the selected Modern target. R1 remains incomplete until image/geometry/GPU acceptance and the full exterior/interior gates are met. The user authorized incremental releases of verified fixes; such a release does not close these R1 gates. Thumbnail is an actual Cycles render from this measured fixture, never the AI target image.

## W23 material / model consistency

The per-item choices use the same furnitureFinishPalette in parametric and licensed models. Current C01 visualProfileId / textureAssetId / realWorldScale now contribute to the export revision; old images cannot be reused after a subsequent finish edit. Explicit item finishes suppress only the inherited room sample for that role. Resetting the item restores inheritance and preserves SKU references.

For a matched camera/geometry material comparison:

```
BMH_REVIEW_COLLECTION=modern-natural node tests/team-b-modern-scene.mjs living /tmp/material-base
BMH_REVIEW_COLLECTION=modern-natural BMH_REVIEW_ITEM_FINISHES='[{"modelId":"loungeDesignSofa","role":"fabric","profileId":"olive-velvet"},{"modelId":"tableCoffee","role":"floor","profileId":"white-marble"}]' node tests/team-b-modern-scene.mjs living /tmp/material-selected
node --test tests/team-b-furniture.test.mjs
```

Render each exported scene with the same Cycles command above. The scene extractor asserts unchanged resolved furniture dimensions/poses and measured architecture, and records ancestor furniture IDs on actual meshes. `planPreserved` is a strict JSON comparison and becomes false when explicit item finish records are saved; `geometryPreserved` must stay true. W23 compares positions, normals, transforms and indices of every mesh; UV changes are allowed because stone/cloth repeat scales differ. The two changed item models affect 19 meshes; all 155 remaining meshes retain their materials. Four new consistency regressions are in the existing team-b-furniture.test.mjs CI entry. No application dependency or A-owned CI file was changed.

## W24 final-presentation parity

The extractor awaits actual licensed GLB replacements before exporting and fails if a replacement fails. It exports final clipping planes and uses the production final presentation pass, including the opening-aligned room light. Whole-house, stairs and terrace use measured review cameras; indoor rooms use the production room-camera calculation and bathroom horizontal-FOV framing. Cycles reproduces world-space clipping without editing the original architecture. This supports comparison of geometry and material choices; AgX, HDR sampling and offline fill are still different from browser rendering.

Automatic finishes preserve wet-room defaults and explicit customer choices. An unconfirmed terrace gets no invented generated furniture. Explicit saved customer furniture remains. Review scenes must record matching drawing and renderer revisions, unchanged measured geometry, per-view mesh counts and output hashes. Missing guard/drainage/engineering inputs remain unknown.

## W25 kitchen and roof refinement

Kitchen refinement changes internal measured meshes only: the stone worktop has a true sink opening, the hollow cabinet leaves the stainless basin clear, and oven glass/metal controls do not inherit wood or stone. Existing item dimensions, direction and shared plan remain. Three model scales and five rotations are covered by the focused furniture regressions.

The roof review now calls the real production92/103 roof factories with local Canvas instead of substituting a plain roof material. Production already supplied polygonOffset; the old offline adapter lost it and produced false coplanar triangles. The exporter preserves that existing priority and PBR channels. Cycles uses an explicit0.01mm global-up render modifier for flat roof skins; the original exported vertices, roof/slab elevations and openings remain unchanged. This is rendering parity, not a structural repair.

Automatic outdoor flooring is a separate generic concrete proposal. Explicit saved customer finishes win. No waterproofing, slip rating or manufacturer approval is inferred. Retain before images as historical review findings; use the after images for the four affected current views.
