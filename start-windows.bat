@echo off
title Bon Meeting Recap Server
cd /d %~dp0
echo ===================================================
echo     BON MEETING RECAP - WINDOWS SERVER 24/7
echo ===================================================

echo [1/3] Kiem tra cac goi phu thuoc (Dependencies)...
call pnpm install

echo [2/3] Bien dich ma nguon TypeScript...
call pnpm build

echo [3/3] Khoi chay Server tren cong 3300...
echo Truy cap ung dung tai: http://localhost:3300
call pnpm start

pause
