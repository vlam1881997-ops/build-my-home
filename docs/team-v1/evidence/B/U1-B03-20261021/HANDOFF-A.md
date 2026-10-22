# U1-B02/B03 — image replacement, late upload and finish comparison

Base B6e134b7, source checkpoint identified by branch log. Current A PR76 f9e8009 read for handoff only. No A changes or main promotion.

## Customer changes

- Supplier page refresh no longer carries a previous photo licence to a changed image URL or product source. Same source/image retains existing evidence; no rights fabricated and no image bytes fetched.
- An upload completing after the customer changes that room surface, colour, canonical product unit or room type is rejected without overwriting the newer design. Edits in another room remain allowed. Existing image store, scopes and binding schema retained.
- Optional Materials comparison places the actual current room sample beside a candidate surface. It shows name, colour, pattern description, physical/simulated scale and sample source/angle when applicable. Candidate selection is read-only, does not save/apply/navigate/rebuild3D. It stays within an initially closed native details group. Existing apply controls remain responsible for actual changes. Cross-room/stale-SKU samples cannot appear.

## Files and verification

Source: server/_material_catalog.mjs;src/86_visual_materials.js;src/90_product_polish.js;src/product-polish.css. Registered tests: material-source.test.mjs and team-b-style-materials.test.mjs. No dependency/state/schema/formula changes.

Two new regressions reproduced failures before fixes (old photo rights on replacement; pending upload overwrites newer surface). All72related tests pass on Node24.19.0 after changes, with syntax checks. Coverage includes unchanged-source evidence preservation, relocated source reset, surface/colour/unit/room-type late changes, unrelated-room preservation, comparison scope/metadata/escaping/read-only behavior. Image/canvas/storage are VM fixtures, not real decoding/IndexedDB or GPU evidence.

Exact Node22 CI, native controls/layout/focus/phone review remain pending. Prior browser observation denial and provider access issue have not changed; no reroute or protection changes attempted. Supplier image/source/rights and selected Modern SKU intake remain pending;0actual approved SKU photos. U1-B03 is implementation preparation, not final acceptance or release1 closure.

## A handoff

Same material binding, project and package contracts; only new helper is read-only comparison HTML. A can integrate through the existing sequential mechanism. Keep U1-B04/native and actual-image gates open. No source A consumer changes required for these fixes.
