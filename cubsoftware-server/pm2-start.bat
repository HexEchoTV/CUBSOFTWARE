@echo off
title CUB Software - PM2 Startup
color 0B

echo.
echo  ======================================================================
echo                         CUB SOFTWARE
echo                    PM2 Process Manager
echo  ======================================================================
echo.

:: Check if PM2 is installed
where pm2 >nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] PM2 is not installed. Installing globally...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        echo  [ERROR] Failed to install PM2
        pause
        exit /b 1
    )
    echo.
)

cd /d "%~dp0"

:: Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

echo  [INFO] Checking for existing PM2 processes...

:: Check if PM2 daemon is running and has processes
call pm2 pid >nul 2>&1
if %errorlevel% equ 0 (
    echo  [INFO] Found existing PM2 processes. Stopping them...
    call pm2 stop all >nul 2>&1
    call pm2 delete all >nul 2>&1
    echo  [INFO] All existing processes stopped and removed.
) else (
    echo  [INFO] No existing PM2 processes found.
)

echo.
echo  [INFO] Starting all services with PM2...
echo.

:: Start all apps
call pm2 start ecosystem.config.js

echo.
echo  ======================================================================
echo                        Services Started!
echo  ======================================================================
echo.
echo  CubSoftware Website:    http://localhost:3000
echo  QuestCord:              http://localhost:3003
echo  The Onion Bot:          Discord Bot (Solibot)
echo.
echo  ======================================================================
echo.
echo  Showing live logs... (Press Ctrl+C to stop watching)
echo.
echo  ======================================================================
echo.

:: Show live logs - this will keep running until Ctrl+C
call pm2 logs

:: After Ctrl+C, show menu
:menu
echo.
echo  ======================================================================
echo  Logs stopped. What would you like to do?
echo  ======================================================================
echo.
echo  [1] Resume watching logs
echo  [2] View status
echo  [3] Open monitoring dashboard (pm2 monit)
echo  [4] Restart all services
echo  [5] Stop all services and exit
echo  [6] Keep running in background and exit
echo.
set /p choice="  Enter choice (1-6): "

if "%choice%"=="1" (
    echo.
    echo  Resuming logs... (Press Ctrl+C to stop)
    echo.
    call pm2 logs
    goto menu
)
if "%choice%"=="2" (
    call pm2 status
    goto menu
)
if "%choice%"=="3" (
    call pm2 monit
    goto menu
)
if "%choice%"=="4" (
    echo  [INFO] Restarting all services...
    call pm2 restart all
    echo.
    echo  Showing logs... (Press Ctrl+C to stop)
    call pm2 logs
    goto menu
)
if "%choice%"=="5" (
    echo.
    echo  [INFO] Stopping all PM2 services...
    call pm2 stop all
    call pm2 delete all
    echo  [INFO] All services stopped.
    pause
    exit /b 0
)
if "%choice%"=="6" (
    echo.
    echo  [INFO] Services will keep running in background.
    echo  [INFO] Use 'pm2 status' to check, 'pm2 stop all' to stop.
    pause
    exit /b 0
)

echo  Invalid choice. Please enter 1-6.
goto menu
