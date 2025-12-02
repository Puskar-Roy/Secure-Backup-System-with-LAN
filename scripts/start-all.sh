#!/bin/bash
# Start Both Servers
# Runs backup server (8080) and GUI (3000) simultaneously

cd "$(dirname "$0")/.."
echo "🚀 Starting Complete Backup System..."
echo ""
echo "📦 Backup Server: http://localhost:8080/admin"
echo "🎨 GUI Client: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start backup server in background
node server.js &
SERVER_PID=$!

# Wait a moment
sleep 2

# Start GUI server
node src/servers/gui-server.js &
GUI_PID=$!

# Open browser
sleep 2
xdg-open http://localhost:3000 2>/dev/null &

# Wait for both processes
wait $SERVER_PID $GUI_PID
