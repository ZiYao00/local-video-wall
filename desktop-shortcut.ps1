param(
  [ValidateSet('install', 'remove')]
  [string]$Action = 'install'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Desktop = [Environment]::GetFolderPath('Desktop')
$ShortcutPath = Join-Path $Desktop 'Local Video Wall Desktop.lnk'
$LegacyShortcutPath = Join-Path $Desktop 'Local Video Wall.lnk'

if ($Action -eq 'remove') {
  foreach ($Path in @($ShortcutPath, $LegacyShortcutPath)) {
    if (Test-Path -LiteralPath $Path) {
      Remove-Item -LiteralPath $Path -Force
    }
  }
  exit 0
}

$Launcher = Join-Path $Root 'desktop-start.vbs'
$DesktopRuntime = Join-Path $Root 'desktop\node_modules\electron\dist\electron.exe'
$Wscript = Join-Path $env:WINDIR 'System32\wscript.exe'

if (-not (Test-Path -LiteralPath $Launcher -PathType Leaf)) {
  throw "Desktop launcher is missing: $Launcher"
}
if (-not (Test-Path -LiteralPath $DesktopRuntime -PathType Leaf)) {
  throw "Local Video Wall Desktop runtime is missing: $DesktopRuntime"
}
if (-not (Test-Path -LiteralPath $Wscript -PathType Leaf)) {
  throw "Windows Script Host is missing: $Wscript"
}

if (Test-Path -LiteralPath $LegacyShortcutPath) {
  Remove-Item -LiteralPath $LegacyShortcutPath -Force
}

$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Wscript
$Shortcut.Arguments = '"' + $Launcher + '"'
$Shortcut.WorkingDirectory = $Root
$Shortcut.IconLocation = $DesktopRuntime + ',0'
$Shortcut.Description = 'Local Video Wall Desktop'
$Shortcut.Save()

if (-not (Test-Path -LiteralPath $ShortcutPath -PathType Leaf)) {
  throw "Desktop shortcut was not created: $ShortcutPath"
}

Write-Output $ShortcutPath
