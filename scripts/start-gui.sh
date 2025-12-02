#!/bin/bash
# Start GUI Client (Port 3000)
# User-friendly interface for backups

cd "$(dirname "$0")/.."
echo "🎨 Starting GUI Client..."
echo "📊 Dashboard: http://localhost:3000"
echo ""

# Open browser after 2 seconds
(sleep 2 && xdg-open http://localhost:3000 2>/dev/null) &

node src/servers/gui-server.js
