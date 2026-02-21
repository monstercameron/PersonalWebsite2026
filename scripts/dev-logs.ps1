$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$logsDir = Join-Path $root "logs"
$outLogFile = Join-Path $logsDir "devserver.out.log"
$errLogFile = Join-Path $logsDir "devserver.err.log"

if (-not (Test-Path $outLogFile) -and -not (Test-Path $errLogFile)) {
  Write-Output "No log files found yet."
  exit 0
}

if (Test-Path $outLogFile) {
  Write-Output "=== STDOUT ==="
  Get-Content $outLogFile -Tail 100
}

if (Test-Path $errLogFile) {
  Write-Output "=== STDERR ==="
  Get-Content $errLogFile -Tail 100
}
