@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "DEPLOY_REPO_DIR=%CD%"
set "DEPLOY_BRANCH=main"
set "DEPLOY_POLL_INTERVAL_MS=60000"

echo Watching GitHub main branch and rebuilding Docker on new commits...
node scripts\github-deploy-watcher.mjs
