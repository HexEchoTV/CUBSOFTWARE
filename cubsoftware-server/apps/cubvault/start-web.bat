@echo off
title CubVault Web Server - Starting...
cls

echo ============================================
echo    CubVault Password Manager - Web Version
echo    by CUB Software
echo ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [*] Node.js found:
node --version
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [!] node_modules not found - installing dependencies...
    echo [*] This may take a few minutes...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed!
        pause
        exit /b 1
    )
    echo.
    echo [+] Dependencies installed successfully!
    echo.
) else (
    echo [+] Dependencies already installed
    echo.
)

:: Start the web server
echo ============================================
echo    Starting CubVault Web Server...
echo ============================================
echo.
echo [*] Server will be available at:
echo     http://localhost:3000
echo.
echo [*] Press Ctrl+C to stop the server
echo ============================================
echo.

:: Run the web dev server
call npm run dev:web

:: If the server exits
echo.
echo ============================================
echo    CubVault Web Server has stopped
echo ============================================
pause
