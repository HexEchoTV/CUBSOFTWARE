@echo off
setlocal enabledelayedexpansion
title The Onion Bot - Setup

REM Go to script directory
cd /d "%~dp0"

cls

echo ====================================================
echo        THE ONION BOT (TOB) - AUTOMATIC SETUP
echo ====================================================
echo.
echo Checking system requirements...
echo.

REM ========================================
REM Step 1: Check/Install Node.js
REM ========================================
echo [1/4] Checking for Node.js...

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [INFO] Node.js not found - installing now...
echo [INFO] Downloading Node.js v20.11.0...
echo [INFO] This may take 2-5 minutes depending on your connection...
echo.

powershell -Command "Write-Host 'Downloading...'; Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\node-installer.msi' -UseBasicParsing"

if not exist "%TEMP%\node-installer.msi" (
    echo.
    echo [ERROR] Download failed!
    echo [ERROR] Please check your internet connection and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Download complete!
echo.
echo [INFO] Installing Node.js...
echo [INFO] This will take 2-3 minutes, please wait...
echo.

msiexec /i "%TEMP%\node-installer.msi" /quiet /norestart

echo [INFO] Waiting for installation to complete...
ping 127.0.0.1 -n 11 >nul

del "%TEMP%\node-installer.msi" 2>nul

REM Add Node.js to PATH for current session
set "PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%"

    echo [OK] Node.js installation complete!
    echo.
)

echo [OK] Node.js is installed
call node --version
call npm --version
echo.
echo Continuing...

REM ========================================
REM Step 2: Verify Node.js is working
REM ========================================
echo [2/4] Verifying Node.js installation...

where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js installation failed or not in PATH
    echo [ERROR] Please install Node.js manually from: https://nodejs.org
    echo [ERROR] Then run this script again.
    echo.
    pause
    exit /b 1
)

where npm >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] npm not found!
    echo [ERROR] Please close this window and run setup.bat again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js and npm are working correctly
call node --version
call npm --version
echo.

REM ========================================
REM Step 3: Setup bot configuration
REM ========================================
echo [3/4] Setting up bot configuration...

if not exist ".env" (
    echo.
    echo ====================================================
    echo         ENTER YOUR DISCORD BOT CREDENTIALS
    echo ====================================================
    echo.
    echo You need to provide:
    echo   1. DISCORD_TOKEN  - Your bot token from Discord Developer Portal
    echo   2. CLIENT_ID      - Your application/client ID
    echo   3. GUILD_ID       - Your Discord server ID
    echo.
    echo Note: CREATOR_ID will be automatically set to 378501056008683530 (CUB)
    echo.

    set /p DISCORD_TOKEN="Enter your Discord Bot Token: "
    echo.
    set /p CLIENT_ID="Enter your Client ID (Application ID): "
    echo.
    set /p GUILD_ID="Enter your Guild ID (Server ID): "
    echo.

    REM Validate that values were entered
    if not defined DISCORD_TOKEN (
        echo [ERROR] Discord Token cannot be empty!
        pause
        exit /b 1
    )
    if not defined CLIENT_ID (
        echo [ERROR] Client ID cannot be empty!
        pause
        exit /b 1
    )
    if not defined GUILD_ID (
        echo [ERROR] Guild ID cannot be empty!
        pause
        exit /b 1
    )

    echo [INFO] Creating .env file...
    (
        echo DISCORD_TOKEN=!DISCORD_TOKEN!
        echo CLIENT_ID=!CLIENT_ID!
        echo GUILD_ID=!GUILD_ID!
        echo CREATOR_ID=378501056008683530
    ) > .env

    if not exist ".env" (
        echo [ERROR] Failed to create .env file
        echo.
        pause
        exit /b 1
    )

    echo [OK] .env file created successfully!
    echo.
) else (
    echo [OK] .env file already exists
    echo.
)

REM ========================================
REM Step 4: Install dependencies
REM ========================================
echo [4/4] Installing bot dependencies...
echo [INFO] Running npm install...
echo.

call npm install

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo [ERROR] Make sure you have internet connection.
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] Dependencies installed successfully!
echo.

REM ========================================
REM Deploy commands
REM ========================================
echo [INFO] Deploying Discord slash commands...
echo.

call node deploy-commands.js

if %errorLevel% neq 0 (
    echo.
    echo [ERROR] Failed to deploy commands!
    echo [ERROR] Check your .env file has correct credentials.
    echo.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo        THE ONION BOT (TOB) - SETUP COMPLETE
echo ====================================================
echo.
echo All systems ready! Starting the bot...
echo.
echo To run the bot in the future, just use run.bat
echo.
echo Press any key to start the bot...
pause >nul

REM ========================================
REM Start the bot
REM ========================================
cls
echo ====================================================
echo          THE ONION BOT (TOB) - STARTING
echo ====================================================
echo.
echo The bot is now running!
echo.
echo To stop the bot, press Ctrl+C
echo.
echo ====================================================
echo.

call node index.js

REM If bot stops, keep window open
echo.
echo.
echo Bot has stopped.
echo.
pause
goto :eof

REM Catch-all - keep window open
pause
