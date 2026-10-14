# A R1/R2 checkpoint — PR47 baseline

TEST-ONLY. Not an approved building design or a complete commercial release.

The existing packer distributes all remaining depth to requested rooms. The 5.4×20m, three-floor fixture reproduces a 3.98×12.38m bedroom. This patch adds an explicit, measured shrink-preview/apply API; it does not silently change generation, choose a new function or alter B UI. Fixture depth 3.8m is a test request, not an architectural recommendation. JSON cases store the actual before/after plans and revisions; the only selected room changes, with existing room-linked transforms. Released space is unassigned and requires review. No roof slab, railing or loggia is invented, and no saving is estimated without prices.

Run from the repo:

```sh
BMH_MASSING_REPORT=docs/team-v1/evidence/A/R1-R2 node --test tests/team-a-massing.test.mjs tests/team-a-commercial.test.mjs tests/customer-design.test.mjs
node scripts/build.cjs
node tests/team-a-massing.browser.cjs
```

Component run: 54/54 pass, Node24.19.0. Uses source envelope, concave parcel validation, measured geometry, source editor and furniture adapters. Covers non-mutating preview, stale/tampered/locked rejection, retained room/shaft identities, rotation37°, tombstones, apply equality, undo/redo, storage reload and quantity area delta. This is not DOM interaction acceptance.

Native runner covers three fixtures on desktop/phone, but this environment's existing Chromium binary is truncated and exits SIGSEGV before a page opens; 0/6 native cases executed. Browser result records failure honestly. Node22 release rerun pending. Broader test attempt: 66/68 pass with two missing sparse-checkout assets (photographic-provenance.json and modern-armchair-facing.glb), not a full-suite success. Unavailable assets/evidence were not deleted from the Git tree.

Security: Codex Security skill could be read, but required config-preflight reference and scan capability unavailable. No completed official scan; dependencies unchanged. No release/deploy/merge. Next: B explicit UI hookup; A allocation choices for released space and export/roof/BOQ consistency, followed by native/Node22/security gates.
