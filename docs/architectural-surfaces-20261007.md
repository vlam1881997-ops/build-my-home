# Measured window assemblies and architectural finishes

The previous viewer filled each window opening with a wall-thickness glass box,
painted every slab face with the floor finish, and repeated timber strips on
unrelated facade bays. Selecting a room also tinted its material with a cyan
filled overlay. Those choices made material review and architectural presentation
less clear.

## Changes

- Build generic jambs, heads, sills, sash profiles and 8 mm visual glass inside the
  existing opening. Group profiles into one frame mesh and one glazing mesh per
  opening. The glass thickness is a visual default, not an approved product spec.
- Keep the existing slab position buffers, dimensions and voids. Assign the selected
  floor material to the top face; keep the five slab-body faces separate. In-place
  finish changes preserve the renderer, camera, other rooms and body materials.
- Use one timber feature bay for the timber style families. Modern and minimal
  styles no longer inherit the same timber strips; window reveals, shading and
  classical profiles still use the shared facade component registry and elevations.
- Use a small, scene-owned daylight environment for exterior reflections and bounded
  four-sample raster anti-aliasing where supported. Keep immediate raster 3D; do not
  start the AI or physical renderer on opening a project.
- During a large PNG export, avoid multiplying its render targets by four MSAA samples,
  then restore the interactive targets and view. Preserve the top slab's original UVs
  when creating a photographic scene with multiple face materials.
- Use an outline to identify a room in the material view. Keep the filled overlay in
  Neon, and hide selection overlays in an eye-height room view.
- Search bounded, body-clear camera positions when the usual orbit cannot find a
  usable eye-height view in a narrow furnished room. Keep furniture, walls and the
  existing movement collision checks in place.
- Version the drawing/model schema and rendered-image cache so old facade geometry
  and images cannot silently retain the current release's identity.

## Verification

Meaningful Node checks cover measured bounds for all four window orientations,
slab-face material isolation, retained geometry, architectural dossiers, exports,
style profiles and selected-room presentation. The real browser fixture uses the
same 8 x 18 m, two-floor house before and after, including native PNG capture.

`tests/architectural-surfaces.browser.cjs` exercises desktop and phone windows,
four desktop style presentations, in-place slab changes, Neon switching, direct
window deletion and undo, eye-height room capture, saved choices and a real GLB.
External APIs and non-read requests are blocked in the fixture. Source product
choices and the restored plan must remain unchanged.

The browser flow passed at 1440 x 1040 and 390 x 844: all 12 windows retained their
measured spans and heights, no geometry issues or page/WebGL errors were reported,
saved choices survived reload, and the downloaded GLB retained all slab-face
materials and glazing. Four desktop styles were captured from the same plan.
Native exterior PNGs took roughly 2–4 seconds and room PNGs 6–8 seconds in software
WebGL. These fixture timings are not a customer-device speed guarantee; interior
capture still has a performance gap.

## Limits

This is still preliminary architecture. Profiles, glass and procedural finishes
are generic; exact supplier products need verified specifications and samples.
The existing rectangular floor packer has not become an architect-authored design.
This release does not add balconies, openings, rooms, structural calculations,
approved surveys, MEP drawings or an engineering sign-off. Facade decoration is not
a verified structural element or a separately quoted construction package.

Four styles being inspected does not establish an exact match to every customer
reference image or certify all 24 styles. Visual improvement and passing software
checks are not commercial acceptance by architects, engineers or paying customers.
