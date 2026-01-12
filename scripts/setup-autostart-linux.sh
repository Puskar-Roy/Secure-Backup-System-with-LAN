#!/bin/bash
# Setup script for Linux autostart
# This creates a systemd service or autostart desktop entry

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "🚀 Setting up automatic backup on system startup..."
echo ""
echo "Choose installation method:"
echo "1. User Autostart (recommended - runs when you login)"
echo "2. Systemd Service (runs as system service - requires sudo)"
echo ""
read -p "Enter choice (1 or 2): " choice

if [ "$choice" = "1" ]; then
    # Create autostart directory
    AUTOSTART_DIR="$HOME/.config/autostart"
    mkdir -p "$AUTOSTART_DIR"
    
    # Create desktop entry
    cat > "$AUTOSTART_DIR/backup-client.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Backup Client Daemon
Comment=Automatic backup service
Exec=$PROJECT_DIR/scripts/autostart-linux.sh
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
EOF
    
    # Make script executable
    chmod +x "$PROJECT_DIR/scripts/autostart-linux.sh"
    
    echo "✅ Autostart configured!"
    echo "📍 Desktop entry: $AUTOSTART_DIR/backup-client.desktop"
    echo ""
    echo "The backup daemon will start automatically when you login."
    echo "To disable: remove the file $AUTOSTART_DIR/backup-client.desktop"
    
elif [ "$choice" = "2" ]; then
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        echo "❌ Systemd service requires root privileges"
        echo "Please run: sudo $0"
        exit 1
    fi
    
    # Create systemd service
    cat > /etc/systemd/system/backup-client.service << EOF
[Unit]
Description=Backup Client Daemon
After=network.target

[Service]
Type=forking
User=$SUDO_USER
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/node $PROJECT_DIR/client.js daemon
PIDFile=$PROJECT_DIR/backup-daemon.pid
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable backup-client.service
    
    echo "✅ Systemd service installed!"
    echo ""
    echo "Commands:"
    echo "  Start now:    sudo systemctl start backup-client"
    echo "  Stop:         sudo systemctl stop backup-client"
    echo "  Status:       sudo systemctl status backup-client"
    echo "  Disable:      sudo systemctl disable backup-client"
else
    echo "❌ Invalid choice"
    exit 1
fi

echo ""
echo "⚙️  Configure backup schedule in: $PROJECT_DIR/config.json"
echo "   Set 'schedule.enabled' to true and add your preferred times"
