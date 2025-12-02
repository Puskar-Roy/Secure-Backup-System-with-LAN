@echo off
REM Start Backup Server (Port 8080)
REM Manages backup receiver and admin panel

cd /d "%~dp0.."
echo.
echo =================================
echo   Backup Server Starting...
echo =================================
echo.
echo Admin Panel: http://localhost:8080/admin
echo Explorer:    http://localhost:8080/explorer
echo.
echo Press Ctrl+C to stop
echo.
node server.js
