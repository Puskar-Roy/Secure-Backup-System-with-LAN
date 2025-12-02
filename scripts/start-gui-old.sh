#!/bin/bash
echo "Starting Backup Client GUI..."
echo ""
echo "Opening browser at http://localhost:3000"
echo "Press Ctrl+C to stop the server"
echo ""

# Try to open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000 &
elif command -v gnome-open > /dev/null; then
    gnome-open http://localhost:3000 &
fi

# Start server
node gui-server.js