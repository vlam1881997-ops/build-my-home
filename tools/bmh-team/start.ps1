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

function Get-CodexProbe([string]$Executable) {
  if (-not $Executable) { return [PSCustomObject]@{ ok = $false; version = $null; error = "Codex has not been installed in this folder."; repairPackage = $null } }
  try {
    # The Node helper captures native stderr before PowerShell sees it. Windows
    # PowerShell 5.1 must not treat a harmless CLI warning as a failed version.
    $probeOutput = (& $bmhNode $bmhProbeScript --probe $Executable | Out-String).Trim()
    return ($probeOutput | ConvertFrom-Json)
  }
  catch {
    return [PSCustomObject]@{ ok = $false; version = $null; error = "CLI check failed: $($_.Exception.Message)"; repairPackage = $null }
  }
}

function Show-CodexFailure($Probe) {
  Write-Host ""
  Write-Host "Codex could not start. The actual check result follows:" -ForegroundColor Yellow
  if ($Probe.error) { Write-Host $Probe.error -ForegroundColor Yellow }
  if ($Probe.stdout) { Write-Host $Probe.stdout }
  if ($Probe.stderr) { Write-Host $Probe.stderr }
  try {
    New-Item -ItemType Directory -Force -Path $bmhRuntimeRoot | Out-Null
    $bmhProbeLog = Join-Path $bmhRuntimeRoot "last-cli-check.json"
    $Probe | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $bmhProbeLog -Encoding UTF8
    Write-Host "Diagnostic file: $bmhProbeLog"
  }
  catch { Write-Host "The diagnostic file could not be saved." }
}

function Install-CodexPackage([string]$PackageSpec) {
  # Check the native command exit code explicitly. npm warnings are not a
  # terminating PowerShell error and must stay visible in this window.
  $previousErrorPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    & $bmhNpm install --global --prefix $bmhCodexPrefix --include=optional --no-audit --no-fund $PackageSpec
    $installExit = $LASTEXITCODE
  }
  finally { $ErrorActionPreference = $previousErrorPreference }
  if ($installExit -ne 0) { Stop-WithMessage "Codex installation did not complete. Review the npm error above." }
}

function Stop-WithMessage([string]$Message) {
  Write-Host ""
  Write-Host $Message -ForegroundColor Yellow
  Write-Host "See tools/bmh-team/README.md for setup."
  exit 1
}

Write-Host ""
Write-Host "BMH Team v1.1.0 - Two ChatGPT accounts, one local project" -ForegroundColor Cyan
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
$bmhNodeArch = (& $bmhNode -p "process.arch").Trim()
if ($LASTEXITCODE -ne 0 -or @("x64", "arm64") -notcontains $bmhNodeArch) {
  Stop-WithMessage "Codex needs 64-bit Node.js on Windows. Install Node.js 22 x64 (or ARM64 on an ARM PC), then open this launcher again. Detected: $bmhNodeArch"
}
$bmhProbeScript = Join-Path $PSScriptRoot "runtime.mjs"
if (-not (Test-Path -LiteralPath $bmhProbeScript)) {
  Stop-WithMessage "runtime.mjs is missing. Extract the complete BMH Team v1.1.0 package before starting it."
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

$bmhPinnedVersion = "0.158.0"
$bmhRuntimeRoot = if ($env:LOCALAPPDATA) { Join-Path $env:LOCALAPPDATA "BMHTeam\runtime" } else { Join-Path $PSScriptRoot ".runtime" }
$bmhCodexPrefix = Join-Path $bmhRuntimeRoot "codex-$bmhPinnedVersion"
$bmhPrivateCodex = Join-Path $bmhCodexPrefix "codex.cmd"
$bmhCodex = Find-Codex
$bmhProbe = Get-CodexProbe $bmhCodex
if (-not $bmhProbe.ok) {
  $bmhCodex = if (Test-Path -LiteralPath $bmhPrivateCodex) { $bmhPrivateCodex } else { $null }
  $bmhProbe = Get-CodexProbe $bmhCodex
}
if (-not $bmhProbe.ok) {
  Write-Host ""
  Write-Host "BMH Team v1 uses official Codex CLI $bmhPinnedVersion." -ForegroundColor Yellow
  Write-Host "Installing the pinned official npm package in a private BMH Team folder."
  Write-Host "Your other Codex installations will not be changed."
  $bmhNpm = Find-Executable "npm.cmd"
  if (-not $bmhNpm) { $bmhNpm = Find-Executable "npm" }
  if (-not $bmhNpm) { Stop-WithMessage "npm was not found. Install the complete Node.js distribution and run this launcher again." }
  Install-CodexPackage "@openai/codex@$bmhPinnedVersion"
  $bmhCodex = $bmhPrivateCodex
  $bmhProbe = Get-CodexProbe $bmhCodex
  if (-not $bmhProbe.ok -and $bmhProbe.repairPackage) {
    Write-Host "Installing the missing official Windows Codex package for this CPU." -ForegroundColor Yellow
    Install-CodexPackage $bmhProbe.repairPackage
    $bmhProbe = Get-CodexProbe $bmhCodex
  }
}
if (-not $bmhProbe.ok) {
  Show-CodexFailure $bmhProbe
  Stop-WithMessage "Codex CLI $bmhPinnedVersion is not ready. Send the actual error shown above if it still cannot start."
}
$env:BMH_TEAM_CODEX = $bmhCodex
Write-Host "Codex CLI $bmhPinnedVersion is ready." -ForegroundColor Green

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
