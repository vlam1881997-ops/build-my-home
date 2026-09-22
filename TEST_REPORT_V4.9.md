# Build My Home V4.9 — Test Report

Date: 2026-09-22
Build: 4.9.0 Cloud + Payment

## Automated checks

PASS — `node --check dist/app.js`

PASS — all files in `api/*.mjs` pass Node syntax check.

PASS — `tests/v49_api_smoke.mjs`
- payment amount is fixed at 99,000 VND;
- create-payment signature uses sorted HMAC-SHA256 fields;
- webhook signature changes when data changes;
- implementation reproduces the official payOS webhook signature sample (`412e915d...`).

PASS — `tests/v49_runtime_smoke.mjs`
- V4.9 runtime boots in an isolated browser-like VM;
- Step 8 renders the 99,000 VND payment UI;
- production rejects `dev-local` unlock state;
- `server-verified` entitlement unlocks Step 9;
- Cloud/Auth modal renders.

PASS — `tests/v49_webhook_handler_smoke.mjs`
- invalid webhook signature returns HTTP 400 before any database access;
- valid paid event with exact amount updates the payment row;
- valid paid event upserts the premium entitlement.

PASS — `tests/v49_payment_create_smoke.mjs`
- authenticated user is required;
- pending payment is recorded server-side;
- payOS is called with Client ID/API key in server request headers;
- signature is generated from amount/cancelUrl/description/orderCode/returnUrl;
- response returns checkout information without leaking API/checksum secrets.

PASS — `npm run build:vercel`
- clean `public/` output generated;
- API routes remain under `api/` for Vercel serverless deployment.

PASS — public bundle secret-name scan
- no payOS server secret or Supabase secret-key variable is embedded in `public/`.

## Browser runner limitation in this container

The installed Chromium process does not terminate correctly even on `about:blank` and logs missing D-Bus/system-service errors. Therefore Chromium screenshot/DOM execution is not counted as a browser PASS. Runtime behavior was instead checked with the isolated VM smoke test above.

## Live integration not tested here

No real Supabase project credentials or payOS merchant credentials were supplied. Therefore these items require a deployment acceptance test with the owner's accounts:
- real email signup/confirmation;
- real database persistence and RLS enforcement against Supabase;
- real 99,000 VND checkout;
- real payOS webhook delivery;
- cross-device entitlement sync.

The build fails closed for payment when those credentials are absent: planning remains available locally and real payment is disabled rather than simulated.
