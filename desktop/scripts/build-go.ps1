$ErrorActionPreference = "Stop"

$DesktopRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$RepoRoot = Resolve-Path (Join-Path $DesktopRoot "..")
$OutDir = Join-Path $DesktopRoot "resources\bin"
$OutFile = Join-Path $OutDir "lua-dl.exe"

if (-not (Get-Command go -ErrorAction SilentlyContinue)) {
  throw "Go was not found in PATH. Install Go 1.24+ or add it to PATH, then rerun npm run build:go."
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

Push-Location $RepoRoot
try {
  go build -trimpath -ldflags="-s -w" -o $OutFile .\cmd\lua-dl
}
finally {
  Pop-Location
}

Write-Host "Built $OutFile"
