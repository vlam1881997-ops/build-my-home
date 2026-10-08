# BMH release scenario map

| Story | Evidence |
|---|---|
| Plan | Selection, move/resize, boundary/overlap rejection, locks, undo; disclosure/layout changes retain geometry. |
| Elevator | Aligned shaft, numeric edits, doors, slab holes; unknown installation fields stay unknown. |
| Finishes | Real material/UV change, retained renderer/scene/position buffers/camera, clipped walls, room/project isolation, bounded retired caches, reload. |
| Showroom | Native supplier selection and price retained; generic preview profile applied through real UI; stale bindings omitted; alternatives still reachable. |
| Image | Visible real PNG, dimensions, restored renderer, no implicit AI/tracer; reject stale camera/design responses. |
| Model | Parse actual GLB, metres, useful geometry and current view/revision; verify licensing separately. |
| Dossier | SVG/DXF/printable HTML, measured data, current cover; exclude household/financial/account/payment fields. |
| Cached cover | 3D-to-dossier capture, invalidate after project/design/camera changes; omit stale image. |
| Persistence | Save/open/refresh, schema migration preserves old records, active-project pointer, stale/missing quick cache, quota errors and usable JSON backup; failed saves remain visible on phone. |
| Simplification | Same-fixture control counts, advanced features reachable, keyboard/labels, renderer preserved on disclosure. |
| Production | Commit/tree, CI, Vercel, live domain and /api/config flags without secrets. |

Find current tests under tests/. customer-studio.browser.cjs covers measured elevator/material/image/model/ZIP stories with mocked AI. Extend relevant existing scenarios instead of duplicating an unrelated full harness. Read environment options for Chromium, local port and production URL/proxy.

Use isolated fixtures. Before navigation, block third-party requests, unmocked API requests and non-read requests in each browser context; allow only the test origin's static assets and the explicit read-only capability probe. Install page-specific fixtures for bank/AI/payment operations. Do not allow fixture location data to reach a weather/maps service simply because a tab initializes it. Apply the same isolation in production smoke tests.

Never create real orders, send customer messages, change merchant settings or spend AI credits as a test. Reuse the pinned dependencies, installed browser and existing BMH skills before adding services. Verify current free-plan limits and commercial eligibility from official sources. Distinguish a free plugin, a subscription-included tool, a temporary trial and a metered provider API; do not claim a suggested or sign-in-dependent plugin is connected. Skills provide workflows rather than free hosted service capacity.
