# Modern R1 measured visual review

Resume source: PR63 B branch; baseline6de507f. Runtime ownership stays B for43/45/85/103 and B-prefixed review/test files. A state/schema/drawing/finance/build files were restored only to execute the existing measured fixture, without changes.

## Review environment

Pinned app Three0.160.1 is unchanged. Isolated review tools: Node22.23.0, @napi-rs/canvas for the actual production Canvas factories, Blender4.5.13 official archive SHA256 da4e69b06b75b9e642d106496c50e7e240218b411d2f6e18271c1d1d819cef91. These are authoring/review tools, not application runtime dependencies. No new paid service or plugin activation.

Install Canvas/Three into a separate runtime and expose its node_modules to this review checkout. If this renderer should become a mandatory CI job, ask A to register its dev dependency/build job rather than silently editing the app package manifest.

```
BMH_REVIEW_COLLECTION=modern-natural node tests/team-b-modern-scene.mjs living /tmp/modern-review
BMH_REVIEW_SAMPLES=48 BMH_REVIEW_WIDTH=1600 BMH_REVIEW_HEIGHT=1300 blender -b -t 4 --python tests/team-b-modern-render.py -- /tmp/modern-review/scene-living.json REPO /tmp/modern-review/living.png
```

Valid views remain exterior/living/bed/kitchen/bath. Scene output includes preserved plan assertion, new finish revision, exact transformed production meshes, vertex colors and production Canvas/PBR maps. Sun position/target/color/intensity are serialized from the actual scene constructor. Focused-room daylight is aligned to the largest measured opening and explicitly marked presentation-only, not a solar study. HDR background, fill and tone mapper are offline review presentation; this is not native WebGL appearance or a surveyed surroundings/solar study.

Without BMH_REVIEW_COLLECTION, the original reference finish selections remain. With it, the existing public applyInteriorCollection API selects the new collection; the measured plan is asserted unchanged. It is a generic visual design, not an exact manufacturer SKU or construction approval.

Only changed related regressions should run. Required new targeted file: team-b-modern-natural.test.mjs. Relevant existing scene tests: upholstery/envelopes, collection selection, finish isolation, texture channels, cache and disposal. Full-house geometry/import gates from W20 need not be repeated for unchanged plan geometry.

Next visual gate: compare actual final living image to user's AI target, then affected other rooms. Keep PR draft until image/geometry/GPU acceptance and the full R1 exterior/interior gates are met. Thumbnail is an actual Cycles render from this measured fixture, never the AI target image.
