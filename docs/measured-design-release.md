# Measured design, costs and construction tracking

Customer intent: entered site/household requirements and selected design become measured architectural drawings and the same 3D model, then a traceable planning budget and construction record. The source photo/style cards remain inspiration. Their pixels are never converted into unverified building dimensions.

## One design contract

- Internal coordinates are metres. SVG sheet annotations and CAD DXF are millimetres. Floor zero is the ground floor.
- Room rectangles define plan reference edges, not a certified survey or clear internal room measurements. Wall thickness is explicit and editable. Shared edges create one physical wall.
- `scenePlanGeometry`, `projectLevels`, `stairGeometry`, `stairFloorHoles`, `slabPanels` and `elevatorSpec` remain the shared architectural helpers. The new contract adds roof vertices and model quantities to these helpers, rather than a second independent model.
- The design revision includes measured geometry, roof/wall settings, selected style, materials and finishes. Quotes, loan/family data and construction progress do not change this revision. Raster/AI views remain separately camera keyed.
- The planner exposes a roof plan. Roof plan, elevations, section, model, client ZIP and model quantities use the same roof faces. CAD wall footprints use the same thickness as the model and sheet fills.
- Roof choices are flat, hip, gable and single slope. Style supplies editable suggested parameters. Pitched roofs currently require a rectangular top footprint; irregular footprints are explicitly unresolved rather than filled with an invented roof. Flat roofs retain notches and stair/lift voids.
- Roof surface/color previews follow the style, with customer overrides. Tile/metal/natural/concrete textures are small, scene-owned procedural previews with metre based UVs. They are visual approximations, not manufacturer assets, confirmed product specifications or roof construction details. No additional dependency, paid service or remote texture is installed.
- Roof, wall and style edits share the room undo timeline. A locked room/floor prevents measured roof/wall edits. State merge/reload preserves roof settings and prices.

## Quantity scope

| Quantity | Model basis | Remaining scope |
| --- | --- | --- |
| Gross layout area | Union of room rectangles on each floor | Architectural reference area; not a statutory construction-area measurement |
| Floor slab area | Same room panels and stair/shaft subtraction as WebGL | Does not specify structural design, slab reinforcement or load capacity |
| Floor finish | Slab panels minus wall occupation; door thresholds stay open; lift/stair spaces excluded | Stair tread finish, installation waste and contract measurement rules |
| Ceiling finish | Same panels, next-floor voids and wall occupation | Ceiling system and access/MEP details |
| Wall paint planes | Internal planes up to ceiling, exterior wall planes, exterior gable faces, minus openings | Reveals, corner junctions, mouldings, ceilings, tile/cladding substitutions; use a confirmed contract quantity where needed |
| Doors/windows | One aperture per opening ID, including openings in shared walls once | Product/frame/leaf specification; one group rate only applies when its full scope is confirmed |
| Roof covering | Triangulated 3D surface area | Laps, accessories, drainage, structure and supplier specification |

The contract validates room IDs, floor coverage, finite dimensions, overlap, declared parcel constraints, opening spans/heights/offsets and duplicate openings. Lift alignment/cabin checks are included in the handoff review. Invalid measured geometry blocks design/CAD/model handoff; full project JSON backups remain available for recovery.

Unknown roof/manufacturer/technical information remains visible. Before actual building, project-specific boundary/elevation/geotechnical survey, structural design, MEP/waterproofing details, local planning/permit requirements and qualified professional review are still required. No generated percentage/checklist is a construction approval.

## Prices and budget

- A material quote replaces its category allowance only after a positive integer VND rate, compatible m² unit, real calendar date, source and explicit price scope are supplied. Supply-only prices require separately entered installation labour. Litres/sets are not silently converted to m².
- Quote quantity comes from the model or the user's total contract quantity for that category. A single category rate applies to that entire group. For multiple specifications/rates, use the confirmed weighted rate/quantity from a takeoff or retain the planning allowance; the app does not infer per-SKU quantities from colors or preview images.
- Purchase quantity adds entered waste. Installation labour uses base quantity. Entered tax applies to the resulting net amount. Rates already including tax should have additional tax set to zero. All amounts are checked against safe integer arithmetic.
- An alternative dated quote compares the same product, unit, scope, quantity, waste, tax and labour. Applying it changes price provenance, not geometry, material ID or design revision.
- Structural/MEP budget rows remain package allowances until specialist drawings/takeoffs exist. The old invented concrete/steel/MEP purchase quantities are not used in the final BOQ. Unpriced scopes are `null`, never zero presented as a known price.
- Lift installation, survey/design/procedures and external works are separate scopes. A dated/source-backed amount includes them; zero must explicitly describe inclusion/exclusion in the contract. Missing required scopes are displayed as excluded from the known total.
- BOQ amounts reconcile to the estimate. Contingency is an editable assumption and does not conceal missing scopes. Generic showroom upgrade amounts and performance/climate costs are labeled planning assumptions.
- The client ZIP adds roof SVG, quantity CSV and a cost/quantity JSON with matching revision. It excludes household identities, bank/cash/loan/account/payment data. Async export rejects changed quotes as well as changed geometry/camera.

Primary methodology references checked 2026-10-03: [BXD Circular 37/2026/TT-BXD](https://moc.gov.vn/pl/pages/ChiTietVanBan.aspx?TypeVB=1&vID=740) and [BXD's consolidated takeoff-method announcement](https://moc.gov.vn/vn/Pages/chitiettin.aspx?ChuyenmucID=1196&IDNews=94880). These are not supplier price evidence, project approval, or a claim that the geometric measurements implement every contractual/statutory measurement rule.

## Construction record

Saving a budget baseline records the design revision, price context, known total, model quantities, unknown scopes and exact VND stage allocation. The last five baselines are retained. A later design/quote change displays the new difference but does not change the active baseline.

Physical progress is entered separately for each of seven stages. Missing stages stay unknown. Spending does not mark work complete or imply payment/acceptance. Overall progress is a weighted planning indicator only when all stage entries exist. Existing actual cost inputs and local photo/PDF evidence remain available. Baselines are budget records, not signed approvals.

## Verification

- `npm test`: 238 tests, including 11 measured-design cases for roofs, analytical/triangulated areas, units, openings, slab holes, heights, thickness, errors, scope/unit/date/money checks, reconciliation, privacy, quote comparison, undo and frozen baselines/reload.
- `tests/customer-studio.browser.cjs`: all ten existing functions, real room/material/shaft edits, PNG, parsed GLB, client ZIP, desktop/phone, no automatic AI/path tracing, and storage recovery.
- `tests/measured-design.browser.cjs`: native style/roof/wall/height controls, measured roof plan, mesh triangle area/UVs, quote entry/comparison, estimate export, stage progress, budget change/reload and actual client ZIP on desktop/phone.
- Reference fixture: two floors, 96 m² layout reference area, non-centered openings, stairs and aligned lift. Roof 7 × 9 m at 35° gives 76.90879909197173 m²; rendered triangles give 76.90879546319225 m² (Float32 rounding). Floor height changes update stair rise, walls, section and quantities together.
- Browser runs block third-party services, non-read calls and unmocked API endpoints before navigation. No provider credit, order, merchant mutation, email or real customer project is used for tests.

Environment example (reuse the installed browser/runtime):

```sh
npm run build
NODE_PATH="$CODEX_PRIMARY_RUNTIME_NODE_MODULES" \
FONTCONFIG_PATH=/tmp/bmh-browser-current/fonts \
LD_LIBRARY_PATH=/tmp/bmh-browser-current \
BMH_CHROMIUM_EXECUTABLE=/tmp/bmh-browser-current/chromium \
node tests/measured-design.browser.cjs
```

For a read-only live verification set `BMH_BROWSER_URL` to the BMH origin. The same service isolation is mandatory. Source is published through the existing GitHub/CI/Vercel workflow; generated bundles are not committed.
