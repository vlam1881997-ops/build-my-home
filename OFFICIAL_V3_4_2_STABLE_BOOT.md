# V3.4.2 Stable Boot Hotfix

This package keeps the Step 4/Feng-shui upgrade and fixes the application-level boot failure seen on huiminhbach.id.vn.

## Boot hardening
- Critical JavaScript is embedded directly into `index.html`; the app no longer depends on a separate `app.js` HTTP request to start.
- `app.js` is still emitted as a debug artifact, but `index.html` does not request it.
- Old Build My Home service workers and `bmh-*` caches are unregistered/cleared.
- Old V2/V3 localStorage is migrated through a type-safe merge; malformed legacy branches can no longer crash startup.
- Fatal top-level runtime errors are caught and printed in the page instead of producing an unexplained white screen.
- A fresh storage namespace `bmh-v342-stable` avoids incompatible historical state while preserving compatible legacy fields.

## Step 4
All V3.4.2 Step 4 repairs remain included: Bát Trạch compass, household needs, multiple children/relatives, site-shape/road controls and family-driven architectural advice.
