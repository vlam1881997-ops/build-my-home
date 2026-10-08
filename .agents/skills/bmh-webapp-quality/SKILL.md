---
name: bmh-webapp-quality
description: Verify and finish Build My Home web/app releases across real UI interactions, persistence, measured drawings/3D, exports, performance and deployment. Use for BMH regression checks, mobile/desktop validation, reliable customer handoff, recovery and commercial-readiness assessment.
---

# BMH web/app quality

Read [release scenarios](references/release-scenarios.md). Use current source and live capability evidence instead of a prior completion claim.

## Verify the customer story
1. Read AGENTS.md, package scripts, diff and final overrides. Identify changed story/data boundaries; avoid unrelated checks without a reason.
2. Run relevant existing tests/build. Check behaviour/errors rather than source tokens alone.
3. Use a fresh browser context/local fixture. Walk real visible desktop/phone controls and open secondary groups through UI; do not bypass every interaction through internal helpers.
4. Mock billable AI/payment operations. Keep real projects/orders/merchant settings unchanged; never log credentials.
5. Validate boundary results: measured geometry, model/camera consistency, units, exported content and project isolation. A file header alone does not prove a useful deliverable.
6. Check errors, unsupported WebGL, failed requests, empty projects, locks, keyboards and reload where affected. Keep disclosure toggles from rebuilding WebGL.
7. Record actual output dimensions/elapsed time. Do not promise universal latency or say a fast raster export called AI.
8. Inspect screenshots/cover/sheets for blocked cameras, blank images, clipping and phone overflow.
9. Stop after relevant checks pass; broaden only for a new failure/unresolved concern. Fix a broken boundary before proceeding.

## Publish verified work
Use the existing authorized GitHub/Vercel workflow. Preserve unrelated remote changes, upload source only, compare published/local verified trees, inspect CI/deployment status and verify changed behaviour live. Keep secrets/generated dist/public bundles out of commits.

Report actual checks and remaining configuration. Distinguish design prototype, professional construction documents and configured paid service. Confirm cloud/payment/service flags before claiming those capabilities; local paid/design-confirmed flags are not evidence of an order.
