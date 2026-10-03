# BMH customer accounts, cloud projects and AI allowance

This release puts the optional account entry in **Dự án → Tài khoản & đồng bộ**. Native dialogs retain the measured WebGL scene. All ten design functions stay available locally without an account or legacy Premium purchase.

## What works in code

- Email sign-in/sign-up, confirmation guidance, sign-out and password recovery through Supabase Auth. Recovery returns to the trusted application URL; tokens are removed from the fragment and verified before account use.
- User-owned project lists, safe saves with an expected revision and a unique request ID, and revision-checked deletion. Deleted identities leave a tombstone so a lost first-save acknowledgement cannot resurrect them.
- A conflicting device retains its local design. It can save a separate cloud copy or open the latest server version while keeping a differing local draft as another device project.
- A pending save persists its exact payload and ID in IndexedDB before sending. After a lost response or reload, it replays the same request. Cloud identity and revision live with each local project; local copies/imports detach that identity. Responses for an old account/project cannot attach to the current design.
- Single-flight token refresh, explicit retry after network failure, and server receipts stored before pending requests are cleared. The client only reports synchronization when the acknowledged snapshot matches the current project.
- Atomic server-side daily AI attempt allowance. Pending work counts against the limit; duplicate request IDs never launch a second provider call. Cached/local responses reserve nothing. A known provider rejection releases the reservation; an accepted response or uncertain network outcome counts as used. A lost settlement ages into used work.
- AI quota wraps assistant/brief/review/cost/vision/feng shui/site, finishing analysis, material research, bank research, media scan and generated images. Gemini/OpenAI/model fallbacks belong to the same HTTP attempt. Provider costs can differ between these attempts; this is a customer usage limit, not a currency meter or provider budget guarantee.
- Account-mode upload metadata is assigned by the server and checked before file status/scan. Foreign or invalid file requests cannot trigger cleanup deletion.

## Enable real services

The readiness flags default off. This repository has no authority to claim that the hosted database has received these migrations just because API keys exist.

1. Apply `sql/BMH_CUSTOMER_CLOUD.sql` to the actual Supabase project. It preserves existing `bmh_projects` rows, adds revisions, enforces function-only writes and retains owner-scoped reads. It can run independently of legacy payment tables. If legacy SQL is needed, apply it first; this cloud migration must run last to revoke direct client writes.
2. Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (or legacy `SUPABASE_ANON_KEY`) in the hosting environment. Set `BMH_PUBLIC_URL=https://www.huiminhbach.id.vn`. Configure Supabase Auth site/redirect URLs and the actual email delivery service. Test confirmation/recovery with an owner's test account, not customer data.
3. Set `BMH_CLOUD_READY=true` only after the schema, RLS and Auth configuration have been verified. With the flag off, the account dialog offers a working JSON backup instead of a nonfunctional sign-in form.
4. Apply `sql/BMH_AI_USAGE.sql`, set the server-only `SUPABASE_SECRET_KEY` (or legacy service-role key), choose `BMH_AI_DAILY_LIMIT` (0–10000, default 10), then set `BMH_AI_QUOTA_READY=true`. Account mode now requires verified sign-in before provider generation. Existing untagged uploads need uploading again in account mode. The allowance is captured for a user at the first request of each UTC day; changing the default affects the next day, not an in-progress daily allowance.
5. Redeploy and verify `/api/config` capability flags, two test devices, signup confirmation, recovery, quota denial and provider settlement against the actual configured services. No SQL/API fixture is proof of real hosted readiness.

`paymentConfigured` remains false. Actual MoMo guest orders retain their separate existing merchant/order readiness flags. This release does not activate a merchant, invent commercial prices, change a hosting plan or grant paid access from browser state.

## Verification

`npm test` includes the existing design suite, API boundaries and a pinned development-only PGlite PostgreSQL engine for the actual migrations/functions/RLS. SQL checks cover existing-row migration, anonymous/other-user/direct-write denial, stale revisions, idempotent saves, tombstones, pending allowance, settlement and duplicate prevention. This single-engine test is not a load test of the hosted Supabase service.

`tests/customer-cloud.browser.cjs` runs two independent browser contexts and an owner-isolated mock backend: conflict, separate copy, dropped acknowledgement and reload, account switch, late project response, token refresh, local copy detachment, password recovery, cloud deletion preserving local data, and unavailable-service JSON backup. Desktop/phone screenshots are inspected; native dialogs retain the actual renderer and scene.

`tests/customer-studio.browser.cjs` verifies all ten functions, materials, banking calculations, measured lift drawings/3D, hot finish updates, PNG/GLB/customer ZIP exports and project recovery. Browser suites block unrelated external requests and all unmocked service mutations/generation. They do not send email, create real orders or spend AI credits.

No new hosted provider is required. PGlite is an Apache-2.0 development/test dependency and is not imported by production API or browser code. Existing BMH skills cover drawings, measured 3D, images, graphics, interface and release quality.
