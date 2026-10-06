$ErrorActionPreference = "Stop"

$LocalWorkDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectsRoot = Join-Path $HOME "LocalWork\projects"
$BmhDir = Join-Path $ProjectsRoot "build-my-home"

function Need-Cmd($name, $hint) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    Write-Host "Missing: $name" -ForegroundColor Red
    Write-Host $hint -ForegroundColor Yellow
    exit 1
  }
}

Need-Cmd "node" "Install Node.js 22 or newer."
Need-Cmd "git" "Install Git for Windows."
Need-Cmd "gh" "Install GitHub CLI, e.g. winget install --id GitHub.cli"

$nodeMajor = [int]((node -p "process.versions.node.split('.')[0]").Trim())
if ($nodeMajor -lt 22) { throw "Node.js 22+ is required." }

try { gh auth status | Out-Null }
catch {
  Write-Host "GitHub is not logged in. Starting gh auth login..." -ForegroundColor Yellow
  gh auth login
}

gh auth setup-git | Out-Null
New-Item -ItemType Directory -Force -Path $ProjectsRoot | Out-Null

if (-not (Test-Path (Join-Path $BmhDir ".git"))) {
  Write-Host "Cloning Build My Home..." -ForegroundColor Cyan
  git clone "https://github.com/vlam1881997-ops/build-my-home.git" $BmhDir
} else {
  Write-Host "BMH already exists: $BmhDir" -ForegroundColor Green
  git -C $BmhDir fetch origin main
}

$cfgPath = Join-Path $LocalWorkDir "config.local.json"
$examplePath = Join-Path $LocalWorkDir "config.example.json"
if (-not (Test-Path $cfgPath)) {
  $cfg = Get-Content $examplePath -Raw | ConvertFrom-Json
  $cfg.projects[0].repoPath = ($BmhDir -replace '\\','/')
  $cfg | ConvertTo-Json -Depth 20 | Set-Content -Encoding UTF8 $cfgPath
  Write-Host "Created config.local.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "Set at least one AI provider key before running agents:" -ForegroundColor Cyan
Write-Host '  $env:OPENAI_API_KEY="..."'
Write-Host '  $env:GEMINI_API_KEY="..."'
Write-Host '  $env:ANTHROPIC_API_KEY="..."'
Write-Host ""
Write-Host "Starting Local Work at http://127.0.0.1:4317" -ForegroundColor Green
Set-Location $LocalWorkDir
node src/server.mjs
