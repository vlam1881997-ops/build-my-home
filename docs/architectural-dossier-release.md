# Architectural dossier and project dashboards

Customer brief, floor plans, interior placements, four elevations, two sections,
measured roof and Three.js views now share the same geometry. Choosing an
arrangement keeps the selected house style, finish colours and supplier SKUs.
Impossible bedroom/WC/lift requests leave the current plan intact. A continuous
door route is checked for every floor; shafts and stair openings remain aligned.

Paper drawings use A3 millimetres and an explicit print scale, door swings/sliding
leaves, room areas, dimension chains, reference axes and measured furniture.
Long plots rotate to fit the paper. Roof and lift sheets also fit their real
dimensions. Sections cut actual stair flights and slab openings. Native PDFs
contain vectors and embedded, searchable Vietnamese text. PDF, SVG, DXF,
material quantities and scoped cost data accompany the customer ZIP.

The sample verification brief is **9 × 20 m, two floors, four bedrooms, two WCs,
one continuous lift shaft and a garden**, in the selected contemporary Vietnamese
style. Its 17-page A3 PDF is an example of the app output, not a supplied survey or
an approved construction set. Structure, foundations, MEP routing and manufacturer
lift installation details still require project-specific design and review.

## Video references

- [NeonPlan 3D](https://github.com/Mastershort/neonplan3d), inspected 2026-10-03:
  floor selection, cut walls and room labels inspired the measured BMH inspector.
  The source repository is MIT-licensed and targets Home Assistant. BMH implements
  these navigation patterns over its existing measured renderer; it does not
  embed a second plan engine, connect home automation or install paid furniture
  packs. No NeonPlan source code or paid pack assets are copied in this release.
- User's second video: rounded finance dashboards with navy, blue and turquoise
  charts. Cost charts aggregate the current BOQ exactly; loan charts aggregate
  principal/interest from all repayment months; construction charts compare the
  frozen budget or current allocation with recorded expenditure. Unentered stage
  progress remains unknown. Tables expose every plotted monetary value.
- [Architectural drawing reference](https://chatuy.vn/ban-ve-thiet-ke-nha): the
  document structure informed coordinated plans, elevations, sections and detail
  schedules. Reference images are not used as measured customer input.

## Local, free export dependencies

PDF-lib 1.17.1 (MIT) is vendored and loaded only for PDF export. Subset DejaVu fonts
retain their licence and use the BMHPlanSans family name. The export runs in the
browser. Drawing export and dashboard navigation call no AI or paid service.
Regeneration helpers are `scripts/vendor-pdf.cjs` and
`scripts/prepare-drawing-font.py`; licence files accompany both assets.

## Verification

`npm test` checks the existing calculation, project, customer-cloud, drawing,
stair/lift and rendering contracts, plus the architectural proposal cases.

`tests/architectural-dossier.browser.cjs` verifies preserved style/finishes,
measured room labels, wall presentation, all elevation/section sheets, real PDF
downloads, exact dashboard totals and mobile viewport containment. Existing
customer-studio and measured-design browser suites cover all ten tabs, supplier
selection, bank research isolation, repayment export, scoped quotes, frozen
budgets, privacy, GLB and customer-package export. Every browser context blocks
external and paid operations before loading the app.
