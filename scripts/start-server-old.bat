@echo off
REM Backup Server Startup Script
REM This script starts the backup server automatically

cd /d "%~dp0"
node server.js 8080
