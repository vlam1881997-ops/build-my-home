# BMH customer studio release · 2026-10-02

This release improves the design product. It does not declare the entire paid service ready.

## Implemented

- Crisp raster PNG export defaults to a 1280 px long edge, with explicit 1920/2560 choices and pixel caps. It uses the current measured scene and camera, without an AI call or path-tracer import. Resolution and elapsed time appear after export. Interactive preview remains available; detailed light transport is optional.
- Indoor raster views include the measured ceiling. Physical-render snapshots replace that ceiling once rather than duplicating it. Indoor camera changes that enter measured walls, ceilings or furniture retain the last clear pose, avoiding exports from inside a television/cabinet.
- Elevators reserve the same footprint on every floor with a shared shaft ID. Each floor has a sliding landing door. Moves, numeric geometry edits, floor synchronization, locks, deletion and undo operate on the whole shaft.
- Shaft voids remain open through intermediate floor slabs. The elevator has a symbolic cabin, rails, doors and glass/solid enclosure in Three and the compatibility preview; it appears in A3 detail drawings, sections and millimetre DXF.
- Cabin, door, pit, required headroom and manufacturer/model are editable. Unknown installation values remain unknown. Geometry and landing-access checks identify conflicts; no elevator configuration is certified for installation or accessibility.
- Save up to four camera views per project, choose inspection angles, enter presentation mode and export the displayed 3D model as an actual binary GLB in metres.
- A customer ZIP contains an A3 printable HTML dossier, SVG sheets, DXF per floor, selected visual finishes, a design-only JSON and the current raster perspective when a 3D view is open. It excludes household, personal financial, account and payment state. It is distinct from a full project backup.
- AI image display and pending responses check the camera as well as the design. Restored image records carry camera/reference metadata; an earlier angle is not presented as the current angle.
- Personal Work skills `bmh-drawings`, `bmh-images` and `bmh-3d` guide future work. They do not install CAD/Blender software or activate external image services by themselves.
- GitHub Pages deployment is opt-in through `ENABLE_GITHUB_PAGES=true`. Vercel remains the production host; unconfigured Pages no longer fails an otherwise successful main-branch check.

## Validation

Run `npm test` and `tests/customer-studio.browser.cjs` with the available Chromium executable. The browser flow exercises desktop and phone, a three-floor shaft, numeric edits, slab voids, walnut/olive finishes, crisp PNG dimensions, restored renderer/camera state, GLB parsing, saved views, presentation mode, customer ZIP privacy, reload and a stale mocked AI response. Test AI calls use a mocked provider; no real payment is created.

Performance depends on GPU, scene complexity and resolution. Record actual timings from the test run; do not promise identical latency on every device. Higher-resolution and physical-light modes can take longer.

## Outstanding before a full commercial launch

The public production capability response observed on 2026-10-02 has AI/image capability enabled, `cloudConfigured=false`, `paymentConfigured=false`, and guest service `enabled=false`.

1. Configure customer identity and cross-device storage, with ownership checks, recovery and a tested restore flow. Current anonymous project storage is on the device.
2. Define the service sold, price, deliverables and refund/support process; configure the merchant integration and verify callback signatures, idempotency, order status and fulfilment. Never treat a local flag as proof of payment. Production transactions require the business's actual merchant configuration.
3. Add durable usage accounting and AI allowance by customer/order. Provider availability and provider quota are separate from the customer's paid entitlement.
4. Verify backup, error monitoring, data retention, operational support and rollback using the configured production services.
5. Confirm redistribution rights for product imagery and external assets, and publish the business's final privacy/service terms.
6. Keep conceptual architecture separate from construction documents. Manufacturer, structural, MEP and relevant professional reviews remain explicit deliverables where those are sold.

All supplied geometry is a configurable preliminary design, not an independently approved engineering or installation specification.
