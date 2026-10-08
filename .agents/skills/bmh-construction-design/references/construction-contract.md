# Construction inputs and measured geometry

Inspect actual functions before relying on this map. BMH uses a vanilla JavaScript build with an explicit module list in `scripts/build.cjs`; it is not a React/Next.js rewrite target.

## Existing source

| Purpose | Source |
| --- | --- |
| Project state and normalization | `src/10_state.js`, `src/82_customer_projects.js` |
| Parcel and room bounds | `src/76_architecture.js`, `src/30_planner.js`, `src/92_measured_design.js` |
| Direct measured editor and customer program | `src/99_customer_design.js`, `src/100_customer_experience.js` |
| Shared stairs / elevator shafts | `src/79_stair_design.js`, `src/87_elevator_design.js` |
| Architectural roof, elevations and sections | `src/94_architectural_design.js` |
| SVG/DXF and vector A3 dossier | `src/40_exports.js`, `src/95_architectural_documents.js`, `src/96_vector_pdf.js` |
| 3D and presentation | `src/45_studio3d.js`, `src/46_architectural_render.js`, `src/98_model_presentation.js` |
| Measured quantities and prices | `src/20_calc.js`, `src/93_measured_cost.js` |

The architectural section may show that foundations, beams, columns and reinforcement have not been designed. Preserve that state until actual inputs are supplied. Do not fill the gap with convincing but unverified details.

## Data requirements

- Site: parcel identifier when supplied, measured vertices/edges, coordinate reference system, frontage, north, survey origin/date, elevation and each restriction with its official source and applicable area. Preserve raw coordinates and the transformation used. Do not treat WGS84 map coordinates as a precise VN-2000 survey.
- Structural inputs: ground investigation reference, loading cases, spans, support system, material grades, dimensions, elevations, floor ranges and responsible professional evidence. Treat missing values as missing.
- Elements: stable ID, semantic type, floor/elevation, measured footprint/axis, dimensions, source, provisional/reviewed state and dependencies. Keep structural and decorative elements separate.
- Review: discipline, reviewed design revision, reviewer identity/reference, supplied document, date, scope and unresolved issues. A review of one discipline is not approval of every discipline.
- Price: SKU/category, quantity/unit, quote/date/location, tax/labour/transport inclusions and uncertainty. Do not calculate real structural purchase quantities from schematic placeholders.

Use project state extensions and backward-compatible normalization rather than a second independent geometry store. Agree the field contract with the sole state owner before parallel edits. Use the current revision API if one exists; a revision/hash does not itself prove technical approval.

## Focused verification

Check an irregular parcel and two connected levels with a non-centred opening. Confirm that passage/shaft voids remain open in both drawing and 3D. Import a supplied structural element, edit its dimension and verify consistent units/schedules. Change an upstream dimension and mark the affected prior review and package stale. Ensure invalid coordinates, overlaps or unconfirmed setbacks do not overwrite the last valid plan.
