$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root ".devserver.pid"

if (-not (Test-Path $pidFile)) {
  Write-Output "No PID file found. Dev server may already be stopped."
  exit 0
}

$targetPid = Get-Content $pidFile
if ($targetPid -and (Get-Process -Id $targetPid -ErrorAction SilentlyContinue)) {
  Stop-Process -Id $targetPid -Force
  Write-Output "Stopped dev server PID $targetPid"
} else {
  Write-Output "Process not found for PID $targetPid"
}

Remove-Item $pidFile -Force

