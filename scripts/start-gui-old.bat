@echo off
echo Starting Backup Client GUI...
echo.
echo Opening browser at http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

start "" http://localhost:3000
node gui-server.js