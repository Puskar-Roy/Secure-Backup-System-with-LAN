@echo off
REM Start GUI Client (Port 3000)
REM User-friendly interface for backups

cd /d "%~dp0.."
echo.
echo =================================
echo   Backup GUI Starting...
echo =================================
echo.
echo Dashboard: http://localhost:3000
echo Settings:  http://localhost:3000/settings
echo Help:      http://localhost:3000/help
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:3000
echo.
echo Press Ctrl+C to stop
echo.
node src/servers/gui-server.js
