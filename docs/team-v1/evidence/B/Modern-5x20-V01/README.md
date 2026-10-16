# One Modern reference — V01

Status: **in progress, not approved, not for construction**.

This is the single B review target. Do not start a second house or another style
until the measured design, materials, images and dossier for this target pass.
The 5×20m plot and two floors match the visible app example. Setbacks, heights,
household and room program are explicit synthetic review assumptions, not a
survey, planning certificate or approved customer brief.

## Shared data

- Revision: `7BADC039-741638A5-AI4-RH3`.
- Two 3.4m storeys; two bedrooms, two bathrooms, living/kitchen and circulation.
- First-flight direction90 uses the measured3.58×3.20m well. The engine reports
  19risers,0.178947m riser and0.275556m tread; not a professional stair signoff.
- Upper front terrace3.58×1.89m and bedroom depth3.80m are one explicit proposal
  in the shared plan. Guard, drainage, waterproofing and structure are UNKNOWN.
- Material IDs are explicitly UNCONFIRMED. Import must not silently fill absent
  selections with default brands. CC0 reference surfaces are not exact SKU assets.

## Reproduce

From the repo root on Node22:

```sh
node --test tests/team-b-modern-reference.test.mjs
node tests/team-b-modern-reference.mjs
node tests/team-b-modern-scene.mjs exterior
node tests/team-b-modern-scene.mjs living
node tests/team-b-modern-scene.mjs bed
```

The scene extractor runs the geometry portion of the production Three constructor
and exports its transformed vertices, semantic materials, metre UVs and shadow
flags. It does not rebuild a different house in Blender. Import `project.json`
through the website's project dialog to compare and export the native PDF.

The offline renderer uses official Blender4.5.13 LTS/Cycles CPU. Archive SHA256:
`da4e69b06b75b9e642d106496c50e7e240218b411d2f6e18271c1d1d819cef91`.
Source: https://download.blender.org/release/Blender4.5/ .
Supply absolute paths for the script, sceneJSON, repo and image output; optional
final argument `batch` renders exterior/living/bed in one process. Presentation
lights are not electrical or daylight engineering. The browser roof canvas is
adapted as a neutral offline material; no roof vertices change.

## Verified / still open

- Geometry, stair alignment/fit assumptions and connected access: checked.
- JSON normalization: retains geometry and revision, regression test checked.
- Native production import: same revision. Exported28A3 PDF sheets; all pages
  carry the revision and were rendered/reviewed. PDF hash in`native-pdf.json`.
- Offline physical images: first passes exposed shadow/material conversion
  problems. Keep visual acceptance pending until final images are inspected.
- No surveyed inputs, exact-SKU library, complete quotes, KTS/KS approval or
  commercial gate is implied by this fixture or the28-page count.

Resume: inspect the latest render; correct only this model's remaining visible
and material problems. Then coordinate its source-backed bill of materials and
engineering gaps. Do not relabel this fixture as a customer's finished house.
