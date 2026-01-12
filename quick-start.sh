#!/bin/bash

# Quick Start Script for Backup System
# This script helps you test and verify everything works

echo "🚀 Backup System Quick Start"
echo "=============================="
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Node.js
echo "1️⃣  Checking Node.js..."
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "   ✅ Node.js $NODE_VERSION found"
else
    echo "   ❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "server.js" ] || [ ! -f "client.js" ]; then
    echo "   ❌ Please run this script from the project root directory"
    exit 1
fi

# Check dependencies
echo ""
echo "2️⃣  Checking dependencies..."
if [ -d "node_modules" ]; then
    echo "   ✅ Dependencies installed"
else
    echo "   ⚠️  Dependencies not found. Installing..."
    npm install
fi

# Check config
echo ""
echo "3️⃣  Checking configuration..."
if [ -f "config.json" ]; then
    echo "   ✅ config.json found"
    
    # Check if sources are configured
    SOURCES_COUNT=$(node -e "const c=require('./config.json'); console.log(c.backup.sources.length)")
    if [ "$SOURCES_COUNT" -gt 0 ]; then
        echo "   ✅ $SOURCES_COUNT backup source(s) configured"
    else
        echo "   ⚠️  No backup sources configured"
        echo "      Edit config.json to add paths to backup"
    fi
else
    echo "   ⚠️  config.json not found. Creating default..."
    node -e "const fs=require('fs'); const config={server:{url:'http://localhost:8080'},backup:{sources:[],exclusions:['**/node_modules/**','**/.git/**']}}; fs.writeFileSync('config.json',JSON.stringify(config,null,2))"
fi

# Check if logs directory exists
echo ""
echo "4️⃣  Checking logs directory..."
if [ -d "logs" ]; then
    echo "   ✅ logs/ directory exists"
else
    echo "   📁 Creating logs/ directory..."
    mkdir -p logs
    echo "   ✅ Created"
fi

# Offer to start servers
echo ""
echo "=============================="
echo "Setup complete! 🎉"
echo ""
echo "What would you like to do?"
echo ""
echo "  [1] Start Backup Server (port 8080)"
echo "  [2] Start GUI Client (port 3000)"
echo "  [3] Start Both Servers"
echo "  [4] Run Test Backup"
echo "  [5] View Logs"
echo "  [6] Exit"
echo ""
read -p "Enter choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "🚀 Starting Backup Server..."
        echo "   Access at: http://localhost:8080/admin"
        echo "   Press Ctrl+C to stop"
        echo ""
        node server.js
        ;;
    2)
        echo ""
        echo "🎨 Starting GUI Client..."
        echo "   Access at: http://localhost:3000"
        echo "   Press Ctrl+C to stop"
        echo ""
        node src/servers/gui-server.js
        ;;
    3)
        echo ""
        echo "🚀 Starting Both Servers..."
        echo "   Backup Server: http://localhost:8080/admin"
        echo "   GUI Client: http://localhost:3000"
        echo "   Press Ctrl+C to stop"
        echo ""
        ./scripts/start-all.sh
        ;;
    4)
        echo ""
        echo "🧪 Running Test Backup..."
        echo ""
        node test-backup.js
        ;;
    5)
        echo ""
        echo "📋 Recent Logs:"
        echo "==============="
        if [ -f "logs/backup-$(date +%Y-%m-%d).log" ]; then
            tail -20 logs/backup-$(date +%Y-%m-%d).log
        else
            echo "No logs found for today"
        fi
        ;;
    6)
        echo "Goodbye! 👋"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
