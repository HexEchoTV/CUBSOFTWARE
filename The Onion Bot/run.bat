@echo off
title The Onion Bot
color 0A

echo ====================================================
echo        THE ONION BOT (TOB) - AUTOMATIC SETUP
echo ====================================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo [ERROR] Please run setup.bat first.
    echo.
    pause
    exit /b 1
)

REM Check if .env exists
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo [ERROR] Please run setup.bat first or create a .env file.
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting The Onion Bot...
echo.

call npm start

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Bot encountered an error.
    echo.
    pause
)
