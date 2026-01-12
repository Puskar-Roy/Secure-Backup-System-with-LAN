#!/bin/bash
# Automatic Backup Service - Linux Startup Script
# This script runs the backup client in daemon mode on system startup

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Log file
LOG_FILE="$PROJECT_DIR/logs/autostart-$(date +%Y-%m-%d).log"

# Ensure logs directory exists
mkdir -p "$PROJECT_DIR/logs"

echo "[$(date)] Starting backup daemon..." >> "$LOG_FILE"

# Wait for network to be available (important for remote backup servers)
sleep 10

# Change to project directory
cd "$PROJECT_DIR" || exit 1

# Start the backup daemon
node "$PROJECT_DIR/client.js" daemon >> "$LOG_FILE" 2>&1 &

# Save PID
echo $! > "$PROJECT_DIR/backup-daemon.pid"

echo "[$(date)] Backup daemon started (PID: $!)" >> "$LOG_FILE"
