# Build My Home V3.4.1 — White Screen Hotfix

- Removed Leaflet CDN from the initial critical render path.
- Leaflet now lazy-loads only when Step 3 is opened, with unpkg -> jsDelivr fallback.
- Step 1 can render even if all map CDNs are unavailable.
- Added visible boot fallback so a failed JS load no longer appears as an unexplained white screen.
- Added cache-busting query parameters for app.js/styles.css.
- Bumped service-worker cache key and added no-cache headers for boot-critical files.
- Keeps the V3.4 planner/3D functionality and the same local project storage key.
