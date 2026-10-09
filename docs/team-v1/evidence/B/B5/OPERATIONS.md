# B5 operating boundaries

Private image/PDF media is routed through existing /api/projects?operation=media (no extra Vercel function). Source: server/_team_b_media.mjs; client: 91_customer_cloud.js. Limit 2 MB/file fits existing function payload; immutable content-hash keys allow retry without overwriting bytes. GET signs only keys referenced in that user's saved project, for 120 s. Upload -> project metadata revision-save required; conflict/network failure preserves local bytes and explains partially saved status. Ownership checked by API and Storage RLS; no service-role key used for file operations.

Apply sql/BMH_PROJECT_MEDIA.sql AFTER existing customer cloud migration, verify real private bucket with separate accounts, then set BMH_MEDIA_READY=true. Current environment has no Supabase admin/database connection; migration is supplied, NOT applied. No provider/plugin/dependency installed, no claim of free unlimited storage. Existing provider quotas/costs apply; bucket file-size limit is not a total-spend cap. Operational cleanup/retention and resumable >2 MB uploads remain follow-up; do not erase metadata to claim bytes were deleted.

Existing revision-CAS/conflict copies, token refresh, AI allowance ledger, MoMo sandbox/receipt recovery remain reused. Payment must be confirmed by server/webhook; QA uses mocks, no merchant order or real spend. Current public capability flags, cross-device/Storage/RLS and merchant sandbox must be checked on the integrated deployment before B5 acceptance.

Primary docs checked 2026-10-09: https://supabase.com/docs/guides/storage/security/access-control ; https://supabase.com/docs/reference/self-hosting-storage/v1/upload-a-new-object .
