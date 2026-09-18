# Registers hidden startup commands for the two host-only services required by
# the Docker deployment: AGY bridge and GitHub deployment watcher.
$ErrorActionPreference = 'Stop'

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$startupDir = [Environment]::GetFolderPath('Startup')
$startupFile = Join-Path $startupDir 'BonMeetingRecapHostServices.vbs'

function To-VbsPath([string] $path) {
  return $path.Replace('"', '""')
}

$bridge = To-VbsPath (Join-Path $repoRoot 'start-agy-bridge.bat')
$watcher = To-VbsPath (Join-Path $repoRoot 'start-github-deploy-watcher.bat')
$vbs = @"
Set shell = CreateObject("WScript.Shell")
shell.Run "cmd.exe /c ""$bridge""", 0, False
WScript.Sleep 2000
shell.Run "cmd.exe /c ""$watcher""", 0, False
"@

Set-Content -Path $startupFile -Value $vbs -Encoding ASCII
Write-Host "Auto-start enabled: $startupFile"
