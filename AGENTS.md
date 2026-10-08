# BMH project instructions

Upgrade the existing Build My Home app from the user's commercial brief. Keep its vanilla JavaScript/CSS architecture, intake behavior, saved projects and all ten visible functions.

Read `docs/BMH-PHAN-CONG-2-TAI-KHOAN.md` and `docs/BMH-HOP-DONG-DU-LIEU.md` for scope, ownership and acceptance criteria. Use `docs/BMH-UPGRADE-ROUNDS.json` as a planning reference; the BMH Team dashboard accepts the text mission, not a JSON import.

Use the applicable repo skills under `.agents/skills`:
- UI and graphics: bmh-ui-design, bmh-graphic-design.
- Measured plans/exports: bmh-drawings.
- Whole-house model/materials/performance: bmh-3d.
- Illustrative images and exact camera capture: bmh-images.
- Structural inputs and professional review: bmh-construction-design.
- Changed-flow verification and release evidence: bmh-webapp-quality.

Load only the skills relevant to the current task. Skills provide instructions; they do not install CAD/Blender, add an image-generation tool, connect another account, or supply free provider quota.

Parallel work requires exact non-overlapping file ownership. Respect the current task's allowlist even where this document lists a long-term owner. Agree shared data changes first and integrate their dependents after the relevant round. Account 1 owns state/normalization and build registration; Account 2 owns measured geometry and direct drawing/3D modules. Do not both modify shared files.

Keep one measured geometry for SVG/DXF/PDF, 3D and quantities. Use metres internally, millimetres on technical dimensions, stable IDs and a common design revision. Preserve the chosen style, materials and explicit per-room choices across layout changes.

Treat the starting screen as immutable except illustration asset URLs/presentation. Preserve the existing fields, validators, new-house/unfinished-house choices and steps. Tabs 7–10 retain their current UI and business flow; fix only regressions caused by the upgrade.

Keep sources/dates/units and uncertainty for prices, planning and technical assertions. Do not turn map pins into surveyed parcels, missing prices into zero, feng shui into engineering proof, AI imagery into an exact model, or a geometry check into professional review.

Keep provider keys server-side, use the existing Gemini transport, bound calls/retries and honor an explicit free-quota policy. Mock billable generation/payment during development. Use appropriately licensed imagery/models/textures for a commercial product.

In BMH Team worker mode, do not run builds/tests that write generated dist/public. The coordinator builds integrated source once and runs the planned relevant checks. Do not change dependency declarations, push/merge/deploy or modify accounts/authentication as a worker task. Preserve unrelated local work.

Report changes, actual checks and unresolved data/service/browser limits. A ready local integration branch is not a production deployment or a construction-certified dossier.
