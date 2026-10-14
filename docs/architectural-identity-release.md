# BMH measured architectural identity · 2026-10-07

The selected house style now controls measured facade composition rather than only colour. The saved floor plan remains the geometry source.

## Behaviour

- All 24 catalogue styles have distinct rules for profiles, feature panels, shutters, decorative arches, shade blades, glazing bars and horizontal or vertical rhythm. Features decorate existing walls and openings. They do not invent rooms, balconies, columns or load-bearing members.
- Four elevation SVG sheets, the interactive house, exploded-floor views and GLB use the same deterministic component registry in metres. Polygonal arches remain polygonal in the elevations. Components are bounded by the entered parcel; a projection crossing a concave parcel notch is omitted. Projections into entered setbacks are flagged for review, not represented as planning permission.
- Automatic exterior finishes follow the selected style. Explicit colours, visual finish profiles and valid supplier bindings take precedence. A room's own paint does not repaint the exterior. Global wall/accent changes retain the live renderer, camera and geometry buffers when the structure is unchanged. A closed or stale scene cannot receive those changes.
- Living/bedroom wall treatments follow the actual room collection: timber flutes, panel mouldings, wainscoting, mineral panels or curved inserts. A manually mixed room retains its collection when the house style changes. Features occupy solid wall bays rather than glazing, doors or shaft voids.
- Facade components and rug fringes are batched by material/floor/room. Camera, texture and finish updates within a tick share one frame and thumbnail readback. Identical ResizeObserver dimensions do not reallocate render targets. Synchronous PNG/model exports retain their existing ownership and restoration checks.
- The GLB includes safe style/collection/component identifiers and the same architecture review as the design-only customer package. It excludes personal finance, payment, account and household fields.
- Thin facade/window profiles use a tuned raster shadow bias to avoid self-shadow speckling. Preview lighting is presentation, not a verified sunlight study. The measured parts are unchanged.
- No new paid provider, external asset download or dependency is added. Brick/concrete channels and profile geometry are authored locally. Rendering remains native Three.js; optional Gemini images are a separate explicit operation.

## Validation

`npm test` includes `tests/architectural-identity.test.mjs`. Its cases cover 24 distinct geometry signatures, unchanged measured rooms/openings/SKUs, 2D versus Three bounds, exploded levels, global/private finishes, stale-scene guards, manual interior collections, glazing bounds, concave parcels and explicit roof/stair/elevator settings. Scene cleanup also checks cached-only facade materials and shared textures are disposed once.

Run `tests/architectural-identity.browser.cjs` with `BMH_CHROMIUM_EXECUTABLE` and `BMH_BROWSER_OUTPUT` set for the available Chromium. It uses an isolated 8 × 18 m, two-floor fixture on desktop and phone, the actual style/material/floor/inside controls, deleted-window undo, reload, sharp PNG and parsed GLB. External/API writes are blocked. It checks all facade identifiers are present in their elevations and live scene, interior collection identity, retained renderer/buffers for paint changes, 20 simultaneous updates producing one frame, material presentation selection, clipping and exported design metadata.

Performance must be reported from the actual run. Software WebGL in the execution environment has substantial shader/first-frame overhead; batching and two initial visible frames do not establish a low first-load latency on customers' devices. Inside PNGs remain more expensive than exterior images. Do not describe this release as a photoreal renderer performance guarantee.

## Scope of accuracy

These are generic parametric style families and preliminary architecture, not an exact reconstruction of an arbitrary reference image, a verified product model or approved construction drawings. `exactReferenceMatch` stays unknown and `engineeringApproved` stays false. The model preserves the customer's dimensional and material inputs; their survey, allowed projections, structural/MEP design and actual manufacturer samples still need independent verification.

`finishAreas` measures individual generic component faces and can include overlapping layers. It is explicitly labelled and is not added to priced net quantities or treated as a supplier quote. Existing measured quantity and cost workflows remain separate.

Rollback is a source revert to the preceding measured-windows release; no customer schema or database migration is introduced. Old view/image cache keys are invalidated through the drawing/render revisions rather than by deleting saved customer projects.
