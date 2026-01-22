@echo off
title CubVault Desktop App
cls

echo ============================================
echo    CubVault Desktop App
echo ============================================
echo.

:: Check if dependencies are installed
if not exist "node_modules\" (
    echo [!] Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo.
)

echo [*] Starting desktop app...
echo [*] Connecting to backend at http://localhost:3001
echo.
echo ============================================
echo    Press Ctrl+C to stop the app
echo ============================================
echo.

npm run dev:desktop
