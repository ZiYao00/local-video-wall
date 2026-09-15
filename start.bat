@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0"

set "APP_URL=http://127.0.0.1:8787"
set "APP_PY=%~dp0app.py"

echo Starting Local Video Wall...
echo.
echo Browser will open automatically:
echo %APP_URL%
echo.

REM Open browser after a short delay, without using PowerShell.
start "" /min cmd /c "ping -n 3 127.0.0.1 >nul & start "" %APP_URL%"

REM Prefer the Windows Python launcher if available, otherwise use python.
where py >nul 2>nul
if %errorlevel%==0 (
    py -3 "%APP_PY%"
    goto app_finished
)

where python >nul 2>nul
if %errorlevel%==0 (
    python "%APP_PY%"
    goto app_finished
)

echo Python 3.10 or later was not found.
echo Install Python for Windows, enable "Add Python to PATH", then run start.bat again.
echo https://www.python.org/downloads/windows/
echo.

:app_finished
pause
endlocal
