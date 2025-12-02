#!/bin/bash
# Start Backup Server (Port 8080)
# Manages backup receiver and admin panel

cd "$(dirname "$0")/.."
echo "🚀 Starting Backup Server..."
echo "📦 Admin Panel: http://localhost:8080/admin"
echo "🌐 Explorer: http://localhost:8080/explorer"
echo ""
node server.js
