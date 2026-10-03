# Measured 3D presentation

The 3D workspace now opens with a Neon look: a dark site grid, batched cyan
architecture outlines, room-local lighting and full-height walls that become
transparent on the side facing the camera. Cut and full-height inspection remain
available. Floor thumbnails and room picking show the measured room area,
dimensions and finish palette without rebuilding the renderer. A room can be
opened separately for interior inspection. The material look uses the same
geometry and original selected surface maps and colours.

View preferences are part of the loader schema and survive refresh and project
switches. Look changes use material uniforms, retain the camera and geometry,
and invalidate captured covers. A PNG completing after a camera/design/look
change is rejected. Exploded floors hide covers for inspection; the visual gap
does not edit the plan or physical floor heights.

Presentation ground, grid, linework, light surfaces, selection and lamp halos
are explicitly excluded from the measured GLB and physical-render snapshot.
Exports restore the wall's original material transparency and colour. Cutaway
geometry is baked only for the current inspection export. Repetitive rug fringe
meshes are combined by room and material with the same world coordinates,
triangles and UVs. Shadow maps are reused while geometry stays unchanged and
refreshed after asynchronous furniture loading.

## Source and licence

The room light falloff adapts `frontend/src/viewer/lighting.ts` from
[Mastershort/NeonPlan 3D](https://github.com/Mastershort/neonplan3d/tree/fd0219dc775863754ae00bc561dbdbb2e72a14d2),
at commit `fd0219dc775863754ae00bc561dbdbb2e72a14d2`. The MIT notice ships at
`assets/licenses/neonplan3d-MIT.txt`, with a link in the lighting disclosure.
The BMH measured model, furniture collections, physical materials and cost
engines remain the existing sources. Home Assistant device controls, invented
power/sensor readings, paid furniture packs and Pro extensions are not installed.
The new preview does not call a metered AI or rendering service.

## Verification

- `npm test`: model buffer/colour preservation, actual loader preference
  persistence, cut caps, original export material flags, batched detail world
  bounds and stale-image rejection, plus the existing project suites.
- `tests/model-presentation.browser.cjs`: desktop/phone Neon and material
  screenshots, real downloaded PNG, camera/renderer retention, room selection,
  floor isolation, cut/full/auto walls, exploded views and reload.
- `tests/customer-studio.browser.cjs`: all ten functions, showroom bindings,
  banking/repayments, actual material changes, measured GLB, design-only ZIP and
  project recovery. Daylight image checks explicitly select the material look.
- `tests/architectural-dossier.browser.cjs`: shared measured drawings, lift,
  style/finish preservation, wall persistence and project dashboards.

Architectural geometry uses the customer's dimensions and current plan.
Presentation lighting is an aid for viewing, not a lux/electrical calculation.
Furniture remains a generic measured representation unless a verified supplier
model is bound. This release does not replace architectural, structural, MEP or
lift manufacturer review before construction.
