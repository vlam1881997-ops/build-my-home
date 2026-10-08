---
name: bmh-ui-design
description: Simplify and design the Build My Home web/app interface, navigation, forms and mobile layouts. Use for BMH UX/UI, reducing excessive buttons or choices, progressive disclosure, Vietnamese labels, accessibility and consistent planner, 3D studio and customer dossier workflows.
---

# BMH interface design

Read [the source map](references/interface-map.md) before changing BMH UI.

## Establish the task
1. Locate the actual checkout and applicable AGENTS.md. Confirm current remote source before resuming a release; treat current source and observed UI as authoritative.
2. State the customer task and minimum choices needed to reach its first useful result.
3. Inspect desktop and phone. Count visible controls within the workspace, including those below the fold; distinguish closed details and destructive actions. Capture a before view.
4. Keep the measured model, delegated events, storage and service boundaries. Use the existing vanilla JavaScript/CSS build.

## Design the interaction
- Keep one primary action per decision area. Use short Vietnamese verb labels and labelled selects for mutually exclusive choices.
- Keep all ten established project functions visible: ideas, land, family, drawing, materials, 3D, estimates, banking, construction and handover. The user wants simpler controls within each page, with direct access to materials and banking. Do not replace these functions with three stages or hide them in a generic utility menu. Optional shortcuts may supplement the ten routes.
- Show useful defaults; move occasional precision controls into native details or accessible menus. Preserve access to existing features.
- Keep required errors, lock state, unsupported-device status and unsaved work visible. Explain unavailable actions.
- Consolidate duplicate style/material controls. Retain every available option in compact selectors; use sample imagery for comparison.
- Preserve data-* contracts, form names, SVG/canvas IDs and domain handlers. Forward new controls to real operations; do not substitute a toast or CSS-only state.
- Keep disclosure toggles local to the DOM; do not rebuild WebGL or move its camera.
- Preserve open groups through edits. Keep room selections and cover images isolated by project.
- Use native labels/buttons/select/details, focus-visible states, logical keyboard order, Escape for popovers, readable contrast and comfortable phone targets.
- Adapt mobile layout; keep the canvas usable and prevent horizontal page overflow.

## Verify and finish
Walk the customer task using real controls on desktop and phone. Exercise all ten navigation entries, their actual page functions and sequential Next/Back; verify showroom selection and banking/repayment controls as well as materials in 3D. Test room/floor selection, elevators, drawings and exports where affected. Check exported content and retained geometry/camera, not only downloads. Exercise empty/locked states, keyboard and reload.

Run relevant BMH tests/build. Compare before/after controls with the same fixture and inspect screenshots. Mock billable services. Use the authorized repository deployment workflow and verify the changed interaction live. Report remaining service configuration; UI polish alone does not complete a paid commercial launch.
