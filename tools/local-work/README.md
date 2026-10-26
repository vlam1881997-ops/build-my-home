# Local Work v0.1

Local multi-agent coding cockpit for one or more GitHub projects.

## What it does

- Planner, Worker and Reviewer can use different AI providers/models.
- OpenAI, Anthropic and Google Gemini adapters are included.
- Every Worker gets an isolated git worktree + branch.
- Agents can list/read/write/patch files and run only existing npm scripts.
- Required project tests run before review.
- Reviewer checks the diff before commit.
- Push and PR are opt-in through config.
- Run history is stored locally under `.local-work/`.
- Secrets are never committed; provider keys come from environment variables.

## Important account rule

Do not automate ChatGPT/Claude/Gemini browser sessions with cookies or session tokens. Use the providers' supported API credentials.

For multiple GitHub accounts, authenticate each GitHub CLI profile and point a project's `githubProfileDir` at the desired `GH_CONFIG_DIR`. The default can stay blank to use the currently logged-in `gh` account.

## Windows quick start

From this folder:

```bat
start-local-work.cmd
```

The bootstrap checks Node 22+, Git and GitHub CLI, clones Build My Home to:

```
%USERPROFILE%\LocalWork\projects\build-my-home
```

and creates `config.local.json` automatically.

Before assigning work, set one or more provider keys in PowerShell:

```powershell
$env:OPENAI_API_KEY="..."
$env:GEMINI_API_KEY="..."
$env:ANTHROPIC_API_KEY="..."
```

Then set actual model IDs for enabled agents in `config.local.json`. Model IDs are intentionally not hard-coded because provider catalogs change.

Open:

```
http://127.0.0.1:4317
```

## Recommended first configuration

Keep:

- Planner: strongest reasoning model you want to spend on planning.
- Worker: coding model.
- Reviewer: a different model/provider from Worker when possible.

Start with:

```json
"autoPush": false,
"autoPr": false,
"autoMerge": false,
"requireTests": true
```

After you trust the workflow, enable `autoPush` and `autoPr`. Auto-merge is deliberately not implemented in v0.1; production changes should still pass PR/CI.

## Build My Home

The example project is already configured for:

- GitHub: `vlam1881997-ops/build-my-home`
- default branch: `main`
- test script: `npm test`
- build script: `npm run build`

Each run creates a branch shaped like:

```
local-work/<run-id>/<worker-id>
```

so concurrent agents do not edit the same working directory.

## Next upgrades

1. Telegram task inbox and approval buttons.
2. Parallel specialist workers with file ownership/locks.
3. GitHub issue/PR watcher.
4. Vercel deployment/log watcher and automatic rollback suggestions.
5. Provider/model catalog refresh in the UI.
6. Shared project memory and decision log.
