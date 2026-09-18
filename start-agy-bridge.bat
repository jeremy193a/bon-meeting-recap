@echo off
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

if not exist .env (
  echo [ERROR] Missing .env. Copy .env.example to .env and set AGY_BRIDGE_TOKEN first.
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in (".env") do (
  if "%%A"=="AGY_BRIDGE_TOKEN" set "AGY_BRIDGE_TOKEN=%%B"
  if "%%A"=="AGY_COMMAND" set "AGY_COMMAND=%%B"
)

if "%AGY_BRIDGE_TOKEN%"=="" (
  echo [ERROR] AGY_BRIDGE_TOKEN is missing from .env.
  exit /b 1
)

set "AGY_BRIDGE_WORKSPACE=%CD%"
set "PATH=%LOCALAPPDATA%\agy\bin;%PATH%"
echo Starting AGY host bridge on port 3310...
echo Keep this terminal running. Docker uses this bridge to access the authenticated agy.exe.
node scripts\agy-host-bridge.mjs
