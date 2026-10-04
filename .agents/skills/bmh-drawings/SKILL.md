---
name: bmh-drawings
description: Create, inspect and improve measured architectural drawings for Build My Home (BMH), including floor plans, elevations, sections, stairs, elevator shafts, A3 SVG/PDF sheets and millimetre DXF exports. Use for BMH drawing requests, 2D/3D inconsistencies, missing dimensions, connected floors and customer design dossiers.
---

# BMH measured drawings

Read [project-map.md](references/project-map.md) for the source files and data contract. Locate the current Build My Home checkout; do not assume a path from an earlier conversation.

1. Inspect the existing project, source changes and requested revision. Preserve the customer's geometry and saved projects. Work from `project.site` and `project.plan`; use metres internally and explicit millimetres in DXF and dimension labels.
2. Check finite dimensions, floor indices, room overlaps, property boundaries, openings and vertical circulation. Represent elevators as aligned shaft footprints with one shared shaft identifier across floors. Verify floor holes, landing doors, pit and headroom separately. Use manufacturer data for installation requirements; flag missing values instead of inventing universal dimensions.
3. Generate precise plans with SVG or CAD code. Never use image generation to produce dimensioned technical drawings. Build the plan, section, stair/elevator detail and 3D from the same measured geometry. Keep scale, units, revision, floor labels and north direction explicit.
4. Export A3 sheets through the existing drawing pipeline. For a standalone PDF, apply the available PDF skill, render every page and inspect linework, text, dimensions and clipping. Keep printed scale exact; distinguish viewport zoom from sheet scale.
5. Verify a meaningful fixture: at least two floors with a stair or elevator, one non-centred opening and a change of floor height. Check that the exported drawing and 3D agree, doors remain accessible, holes stay open and undo/import retain the revision. Run affected unit tests and a real browser check for interactive changes.
6. Deliver the revised source or drawings with the actual validation results. Label preliminary architectural designs clearly. State missing manufacturer, structural or engineering review when it affects the customer's decision; do not certify construction, accessibility or fire compliance from geometry alone.

Save standalone deliverables through the available Library workflow. Keep externally backed BMH code in its existing repository. Use Vietnamese labels for the customer interface.
