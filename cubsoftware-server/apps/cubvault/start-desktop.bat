@echo off
title CubVault Desktop - Starting...
cls

echo ============================================
echo    CubVault Password Manager - Desktop App
echo    by CUB Software
echo ============================================
echo.
echo [*] This will start both the backend server
echo     and the desktop application
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

:: Kill processes on port 3001 (CubVault backend)
echo [*] Checking for processes on port 3001...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
        echo [!] Found process on port 3001 ^(PID: %%a^) - terminating...
        taskkill /F /PID %%a >nul 2>&1
    )
) else (
    echo [+] No processes found on port 3001
)

:: Kill any existing CubVault Electron processes
echo [*] Checking for CubVault Electron processes...
tasklist /FI "IMAGENAME eq electron.exe" 2>NUL | find /I /N "electron.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [!] Found Electron processes - checking for CubVault...
    taskkill /F /IM electron.exe /FI "WINDOWTITLE eq *CubVault*" >nul 2>&1
)

echo [+] Cleanup complete
echo.

:: Start backend server in a separate window
echo [*] Starting backend server...
start "CubVault Backend Server" cmd /k "%~dp0start-server.bat"
echo [+] Backend server window launched
echo [*] Waiting for server to initialize...
timeout /t 5 /nobreak >nul
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

:: Start the desktop application
echo ============================================
echo    Starting CubVault Desktop App...
echo ============================================
echo.
echo [*] Compiling TypeScript...
echo [*] Bundling React app...
echo [*] Launching Electron...
echo.
echo Press Ctrl+C to stop the app
echo ============================================
echo.

:: Run the desktop app
call npm run dev:desktop

:: If the app exits
echo.
echo ============================================
echo    CubVault Desktop has stopped
echo ============================================
pause
