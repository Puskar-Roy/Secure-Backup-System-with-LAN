@echo off
REM Setup script for Windows autostart
REM This creates a scheduled task to run backup on startup

echo Setting up automatic backup on Windows startup...
echo.

set "PROJECT_DIR=%~dp0.."
set "TASK_NAME=BackupClientDaemon"

echo Creating Windows scheduled task...
echo.

REM Create VBS script for hidden execution
echo Set WshShell = CreateObject("WScript.Shell") > "%PROJECT_DIR%\scripts\run-hidden.vbs"
echo WshShell.Run "cmd /c cd /d ""%PROJECT_DIR%"" && node client.js daemon", 0, False >> "%PROJECT_DIR%\scripts\run-hidden.vbs"

REM Create scheduled task
schtasks /create /tn "%TASK_NAME%" /tr "wscript.exe \"%PROJECT_DIR%\scripts\run-hidden.vbs\"" /sc onlogon /rl highest /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Autostart configured successfully!
    echo.
    echo The backup daemon will start automatically when you login.
    echo.
    echo Commands:
    echo   View task:    schtasks /query /tn "%TASK_NAME%"
    echo   Run now:      schtasks /run /tn "%TASK_NAME%"
    echo   Disable:      schtasks /change /tn "%TASK_NAME%" /disable
    echo   Remove:       schtasks /delete /tn "%TASK_NAME%" /f
    echo.
) else (
    echo.
    echo ✗ Failed to create scheduled task
    echo Please run this script as Administrator
    echo.
)

echo Configure backup schedule in: %PROJECT_DIR%\config.json
echo Set 'schedule.enabled' to true and add your preferred times
echo.

pause
