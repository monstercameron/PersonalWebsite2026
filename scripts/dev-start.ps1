$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $root "logs"
$pidFile = Join-Path $root ".devserver.pid"
$outLogFile = Join-Path $logsDir "devserver.out.log"
$errLogFile = Join-Path $logsDir "devserver.err.log"

New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

if (Test-Path $pidFile) {
  $existingPid = Get-Content $pidFile
  if ($existingPid -and (Get-Process -Id $existingPid -ErrorAction SilentlyContinue)) {
    Write-Output "Dev server already running with PID $existingPid"
    exit 0
  }
  Remove-Item $pidFile -Force
}

$proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run dev" -WorkingDirectory $root -RedirectStandardOutput $outLogFile -RedirectStandardError $errLogFile -PassThru
$proc.Id | Set-Content $pidFile
Write-Output "Started dev server in background. PID: $($proc.Id)"
Write-Output "Stdout: $outLogFile"
Write-Output "Stderr: $errLogFile"
