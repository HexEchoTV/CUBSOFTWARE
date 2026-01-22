@echo off
title CubVault Web App
cls

echo ============================================
echo    CubVault Web App
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

echo [*] Starting web server...
echo [*] Connecting to backend at http://localhost:3001
echo [*] Web app will open at http://localhost:3000
echo.
echo ============================================
echo    Press Ctrl+C to stop the web server
echo ============================================
echo.

npm run dev:web
