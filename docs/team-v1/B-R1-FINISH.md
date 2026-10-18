# B · Modern R1 completion contract

Scope: one measured Modern house from the existing shared plan, preserving the current production release. No A source/dependency/schema edits. Source baseline: PR65 / main cd13c27; B QA checkpoint c8b46a5. This contract defines remaining acceptance gates; it is not a completion claim.

## R1.1 Interior (active W26)

- Add measured generic kitchen base/wall cabinets, hood, wardrobe, bedside lamps and bed bench through existing plan.furniture records. Record width/depth/height and mounting height in metres. No independent 3D-only fixtures or supplier identity invented.
- Provide one explicit per-room proposal with visible item dimensions/height adjustments, preview and apply. No automatic replacement of a saved project. Preserve existing IDs, positions, rotation, material bindings, locked items and deletion tombstones. Apply atomically with one undo step; reject stale proposals and invalid room/opening/collision/ceiling positions.
- Counter modules align from the actual stovetop worktop height. Any proposed generic sink height adjustment must be listed before apply; authored/locked item dimensions remain untouched unless explicitly included in the proposal. Cabinet bodies/basin/faucet geometry must fit the saved envelope.
- Upper cabinets and hood use existing pose.z. Editor exposes mounting height; plan symbol identifies overhead items and the 3D uses the same z/rotation. Window and door clearances remain clear.
- Bedroom proposal adds only items that fit; wardrobe use clearance must remain available. Removed items are never silently regenerated.
- Gates: exact measured bounds and front direction; correct semantic wood/stone/fabric/glass/metal; shared2D/3D IDs/poses; proposal safety/locks/tombstones/staleness; undo/redo/JSON persistence. Actual kitchen/bedroom before-after source-scene renders, then native UI and deployment checks. Fixtures remain explicit synthetic review proposals, not customer surveys or manufacturer replicas.

## R1.2 Exterior / terrace

- Close material/detail gaps using the same measured facade/elevation data. Preserve roof coverage, stair alignment and measured floor openings.
- Terrace access, guard, drainage and waterproofing require explicit dimensions and source/review status. Unknown values remain unknown; do not invent an approved guard or structural detail merely to improve a picture.
- Gates: actual facade/whole/terrace views and corresponding measured records; material/geometry agreement; no inaccessible door or unguarded edge passed as approved. External source/review inputs can block this gate even if UI code is complete.

## R1.3 Integrated acceptance / release

- Review8 views: facade, whole, living, kitchen, bedroom, bath, stairs, terrace. Each image cites its drawing/render revision and actual production geometry.
- Verify per-item add/move/any-angle rotation/delete/undo/redo/reload and chosen finish persistence; exports invalidate on relevant edits.
- Verify actual enabled GPU desktop/mobile appearance, time to first view/material switch/export and bounded resource disposal. Cloud browser currently disables WebGL; offline Cycles and lightweight UI cannot close this gate.
- Exact release-head Node22 CI, Vercel deployment success, actual domain source/asset identity and native UI evidence. Publish only verified incremental parts; close Modern R1 only after every gate and the required customer/professional review inputs are met.

## Resume rule

Continue the next incomplete substep in PROGRESS-B.md. Push scoped source and evidence checkpoints. Do not reread the whole repository, audit A, expand to another style or rerun unrelated passed checks. A completed code substep or green deployment does not mean R1 commercial acceptance.
