# U1-A01 — shared Modern baseline for upgrade1

Status: **ready_for_integration / baseline evidence only**. Captured21/10/2026 Asia/Saigon. The owner explicitly assigned this conversation to A under the five-upgrade/two-ChatGPT plan. B source/progress remains unchanged.

## Reused foundation

- Runtime PR75 e73e0afbc85d4596c806882d8af1d6af10f5ea75; planning/common source8a03c900459cb2b4df03fd11ed8846ed2c0d400b. Prior A3788479 is an ancestor of that common source,106commits behind with0unmerged Acommits. Continue the existing A branch; do not restore the old runtime.
- Reuse `docs/team-v1/evidence/B/Modern-5x20-V01/project.json` and `tests/team-b-modern-reference.mjs` read-only. No second house, generator, schema, geometry store or exported project copy was created.
- Regeneration of the existing fixture under the common source produces identical project data. Only top-level meta.savedAt differs. Current revision: **7BADC039-9AD609B4-AI4-RH3**. Historical B review/README label:7BADC039-741638A5-AI4-RH3. Do not label new exports with the old revision or reuse old labels as proof for current outputs.
- `baseline.json` supplies room/floor IDs,27resolved furniture IDs/poses/sizes/bindings, material choices, API availability and limits. Raw authored furniture count is0; generated IDs are a shared reference, not customer approval. Actual supplier choices remain UNCONFIRMED.
-33source/fixture/build-input files verified against remote Git blob hashes; SHA256/bytes in `source-hashes.json`. Local recovered files had an extra final newline from the previous materialization; the A-only copy was restored only when removing that newline matched the exact remote blob. The B workspace was not edited.

## Checks actually performed

- Existing Modern generator ran on Node24.19.0:11rooms,2floors, engine geometry/stair issues0, no unreachable rooms on either floor.
- bmh-design-review read-only checker:0errors/0warnings, bounded rectangular snapshot scope. `snapshot-review.json` records the unverified parcel topology, door swing, furniture circulation, stair/headroom/guards, structure/MEP and regulation.
-17existing APIs available in the VM fixture. Read-only baseline/API/BOQ inspection did not change project data. BOQ has45unpriced rows and completeTotal:null; no price or source was fabricated.
- Reused prior runtime Node22 CI39525474492 as prior source/test evidence only. This audit itself was local Node24, not native browser/GPU, new Node22 execution, professional signoff or commercial acceptance.
- B97 material sample/package interfaces exist in source but are not loaded by the general unit fixture; full integrated package/native validation is still required for U1-A03 and B QA.

## Needed from B for U1-A02

Provide the actual Modern product/binding manifest: category/role, productId, SKU, specification, quantityUnit, target roomId or exterior scope, visualProfileId, image kind/source/rights evidence, texture scale/rotation where applicable, status and checkpoint SHA. Unverified assets remain unverified. Do not manufacture SKU photos to unblock A.

A can inspect and fix consumer contracts with synthetic TEST-ONLY records independently, but actual supplier/visual acceptance remains pending until that manifest and native evidence exist. No new engine/registration is requested from B.

## Reproduce without rewriting B outputs

1. Use a separate read-only checkout/snapshot of8a03c90, preserving current worktrees. Verify SHA256 against `source-hashes.json` before treating it as this baseline.
2. From that source root run `node tests/team-b-modern-reference.mjs /absolute/scratch/modern-review`; use an external output folder, not the default B evidence folder.
3. Compare its `project` object with the existing B project; ignore only top-level `meta.savedAt`. Compare current drawingRevision, room/furniture IDs and issue lists to `baseline.json`.
4. If the bmh-design-review skill is available, run its existing `scripts/review_snapshot.py` against the original B project. Do not call its clean basic report a construction approval.

Next A work: U1-A02 consumer traceability when B inputs arrive, and dependency-ready U2-A01 using this same fixture. Native preview403 and actual source/professional inputs remain separate gates. No main merge or production action.
