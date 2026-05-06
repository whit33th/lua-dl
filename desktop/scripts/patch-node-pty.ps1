$ErrorActionPreference = "Stop"

$DesktopRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$NodePtyRoot = Join-Path $DesktopRoot "node_modules\node-pty"

if (-not (Test-Path $NodePtyRoot)) {
  Write-Host "node-pty is not installed yet; skipping patch."
  exit 0
}

$Files = @(
  (Join-Path $NodePtyRoot "binding.gyp"),
  (Join-Path $NodePtyRoot "deps\winpty\src\winpty.gyp")
)

foreach ($File in $Files) {
  if (-not (Test-Path $File)) {
    continue
  }

  $Content = Get-Content -Raw -LiteralPath $File
  $Patched = $Content -replace "(?ms)\s*'msvs_configuration_attributes':\s*\{\s*'SpectreMitigation':\s*'Spectre'\s*\},\r?\n", "`r`n"

  if ($Patched -ne $Content) {
    Set-Content -LiteralPath $File -Value $Patched -NoNewline
    Write-Host "Patched node-pty SpectreMitigation in $File"
  }
}

$GeneratedProjects = Get-ChildItem -Path (Join-Path $NodePtyRoot "build") -Recurse -Filter *.vcxproj -ErrorAction SilentlyContinue
foreach ($Project in $GeneratedProjects) {
  $Content = Get-Content -Raw -LiteralPath $Project.FullName
  $Patched = $Content -replace "(?ms)\s*<SpectreMitigation>Spectre</SpectreMitigation>\r?\n", "`r`n"
  if ($Patched -ne $Content) {
    Set-Content -LiteralPath $Project.FullName -Value $Patched -NoNewline
    Write-Host "Patched generated vcxproj SpectreMitigation in $($Project.FullName)"
  }
}
