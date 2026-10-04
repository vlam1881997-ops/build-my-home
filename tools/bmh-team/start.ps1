param(
  [string]$RepoPath = ""
)

$ErrorActionPreference = "Stop"

function Find-Executable([string]$Name) {
  $command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($command) { return $command.Source }
  return $null
}

function Find-Codex {
  foreach ($name in @("codex.exe", "codex.cmd", "codex")) {
    $candidate = Find-Executable $name
    if ($candidate -and [System.IO.Path]::GetExtension($candidate) -ne ".ps1") { return $candidate }
  }
  if ($env:APPDATA) {
    $candidate = Join-Path $env:APPDATA "npm\codex.cmd"
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  return $null
}

function Stop-WithMessage([string]$Message) {
  Write-Host ""
  Write-Host $Message -ForegroundColor Yellow
  Write-Host "See tools/bmh-team/README.md for setup."
  exit 1
}

Write-Host ""
Write-Host "BMH Team - Two ChatGPT accounts, one local project" -ForegroundColor Cyan
Write-Host "Keep this window open while using the dashboard."

$bmhNode = Find-Executable "node"
if (-not $bmhNode) {
  Stop-WithMessage "Install Node.js 22 or newer from https://nodejs.org, then open a new PowerShell window."
}
$bmhNodeVersion = & $bmhNode --version
if ($LASTEXITCODE -ne 0 -or $bmhNodeVersion -notmatch '^v(\d+)\.') {
  Stop-WithMessage "Cannot read the Node.js version. Reinstall Node.js 22 or newer."
}
if ([int]$Matches[1] -lt 22) {
  Stop-WithMessage "Node.js 22 or newer is required. Current version: $bmhNodeVersion"
}

$bmhGit = Find-Executable "git"
if (-not $bmhGit -and $env:LOCALAPPDATA) {
  $bmhDesktopRoot = Join-Path $env:LOCALAPPDATA "GitHubDesktop"
  if (Test-Path -LiteralPath $bmhDesktopRoot) {
    $bmhDesktopVersions = Get-ChildItem -LiteralPath $bmhDesktopRoot -Directory -Filter "app-*" | Sort-Object LastWriteTime -Descending
    foreach ($version in $bmhDesktopVersions) {
      $bmhCandidate = Join-Path $version.FullName "resources\app\git\cmd\git.exe"
      if (Test-Path -LiteralPath $bmhCandidate) { $bmhGit = $bmhCandidate; break }
    }
  }
}
if (-not $bmhGit) {
  Stop-WithMessage "Install GitHub Desktop (https://desktop.github.com) or Git for Windows (https://git-scm.com), then run this launcher again."
}
$env:BMH_TEAM_GIT = $bmhGit
$env:PATH = "$(Split-Path -Parent $bmhGit);$env:PATH"

$bmhCodex = Find-Codex
if (-not $bmhCodex -and $env:APPDATA) {
  $bmhGlobalCodex = Join-Path $env:APPDATA "npm\codex.cmd"
  if (Test-Path -LiteralPath $bmhGlobalCodex) { $bmhCodex = $bmhGlobalCodex }
}
if (-not $bmhCodex) {
  Write-Host ""
  Write-Host "Official Codex CLI is missing. It is needed for the two local sessions." -ForegroundColor Yellow
  Write-Host "Installing the official @openai/codex package required by this launcher."
  $bmhNpm = Find-Executable "npm.cmd"
  if (-not $bmhNpm) { $bmhNpm = Find-Executable "npm" }
  if (-not $bmhNpm) { Stop-WithMessage "npm was not found. Install the complete Node.js distribution and run this launcher again." }
  & $bmhNpm install -g '@openai/codex@0.158.0'
  if ($LASTEXITCODE -ne 0) { Stop-WithMessage "Codex installation did not complete. Review the npm error above." }
  $bmhCodex = Find-Codex
  if (-not $bmhCodex -and $env:APPDATA) {
    $bmhGlobalCodex = Join-Path $env:APPDATA "npm\codex.cmd"
    if (Test-Path -LiteralPath $bmhGlobalCodex) { $bmhCodex = $bmhGlobalCodex }
  }
}
if (-not $bmhCodex) { Stop-WithMessage "Codex CLI was not found after setup. Open a new PowerShell window and try again." }
$env:BMH_TEAM_CODEX = $bmhCodex

$bmhServer = Join-Path $PSScriptRoot "server.mjs"
if (-not (Test-Path -LiteralPath $bmhServer)) {
  Stop-WithMessage "server.mjs is missing. Extract the complete BMH Team folder before starting it."
}
if ($RepoPath -and -not (Test-Path -LiteralPath $RepoPath -PathType Container)) {
  Stop-WithMessage "RepoPath does not exist. Use GitHub Desktop > Repository > Show in Explorer to find your BMH repo."
}

Write-Host ""
Write-Host "Starting local dashboard. Sign in to each account on the official OpenAI page." -ForegroundColor Green
Write-Host "The browser opens automatically. Press Ctrl+C here to stop the server."
Push-Location $PSScriptRoot
try {
  if ($RepoPath) { & $bmhNode $bmhServer --repo $RepoPath }
  else { & $bmhNode $bmhServer }
}
finally {
  Pop-Location
}
