# Codex A — Commercial Pilot v1

Status: **IN PROGRESS — NOT COMPLETE**. Updated 2026-10-08 UTC.

- Repository: `vlam1881997-ops/build-my-home`.
- Branch: `codex/a-commercial-v1-20261008`.
- Base `origin/main`: `15562c60244897ec2e7193fe88676931d4532afd`.
- Head: recorded with each delivery below; implementation and handoff commits are separate.
- Account: `vlam1881997-ops`, verified author email `vlam1881997@gmail.com`.
- Scope: A-owned source/tests only, plus this authorized handoff. No production deployment or merge.

## Data contract delivered

`project.site` and `project.plan` remain the only geometry store. State units are metres; CAD output is millimetres. Plan `y` maps to Three `z`. Stable room/opening/fixture/shaft IDs remain unchanged during migration.

`constructionDesign.schemaVersion = 2` retains legacy input, element, review and issue data. Structured records use `status` and `reviewState` aliases with `missing`, `provisional`, `provided`, `awaiting-review`, `reviewed`, or `stale`. Unstructured legacy entries remain stored, are counted as pending, and cannot count as approval. Generated legacy IDs are deterministic.

`BMH.constructionDesignIdentity()` excludes review bookkeeping to prevent a review invalidating its own geometry revision. Dimensions, source references and dependencies remain in the identity. `BMH.constructionReview()` returns a sanitized summary, never raw evidence documents. A record marked reviewed requires reviewer name, KTS/KS role, review document reference, valid date, and the reviewed drawing revision. This records supplied review metadata; it does not authenticate a professional credential or signature. All dossiers remain proposals.

`BMH.save()` marks documented reviews stale when the drawing revision changes. Finance and a same-SKU price edit preserve geometry revision; geometry, product SKU/specification and technical dimensions change it. Stale records retain the approved revision for audit. Review dependency handling currently invalidates conservatively against the whole drawing revision.

Required customer label: **HỒ SƠ PHƯƠNG ÁN — CHƯA DÙNG THI CÔNG**.

## Validation delivered

- `npm test`: **381 pass, 0 fail**; Node 24.19.0. Repository declares Node 22.x, so coordinator must repeat on Node 22.
- `tests/design-evidence.browser.cjs`: desktop and phone pass, including persistence, reviewed metadata, price-only edits and geometry staleness.
- `git diff --check`: pass.
- Full tests initially exposed an incomplete binary download; the original tracked CC0 HDR was restored from its documented Poly Haven source, with exact byte count and original Git blob SHA verified. No asset change is part of the PR.
- All test names/data referring to engineers or manufacturers are synthetic fixtures, not evidence for a real building.

## Open work and integration requests

1. P1: add per-floor elevations and verify the mandatory three-floor unequal-height fixture. Existing consumers use a single `floorHeight`; A will supply a backward-compatible level contract and identify B-owned consumers that need migration.
2. P1: strengthen quoted BOQ provenance, transport, validity and null quantities; keep planning allowances explicitly distinct from sourced measured totals.
3. Run the remaining A browser suites, render and inspect every PDF page, and verify DXF millimetres and cross-output revision/IDs.
4. Inspect the integrated Vercel preview after coordinator integration; do not deploy production.
5. Codex Security is not installed/connected in this session. A connection has been suggested; a Codex Security scan is pending. A scoped secret pattern check found no match. This is not a substitute for the requested scanner.
6. `npm audit` reports an existing moderate esbuild development-server advisory, GHSA-67mh-4wv8-2f99; no high/critical findings. Coordinator owns dependency manifests: assess/fix there and rerun audit. A did not change manifests.

Missing project-specific survey, legal setbacks, geotechnical data, loads, structural/MEP design, manufacturer pit/headroom and expert signatures must remain unknown/provisional/awaiting-review. No real project professional inputs were supplied with this task.
