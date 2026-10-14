# AGENTS.md — BMH commercial v1

## Phạm vi và nhiệm vụ
Follow the user's current instructions first. For the two-AI commercial plan, read:
- `docs/BMH-COMMERCIAL-V1-SCOPE.md`
- `docs/PR34-COMMERCIAL-GAP-20261009.md`
- `docs/team-v1/README.md`, `work-plan.json`, `contracts.md`
- Your role's `TASK-A.md` or `TASK-B.md` and progress file, plus `INTEGRATION.md`.

The scope is the existing 24 styles and the complete customer workflow: confirmed brief/site/family/style/budget → measured drawings and materials → same-design 3D → detailed costs/optimization → finance → design handover → construction supervision. Per-item furniture move, any-angle rotation, delete and persistence are mandatory.

## Resume before editing
Resolve role from the explicit user assignment, current role branch/worktree, or existing role handoff. Do not infer role from a GitHub author's email. If a fresh session has no role evidence, ask which role; never claim both roles or silently choose the other AI's task.

Read progress from the active role branch, not just main's older checkpoint. Inspect git status/log/diff and the latest remote role branch/PR. Preserve unfinished source and worktrees. Never reset, overwrite or restart completed tasks merely because the conversation is new. If a checkpoint conflicts with actual files/commits, recover actual work first and correct the checkpoint truthfully.

“Làm tiếp” / “continue” resumes the active task/substep. If no active task exists, choose the next dependency-ready task from the assigned package. A blocked integration/credential does not stop independent work.

## Ownership and collaboration
`work-plan.json` is the file ownership manifest. Do not edit the other role's source or progress file. Record an ownership request before changing an unlisted existing file. A owns state/schema, measurements, drawings, quantities, costs/finance, build/dependencies and sequential integration. B owns style/material libraries, furniture/3D/UI, cloud/media/payment and customer QA.

Use separate role branches/worktrees; preserve legacy WIP on the corresponding task. New modules use the role-specific prefixes. B supplies module registration/schema requests to A; A keeps integration current. Do not create a second geometry store or disconnected UI furniture state.

## Durable checkpoints
After each meaningful substep and before switching task or ending a session:
1. Update your progress file: active ID/substep, actual branch/base, changed files, tests/evidence, remaining issue, next concrete action and counterpart requests.
2. Commit scoped source and progress together on the role branch; push when available. WIP remains explicitly incomplete and outside main.
3. Record a prior tested SHA as last_verified_commit; identify the current checkpoint through branch git log rather than inventing a commit's own SHA in its content.
4. If remote persistence fails, state what remains local and keep it. Never claim a new session can retrieve unpublished changes.

A sudden stop may leave uncommitted work: inspect and preserve it on resume. No claimed automatic background work/account switching/token recovery. This plan does not connect the two ChatGPT histories or launch the second account itself.

## Completion and release
Statuses: not_started → in_progress → ready_for_integration → done; blocked states retain their remaining work. A task is done only with the agreed gate evidence on an integrated revision. B6 checks A6's preview before final production release; both close G6.

Use relevant BMH skills and existing tests; mock billable AI/Search/payment, protect real projects and keep secrets/generated dist/node_modules out of commits. Validate source/units/ID/revision, desktop/mobile/persistence/exports and visual acceptance. Repeat release checks on declared Node 22.x. Existing user authorization governs publishing; a plan does not prove a deployment.

Never invent engineering inputs, verified planning, SKU textures/prices or professional signoff. Mark missing/unknown/stale accurately. Do not call the product 100% complete from task counts, style IDs or passing unit tests.
