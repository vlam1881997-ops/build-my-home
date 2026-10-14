# Deploy V4.9 on Vercel

## 1. Supabase
1. Create/open a Supabase project.
2. In SQL Editor, run `sql/V4.9_SUPABASE_SCHEMA.sql`.
3. Copy Project URL, Publishable key and Secret key from the project Connect/API-key area.
4. Keep the Secret key server-only. Do not paste it into `src/`, HTML, or browser code.

## 2. payOS
1. Create/verify a payOS account and payment channel.
2. Copy Client ID, API Key and Checksum Key.
3. After the site is deployed, configure the webhook URL as:
   `https://YOUR_DOMAIN/api/payment-webhook`

## 3. Vercel environment variables
Add these in Project Settings -> Environment Variables:

- `BMH_PUBLIC_URL=https://YOUR_DOMAIN`
- `SUPABASE_URL=https://YOUR_PROJECT.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
- `SUPABASE_SECRET_KEY=sb_secret_...`
- `PAYOS_CLIENT_ID=...`
- `PAYOS_API_KEY=...`
- `PAYOS_CHECKSUM_KEY=...`
- optional: `BMH_GOOGLE_MAPS_API_KEY=...`

Legacy `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are accepted as fallbacks, but the V4.9 config is prepared for Supabase's publishable/secret key model.

## 4. Deploy
- Import the repository/folder into Vercel.
- Vercel uses `npm run build:vercel` and serves `public/`.
- The `api/` directory is deployed as serverless functions.

## 5. Production acceptance test
1. Open the website without credentials: Steps 1-8 must still work locally; payment must show not configured if env vars are missing.
2. Register a user and confirm email if required.
3. Save a project to cloud; reload and open it again.
4. Create a real 99,000 VND payment.
5. Verify payOS calls `/api/payment-webhook` successfully.
6. Confirm `bmh_payments.status='paid'` and `bmh_entitlements.active=true`.
7. Sign in on another device and confirm Steps 9-10 unlock after the entitlement check.

## Official integration references used while implementing
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase Data API: https://supabase.com/docs/guides/api
- payOS API: https://payos.vn/docs/api/
- payOS signature verification: https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/
