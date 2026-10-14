# Architecture V3

## Source

- `00_boot.js`: constants, icons, datasets.
- `10_state.js`: one project/UI/access state + local persistence.
- `20_calc.js`: deterministic finance/estimate/fengshui rules.
- `30_planner.js`: geometry, collision, SVG architectural preview.
- `40_exports.js`: XLS/SVG/JSON/ZIP exports.
- `50_screens.js`: 10 screen render functions.
- `60_app.js`: shell, one router/guard, event delegation, map lifecycle.

## Production output

`public/app.js` + `public/styles.css` + assets.

No runtime patch chain. UI components render from state; navigation and paywall all pass through the same controller.
