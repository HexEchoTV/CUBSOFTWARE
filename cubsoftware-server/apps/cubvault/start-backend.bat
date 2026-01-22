@echo off
title CubVault Backend Server
cls

echo ============================================
echo    CubVault Backend Server
echo ============================================
echo.

:: Kill any process using port 3001
echo [*] Checking for processes on port 3001...
netstat -ano | findstr ":3001" | findstr "LISTENING" >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do (
        echo [!] Found process on port 3001 ^(PID: %%a^) - terminating...
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 1 /nobreak >nul
    echo [+] Port 3001 is now free
) else (
    echo [+] Port 3001 is available
)
echo.

cd server

:: Check if node_modules exists
if not exist "node_modules\" (
    echo [!] Installing server dependencies...
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
)

:: Check if database exists
if not exist "prisma\cubvault.db" (
    echo [!] Database not found - initializing...
    echo.
    echo [*] Generating Prisma client...
    call npm run prisma:generate
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to generate Prisma client!
        pause
        exit /b 1
    )
    echo.
    echo [*] Running database migrations...
    call npm run prisma:migrate
    if %errorlevel% neq 0 (
        echo [ERROR] Database migration failed!
        pause
        exit /b 1
    )
    echo.
    echo [+] Database initialized successfully!
    echo.
)

echo [*] Starting backend server...
echo [*] API will be available at http://localhost:3001
echo.
echo ============================================
echo    Backend Server Running
echo    Press Ctrl+C to stop
echo ============================================
echo.

npm run dev
