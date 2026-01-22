@echo off
title Stop QuestCord
echo.
echo ╔═══════════════════════════════════════════════════╗
echo ║           Stopping QuestCord v3                   ║
echo ╚═══════════════════════════════════════════════════╝
echo.
echo Stopping all Node.js processes related to QuestCord...
echo.

:: Force kill all node.exe processes (stops both bot and webserver)
taskkill /F /IM node.exe >nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] QuestCord stopped successfully!
) else (
    echo [INFO] No QuestCord processes were running
)

echo.
pause
