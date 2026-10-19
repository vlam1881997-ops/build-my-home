# B · Modern R1 completion contract

Scope: one measured Modern house from the existing shared plan, preserving the current production release. No A source/dependency/schema edits. Released interior source:70c5741 / merged PR66 main f3bce504; production dpl_EKuN2Pcf1XmfbdC4jnY1yNBVa7J1 READY. This contract defines remaining acceptance gates; it is not a completion claim.

## R1.1 Interior (measured module/UI increment released; GPU/customer appearance pending)

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

## Current concrete checkpoint

PR66 is merged: source70c5741009ae061bdc2f98aed2c7c6aea95d63f2, main f3bce504a90cbce72883f7f49d33309f3c840e01. Exact source Node22 CI39127354806 SUCCESS; production dpl_EKuN2Pcf1XmfbdC4jnY1yNBVa7J1 READY on www.huiminhbach.id.vn.108 related local checks passed. Native kitchen/bedroom preview/apply/edit/37deg/material/delete/restore/undo/redo/reload checks passed on isolated synthetic data. Final native history-control and saved-furniture room-card regressions passed on the final preview, then verified again on the public domain. The prior personal drawing remains exact after upgrade.

Preview permission is resolved: user authorized23h shares and direct deployment PATCH works without team scope. Wrapper alias lookup can still return403, which is not evidence that the user failed to grant ChatGPT tool permission. Do not repeat login/reconnection instructions. Do not record access secrets in source/evidence. Normal native preview review is now possible.

Evidence is in W26-interior-sets, W29-proposal-review and W30-native-interior. Screenshots show native interface/plan state, not enabled-GPU realism. Cloud WebGL still reports GL_VENDOR/GL_RENDERER Disabled. Required actual GPU desktop/mobile appearance/performance and customer visual acceptance remain open. Full Modern R1 is not complete.

R1.2 still requires actual terrace edge/guard, drainage/waterproofing and reviewer inputs. The synthetic terrace proposal has measured3.58×1.89m area, a0.90×2.10m east access door with sill0 and reachable circulation. This proves only the review proposal geometry. Never invent source-confirmed engineering details to close the gate.

Resume the next open R1.2/R1.3 gate. Do not regenerate unchanged kitchen/bedroom modules, repeat their accepted native UI tests or ask for the already-resolved preview permission again. Preserve all current customer choices and the released personal drawing fixes.


## W31 subsequent verified release

PR69 source48e003e73a95c35e3364b7e973d3e838a91e6598 passed exact-head Node22 CI39129079814 and native preview checks. Merged main b6dd47d50a3227dda7651eb9e4f1aed3ba9911fc; production dpl_6Dc5cGv2zCoukVqpz27s5QmbYsqU READY on the public domain. Twelve scoped local workflow checks passed. Native angle37->53/reload/deletion and terrace panel parity across drawing/3D passed. Production retains saved synthetic furniture, shows measured IDs/revision and exact terrace access/missing technical status. Evidence: W31-lightweight-terrace.

This closes the lightweight block-view discrepancy and terrace information visibility. It does not close enabled-GPU/mobile appearance/performance or source-confirmed terrace engineering/customer/professional approval. Actual technical inputs remain missing; the UI now exposes them clearly. Full Modern R1 remains IN_PROGRESS. No repeat preview permission request, previous accepted test loop or invented guard/drainage design is needed.
