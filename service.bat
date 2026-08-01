@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
cd /d "%~dp0"

set "APP_NAME=LocalVideoWall"
set "APP_URL=http://127.0.0.1:8787"
set "APP_PORT=8787"
set "TASK_NAME=LocalVideoWall"
set "SCRIPT_DIR=%~dp0"
set "APP_PY=%SCRIPT_DIR%app.py"
set "HELPER_DIR=%APPDATA%\LocalVideoWall"
set "VBS_PATH=%HELPER_DIR%\start_hidden.vbs"
set "LOG_PATH=%HELPER_DIR%\service.log"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "STARTUP_VBS=%STARTUP_DIR%\LocalVideoWall.vbs"
set "STARTUP_LNK=%STARTUP_DIR%\LocalVideoWall.lnk"
set "PY_CMD="
set "COMMAND_MODE=0"

if /i "%~1"=="start" set "COMMAND_MODE=1" & goto start_background
if /i "%~1"=="stop" set "COMMAND_MODE=1" & goto stop_service
if /i "%~1"=="restart" set "COMMAND_MODE=1" & goto restart_service
if /i "%~1"=="status" set "COMMAND_MODE=1" & goto check_status
if /i "%~1"=="open" set "COMMAND_MODE=1" & goto open_browser
if /i "%~1"=="start-open" set "COMMAND_MODE=1" & goto start_and_open
if /i "%~1"=="install-startup" set "COMMAND_MODE=1" & goto install_startup
if /i "%~1"=="uninstall-startup" set "COMMAND_MODE=1" & goto uninstall_startup
if not "%~1"=="" (
  echo Unknown command: %~1
  echo Valid commands: start, stop, restart, status, open, start-open, install-startup, uninstall-startup
  exit /b 1
)

:menu
cls
echo Local Video Wall Service
echo.
call :status_line
echo.
echo App directory: %SCRIPT_DIR%
echo URL: %APP_URL%
echo Helper script: %VBS_PATH%
echo.
echo 1. Start in background
echo 2. Stop background service
echo 3. Install startup
echo 4. Uninstall startup
echo 5. Open browser
echo 6. Check status
echo 7. Restart background service
echo 8. Start in background and open browser
echo 0. Exit
echo.
set /p "choice=Choose: "

if "%choice%"=="1" goto start_background
if "%choice%"=="2" goto stop_service
if "%choice%"=="3" goto install_startup
if "%choice%"=="4" goto uninstall_startup
if "%choice%"=="5" goto open_browser
if "%choice%"=="6" goto check_status
if "%choice%"=="7" goto restart_service
if "%choice%"=="8" goto start_and_open
if "%choice%"=="0" goto end
goto menu

:start_background
call :is_running
if "%RUNNING%"=="1" (
  echo Service is already running ^(PID %SERVICE_PID%^).
  if "%COMMAND_MODE%"=="1" exit /b 0
  pause
  goto menu
)
call :launch_background
if "%errorlevel%"=="0" (
  echo Service started in background.
  if "%COMMAND_MODE%"=="1" exit /b 0
) else (
  echo Service did not start. Check that Python is installed and port %APP_PORT% is available.
  if "%COMMAND_MODE%"=="1" exit /b 1
)
pause
goto menu

:stop_service
call :stop_service_once
if "%COMMAND_MODE%"=="1" exit /b %errorlevel%
pause
goto menu

:install_startup
call :has_python
if not "%PYTHON_OK%"=="1" (
  echo Python was not found. Install Python 3.10 or later, then try again.
  if "%COMMAND_MODE%"=="1" exit /b 1
  pause
  goto menu
)
call :write_vbs
if not "%errorlevel%"=="0" (
  echo Failed to write helper script.
  if "%COMMAND_MODE%"=="1" exit /b 1
  pause
  goto menu
)
schtasks /Create /TN "%TASK_NAME%" /TR "wscript.exe ""%VBS_PATH%""" /SC ONLOGON /DELAY 0000:30 /RL LIMITED /F >nul 2>nul
if not "%errorlevel%"=="0" (
  schtasks /Create /TN "%TASK_NAME%" /TR "wscript.exe ""%VBS_PATH%""" /SC ONLOGON /RL LIMITED /F >nul 2>nul
)
if "%errorlevel%"=="0" (
  if exist "%STARTUP_VBS%" del "%STARTUP_VBS%" >nul 2>nul
  if exist "%STARTUP_LNK%" del "%STARTUP_LNK%" >nul 2>nul
  echo Startup entry installed.
  echo It uses a Windows Task Scheduler logon task and the APPDATA helper script.
  if "%COMMAND_MODE%"=="1" exit /b 0
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP_LNK%'); $shortcut.TargetPath = 'wscript.exe'; $shortcut.Arguments = [char]34 + '%VBS_PATH%' + [char]34; $shortcut.WorkingDirectory = '%HELPER_DIR%'; $shortcut.WindowStyle = 1; $shortcut.Description = 'Start Local Video Wall in the background'; $shortcut.Save()" >nul 2>nul
  if exist "%STARTUP_LNK%" (
    if exist "%STARTUP_VBS%" del "%STARTUP_VBS%" >nul 2>nul
    echo Startup entry installed.
    echo It uses the current user's Startup folder shortcut and the APPDATA helper script.
    if "%COMMAND_MODE%"=="1" exit /b 0
  ) else (
    echo Failed to install startup entry.
    if "%COMMAND_MODE%"=="1" exit /b 1
  )
)
pause
goto menu

:uninstall_startup
set "STARTUP_EXISTED=0"
schtasks /Query /TN "%TASK_NAME%" >nul 2>nul
if "%errorlevel%"=="0" (
  set "STARTUP_EXISTED=1"
  schtasks /Delete /TN "%TASK_NAME%" /F >nul 2>nul
)
if exist "%STARTUP_VBS%" (
  set "STARTUP_EXISTED=1"
  del "%STARTUP_VBS%" >nul 2>nul
)
if exist "%STARTUP_LNK%" (
  set "STARTUP_EXISTED=1"
  del "%STARTUP_LNK%" >nul 2>nul
)
if "%STARTUP_EXISTED%"=="0" (
  echo Startup entry was not installed.
) else (
  echo Startup entry removed.
)
if "%COMMAND_MODE%"=="1" exit /b 0
pause
goto menu

:open_browser
start "" "%APP_URL%"
if "%COMMAND_MODE%"=="1" exit /b 0
goto menu

:check_status
echo.
call :status_line
echo.
call :has_python
if "%PYTHON_OK%"=="1" (
  echo Python status: available
) else (
  echo Python status: not found
)
if exist "%VBS_PATH%" (
  echo Helper status: exists
) else (
  echo Helper status: not created yet
)
echo Log path: %LOG_PATH%
schtasks /Query /TN "%TASK_NAME%" >nul 2>nul
if "%errorlevel%"=="0" (
  echo Startup task: installed
) else if exist "%STARTUP_LNK%" (
  echo Startup task: Startup-folder shortcut exists
) else if exist "%STARTUP_VBS%" (
  echo Startup task: legacy Startup-folder entry exists
) else (
  echo Startup task: not installed
)
echo.
if "%COMMAND_MODE%"=="1" exit /b 0
pause
goto menu

:restart_service
call :stop_service_once
ping -n 2 127.0.0.1 >nul
call :launch_background
if "%errorlevel%"=="0" (
  echo Service restarted in background.
  if "%COMMAND_MODE%"=="1" exit /b 0
) else (
  echo Service did not restart. Check that Python is installed and port %APP_PORT% is available.
  if "%COMMAND_MODE%"=="1" exit /b 1
)
pause
goto menu

:start_and_open
call :is_running
if "%RUNNING%"=="1" (
  echo Service is already running ^(PID %SERVICE_PID%^).
) else (
  call :launch_background
  if "%errorlevel%"=="0" (
    echo Service started in background.
  ) else (
    echo Service did not start. Check that Python is installed and port %APP_PORT% is available.
    if "%COMMAND_MODE%"=="1" exit /b 1
    pause
    goto menu
  )
)
start "" "%APP_URL%"
if "%COMMAND_MODE%"=="1" exit /b 0
pause
goto menu

:end
endlocal
exit /b 0

:launch_background
call :has_python
if not "%PYTHON_OK%"=="1" (
  echo Python was not found. Install Python 3.10 or later, then try again.
  exit /b 1
)
call :write_vbs
if not "%errorlevel%"=="0" exit /b 1
wscript.exe "%VBS_PATH%"
ping -n 3 127.0.0.1 >nul
call :is_running
if "%RUNNING%"=="1" exit /b 0
exit /b 1

:stop_service_once
call :is_running
if not "%RUNNING%"=="1" (
  echo Local Video Wall service is not running. Nothing was stopped.
  exit /b 0
)
call :is_our_process %SERVICE_PID%
if not "%OWN_PROCESS%"=="1" (
  echo Refusing to stop PID %SERVICE_PID%: it is not this Local Video Wall instance.
  exit /b 1
)
taskkill /PID %SERVICE_PID% /F >nul 2>nul
if "%errorlevel%"=="0" (
  echo Service stopped.
  exit /b 0
)
echo Failed to stop service PID %SERVICE_PID%.
exit /b 1

:status_line
call :is_running
if "%RUNNING%"=="1" (
  echo Service status: running ^(PID %SERVICE_PID%^)
) else (
  echo Service status: stopped
)
schtasks /Query /TN "%TASK_NAME%" >nul 2>nul
if "%errorlevel%"=="0" (
  echo Startup status: installed
) else if exist "%STARTUP_LNK%" (
  echo Startup status: installed ^(Startup shortcut^)
) else if exist "%STARTUP_VBS%" (
  echo Startup status: installed ^(legacy Startup folder^)
) else (
  echo Startup status: not installed
)
exit /b 0

:write_vbs
call :ensure_helper_dir
if not "%errorlevel%"=="0" exit /b 1
> "%VBS_PATH%" echo Option Explicit
>> "%VBS_PATH%" echo Dim shell
>> "%VBS_PATH%" echo Set shell = CreateObject("WScript.Shell")
>> "%VBS_PATH%" echo shell.CurrentDirectory = "%SCRIPT_DIR%"
>> "%VBS_PATH%" echo shell.Run "cmd.exe /d /c cd /d " ^& Chr(34) ^& "%SCRIPT_DIR%" ^& Chr(34) ^& " && %PY_CMD% " ^& Chr(34) ^& "%APP_PY%" ^& Chr(34) ^& " >> " ^& Chr(34) ^& "%LOG_PATH%" ^& Chr(34) ^& " 2>>&1", 0, False
exit /b 0

:is_running
set "RUNNING=0"
set "SERVICE_PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr /R /C:":%APP_PORT% .*LISTENING"') do (
  call :is_our_process %%P
  if "!OWN_PROCESS!"=="1" (
    set "RUNNING=1"
    set "SERVICE_PID=%%P"
  )
)
exit /b 0

:is_our_process
set "OWN_PROCESS=0"
set "CHECK_PID=%~1"
if "%CHECK_PID%"=="" exit /b 0
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$p = Get-CimInstance Win32_Process -Filter ('ProcessId = ' + $env:CHECK_PID) -ErrorAction SilentlyContinue; if ($null -ne $p -and -not [string]::IsNullOrWhiteSpace($p.CommandLine) -and $p.CommandLine.IndexOf($env:APP_PY, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) { exit 0 }; exit 1" >nul 2>nul
if "%errorlevel%"=="0" set "OWN_PROCESS=1"
exit /b 0

:has_python
set "PYTHON_OK=0"
set "PY_CMD="
where py >nul 2>nul
if "%errorlevel%"=="0" (
  set "PYTHON_OK=1"
  set "PY_CMD=py -3"
  exit /b 0
)
where python >nul 2>nul
if "%errorlevel%"=="0" (
  set "PYTHON_OK=1"
  set "PY_CMD=python"
  exit /b 0
)
exit /b 0

:ensure_helper_dir
if not exist "%HELPER_DIR%" (
  mkdir "%HELPER_DIR%" >nul 2>nul
)
if not exist "%HELPER_DIR%" (
  echo Could not create helper directory:
  echo %HELPER_DIR%
  exit /b 1
)
exit /b 0
