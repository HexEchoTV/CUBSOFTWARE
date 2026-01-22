@echo off
if "%~1"=="" (
    echo Usage: download.bat ^<YouTube_URL^>
    echo Example: download.bat https://www.youtube.com/watch?v=dQw4w9WgXcQ
    pause
    exit /b 1
)

"C:\Users\Thorton\AppData\Local\Programs\Python\Python312\python.exe" "%~dp0downloader.py" %*
pause
