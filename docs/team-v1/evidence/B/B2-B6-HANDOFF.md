# B2–B6 handoff to A

B source is in draft PR36 / codex/b-v1-24. Continue from latest branch head and PROGRESS-B.md; do not recreate the B1 branch or overwrite the source. Source and browser evidence are checkpoints, not commercial acceptance. Main/production not changed.

## A integration order

1. C01/A1: add persistent project.plan.furniture:[] to default schema and validate/migrate the agreed stable ID/room/floor/pose/size/material fields. Preserve tombstones through history, room transforms and design-kit replacement. B2 is a single-source consumer, not a separate furniture store. See B2/C01-A-REQUEST.md.
2. A3/A4: include furniture/material identity in drawingRevision and measuredDesignIdentity; use B.furnitureFootprint for any-angle DXF; use shared IDs/status/SKU and costTreatment in quantities/BOQ. Removed or owned items must not be purchased automatically. See B3/HANDOFF.md and B1-HANDOFF.md.
3. A6: use workflowRoutes.handover=9 and construction=10. Update design-handover versus asbuilt export/completeness semantics, WBS/attachment-free logs/signed decisions adapter. Preserve B's report/private-media allowlist when replacing the base state normalizer. See B4/C03-A-REQUEST.md and B6/C04-A-REQUEST.md.
4. A build/CI: register the five tests/team-b-*.test.mjs files (35 checks) in npm test/CI. New source is appended to existing built B-owned files; no frontend module/dependency registration is needed. Keep server/_team_b_media.mjs import; existing projects API dispatches operation=media, no additional function.
5. Operations: cloud SQL and credentials/readiness flags, private-media migration, merchant sandbox and real two-account/two-device checks; Vercel Node24 setting should align to declared22.x. Current public production flags cloud/payment are false. Do not flip readiness before migration/provider tests. See B5/OPERATIONS.md.
6. Integrated preview: remove test-only C01 injection; run measured irregular/narrow/multifloor fixtures, all10tabs, furniture poses/locks/delete/reload/GLB/ZIP/BOQ, bank and supervision with actual A adapters. Obtain visual review of24 exterior/interior outputs. The current simple kit gallery is a candidate set; similar facade styles/generic assets still need refinement, not an automatic pass.

B next: continue B3 facade/style-specific asset work against A3 fixtures, reviewed material/SKU sample sources, real provider tests when configured, then G6 integrated release QA. B2–B6 independent source can be integrated now; tasks are not marked done before their agreed gates.
