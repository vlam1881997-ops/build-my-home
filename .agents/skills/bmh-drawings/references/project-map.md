# BMH source and geometry contract

- Repository: `vlam1881997-ops/build-my-home`; identify the active checkout before editing.
- State and migration: `src/10_state.js`. Persist new project fields through defaults and normalization; dynamic objects require the merge contract.
- Rooms: `{id,floor,name,type,x,y,w,h}`. Coordinates and sizes are metres; `y` on a plan becomes `z` in Three. Floor indices start at zero.
- Openings: `{id,floor,roomId,kind,side,offset,width,height,sill}`. Resolve actual spans with `openingWallSpan`; preserve shared-wall alignment.
- Planner and validation: `src/30_planner.js`, `src/76_architecture.js`, `src/60_app.js`. Keep dragging, numeric edits, locked floors and undo consistent.
- Drawing/export: `src/40_exports.js`: `drawingSheetSvg`, `openingSheetSvg`, `architecturalSheets`, `planDxf`, `sheetFrame`. `src/81_design_studio.js` provides previews and design views.
- Shared stairs and slab subtraction: `src/79_stair_design.js`: `stairGeometry`, `stairFloorHoles`, `slabPanels`.
- Elevators: inspect `src/87_elevator_design.js` when present; use `elevatorSpec` and shared shaft data. Cut slab voids before adding finish layers.
- Renderer: `src/45_studio3d.js`, `src/78_design_workflow.js`. Read `projectLevels()` rather than assuming a fixed height.
- Tests: `tests/drawing-contract.test.mjs`, `tests/architecture.test.mjs`, `tests/architectural-render.test.mjs`, plus elevator/customer-studio tests when present.

Inspect actual current functions before relying on this map. Build outputs in `dist`/`public` may be tracked legacy files; publish source according to the repository's build workflow, without blindly adding generated assets.

Use current primary manufacturer guides for lift installation dimensions and current official sources for regulated claims. A configurable example footprint is a design placeholder, not a specification for a purchasable lift.
