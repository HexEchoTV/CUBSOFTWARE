@echo off
title CubVault Launcher

:menu
cls

echo ============================================
echo    CubVault Password Manager Launcher
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

echo ============================================
echo    Choose how to start CubVault:
echo ============================================
echo.
echo    1. Backend Server Only (Start this first!)
echo    2. Desktop App (requires backend running)
echo    3. Web App (requires backend running)
echo    4. Backend + Desktop (All-in-one)
echo    5. Backend + Web (All-in-one)
echo    6. Exit
echo.
echo ============================================

choice /C 123456 /N /M "Enter your choice (1-6): "

if errorlevel 6 goto :eof
if errorlevel 5 goto backend_and_web
if errorlevel 4 goto backend_and_desktop
if errorlevel 3 goto web_only
if errorlevel 2 goto desktop_only
if errorlevel 1 goto backend_only

:backend_only
cls
echo.
echo [*] Starting Backend Server...
echo.
start "CubVault Backend Server" cmd /k "%~dp0start-backend.bat"
echo.
echo [+] Backend server is starting in a new window
echo [+] API will be available at: http://localhost:3001
echo.
echo [*] Waiting for backend to initialize...
timeout /t 3 /nobreak >nul
echo.
echo [+] Backend should be ready now!
echo [*] Returning to menu to start Desktop or Web App...
timeout /t 2 /nobreak >nul
goto menu

:desktop_only
cls
echo.
echo [*] Opening Desktop App...
echo.
echo [!] Make sure the backend server is running on port 3001!
echo [!] If not, choose option 1 first.
echo.
start "CubVault Desktop App" cmd /k "%~dp0open-desktop.bat"
echo.
echo [+] Desktop app is starting...
echo.
timeout /t 2 /nobreak >nul
goto menu

:web_only
cls
echo.
echo [*] Opening Web App...
echo.
echo [!] Make sure the backend server is running on port 3001!
echo [!] If not, choose option 1 first.
echo.
start "CubVault Web App" cmd /k "%~dp0open-web.bat"
echo.
echo [+] Web app is starting at http://localhost:3000
echo.
timeout /t 2 /nobreak >nul
goto menu

:backend_and_desktop
cls
echo.
echo [*] Starting Backend Server + Desktop App...
echo.
start "CubVault Backend Server" cmd /k "%~dp0start-backend.bat"
echo [+] Backend server window opened
timeout /t 5 /nobreak >nul
echo.
start "CubVault Desktop App" cmd /k "%~dp0open-desktop.bat"
echo [+] Desktop app window opened
echo.
echo [+] CubVault is starting...
echo [+] Backend API: http://localhost:3001
echo.
pause
goto :eof

:backend_and_web
cls
echo.
echo [*] Starting Backend Server + Web App...
echo.
start "CubVault Backend Server" cmd /k "%~dp0start-backend.bat"
echo [+] Backend server window opened
timeout /t 5 /nobreak >nul
echo.
start "CubVault Web App" cmd /k "%~dp0open-web.bat"
echo [+] Web app window opened
echo.
echo [+] CubVault is starting...
echo [+] Backend API: http://localhost:3001
echo [+] Web app: http://localhost:3000
echo.
pause
goto :eof
