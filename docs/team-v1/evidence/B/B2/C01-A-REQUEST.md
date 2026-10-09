# C01 consumer ready for review — schema remains A-owned

B2 reads only `project.plan.furniture[]` as agreed in contracts.md. No parallel store.
The current A branch at 3c7f510 has not implemented the array. Editing is explicitly disabled on that revision to avoid losing user work at reload.

A1 request: add `furniture:[]` to `defaultState().project.plan`. Existing mergeState and planSnapshot/history already preserve known arrays. Validate IDs, room/floor references, finite pose and positive sizes without silently replacing authored items. Preserve removed records. No generated furniture is a confirmed purchase.
B2 tests apply ONLY that proposed default addition in a local test fixture; production migration is not accepted by these tests.

Required A follow-ups: room translation/rotation and native room drag must atomically translate furniture, floor transfer updates the same IDs, proposal regeneration carries explicitly authored rows or asks before discarding. Call B.resolvedFurniture / B.furnitureFootprint for drawings and BOQ; B.customerDesignSnapshot includes rows. Costs: use materialBindings.costTreatment and count present rows once by stable ID; no inferred SKU price.

Runtime supplied in existing registered src/99_customer_design.js; no new build/dependency.
B2 exposes generatedFurniture, resolvedFurniture, furnitureFootprint, furniturePlacementIssues, editFurniture, addFurniture. Plan-positive rotation maps to negative Three y rotation. World footprint uses exact local W/D at any angle, pose is centre x/y and local floor z.
Current door clearance is a conservative rectangle around the full inward sweep plus entrance margin, not an accessibility/pathfinding certification.
Altar remains existing plan.fixtures shared geometry; its current direct editor works, while arbitrary-angle altar migration needs A's C01 decision (do not duplicate it into furniture).
