@echo off
title CUB Software - Development Server
color 0B

echo.
echo  ======================================================================
echo                         CUB SOFTWARE
echo              Development Server Startup Script
echo  ======================================================================
echo.

:: Check if Node.js is installed
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if Python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

cd /d "%~dp0"

echo  [INFO] Starting CUB Software services...
echo.

:: Start Flask website in new window
echo  [1/4] Starting CubSoftware Website (Flask)...
start "CubSoftware Website" cmd /k "cd /d "%~dp0apps\cubsoftware-website" && python main.py"
timeout /t 2 >nul

:: Start QuestCord in new window
echo  [2/4] Starting QuestCord (Discord Bot + Web)...
cd /d "%~dp0apps\questcord"
if exist "node_modules" (
    start "QuestCord" cmd /k "node start.js"
) else (
    echo  [WARN] QuestCord node_modules not found. Run 'npm install' first.
    start "QuestCord" cmd /k "npm install && node start.js"
)
timeout /t 2 >nul

:: Start The Onion Bot in new window
echo  [3/4] Starting The Onion Bot (Discord Bot)...
cd /d "%~dp0..\The Onion Bot"
if exist "node_modules" (
    start "The Onion Bot" cmd /k "node index.js"
) else (
    echo  [WARN] Onion Bot node_modules not found. Run 'npm install' first.
    start "The Onion Bot" cmd /k "npm install && node index.js"
)
timeout /t 2 >nul

:: Start CubVault Electron (if built)
echo  [4/4] Starting CubVault (Electron App)...
cd /d "%~dp0apps\cubvault"
if exist "node_modules" (
    if exist "dist\desktop\main.js" (
        start "CubVault" cmd /k "npm run dev"
    ) else (
        echo  [INFO] CubVault not built yet. Building now...
        start "CubVault" cmd /k "npm install && npm run dev"
    )
) else (
    echo  [INFO] CubVault node_modules not found. Installing...
    start "CubVault" cmd /k "npm install && npm run dev"
)

cd /d "%~dp0"

echo.
echo  ======================================================================
echo                     All services started!
echo  ======================================================================
echo.
echo  CubSoftware Website:    http://localhost:3000
echo  QuestCord:              http://localhost:3003
echo  The Onion Bot:          Discord Bot (check webhook for status)
echo  CubVault:               Desktop App (Electron)
echo.
echo  Apps available at:
echo    - Social Media Saver:     http://localhost:3000/apps/social-media-saver
echo    - StreamerBot Commands:   http://localhost:3000/apps/streamerbot-commands
echo    - CubVault Info:          http://localhost:3000/apps/cubvault
echo.
echo  Press any key to close this window (services will keep running)
echo  ======================================================================
pause >nul
