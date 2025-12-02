# Professional Backup System

A comprehensive file backup solution with server, client, and user-friendly GUI interface.

## 🌟 Features

- **Backup Server** - Receives and stores backup files with versioning
- **Backup Client** - Automated file backup with scheduling and monitoring
- **GUI Interface** - User-friendly web interface for non-technical users
- **Admin Panel** - Professional management interface
- **File Explorer** - Browse and restore backed up files
- **Automatic Scheduling** - Schedule backups at specific times
- **Smart Exclusions** - Skip unnecessary files (node_modules, .git, etc.)
- **Error Recovery** - Automatic retry and resume capabilities
- **Comprehensive Logging** - Track all backup operations

## 📁 Project Structure

```
backup-system/
├── src/                          # Source code
│   ├── lib/                      # Shared utilities
│   │   ├── config-manager.js    # Configuration management
│   │   ├── logger.js            # Logging system
│   │   └── index.js             # Main exports
│   ├── servers/                  # Server implementations
│   │   ├── gui-server.js        # GUI web interface (port 3000)
│   │   └── backup-server.js     # Backup receiver (port 8080)
│   └── client/                   # Client implementations
│       └── backup-client.js     # Backup client logic
│
├── scripts/                      # Startup scripts
│   ├── start-server.sh/.bat     # Start backup server
│   ├── start-gui.sh/.bat        # Start GUI interface
│   └── start-all.sh             # Start everything
│
├── routes/                       # Express routes (server)
│   ├── admin.js                 # Admin panel routes
│   ├── api.js                   # API endpoints
│   ├── auth.js                  # Authentication
│   ├── backup.js                # Backup upload endpoints
│   ├── explorer.js              # File explorer
│   └── filesystem.js            # Filesystem operations
│
├── middleware/                   # Express middleware
│   └── auth.js                  # Authentication middleware
│
├── config/                       # Configuration files
│   ├── session.js               # Session configuration
│   └── paths.js                 # Path configuration
│
├── utils/                        # Utility functions
│   ├── storage.js               # Storage management
│   └── fileUtils.js             # File operations
│
├── views/                        # Server EJS templates
│   ├── admin.ejs                # Admin dashboard
│   ├── explorer.ejs             # File explorer
│   ├── login.ejs                # Login page
│   └── partials/                # Reusable components
│
├── views-gui/                    # GUI EJS templates
│   ├── dashboard.ejs            # User dashboard
│   ├── settings.ejs             # Settings page
│   ├── help.ejs                 # Help documentation
│   ├── logs.ejs                 # Log viewer
│   └── setup-windows.ejs        # Windows setup guide
│
├── public/                       # Static files (CSS, JS, images)
├── data/                         # Backup storage
├── logs/                         # Log files
├── docs/                         # Documentation
│
├── server.js                     # Backup server entry point
├── client.js                     # Backup client entry point
├── config.json                   # Main configuration
└── package.json                  # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- npm or pnpm

### Installation

```bash
# Clone or download the project
cd backup-system

# Install dependencies
npm install
# or
pnpm install
```

### Configuration

Edit `config.json`:

```json
{
  "server": {
    "url": "http://localhost:8080",
    "timeout": 60000,
    "retryAttempts": 3
  },
  "backup": {
    "sources": [
      "/path/to/your/documents",
      "/path/to/your/photos"
    ],
    "parallelUploads": 3
  },
  "schedule": {
    "enabled": true,
    "times": ["02:00", "14:00", "22:00"]
  }
}
```

## 🎯 Usage

### Option 1: Using Scripts (Recommended)

**Windows:**
```cmd
# Start backup server
scripts\start-server.bat

# Start GUI (in another terminal)
scripts\start-gui.bat
```

**Linux/Mac:**
```bash
# Start backup server
./scripts/start-server.sh

# Start GUI (in another terminal)
./scripts/start-gui.sh

# Or start everything at once
./scripts/start-all.sh
```

### Option 2: Using npm Scripts

```bash
# Start backup server (port 8080)
npm run server

# Start GUI interface (port 3000)
npm run gui

# Run backup client
npm run client:backup

# Run as daemon (scheduled backups)
npm run client:daemon

# Check status
npm run client:status
```

### Option 3: Direct Commands

```bash
# Backup server
node server.js

# GUI interface
node src/servers/gui-server.js

# Backup client
node client.js backup
node client.js daemon
node client.js status
node client.js logs
```

## 🌐 Access Points

After starting the servers:

- **GUI Dashboard**: http://localhost:3000
  - User-friendly interface
  - Manual backup controls
  - Settings management
  - Help documentation

- **Admin Panel**: http://localhost:8080/admin
  - Professional management interface
  - Statistics and monitoring
  - Configuration management

- **File Explorer**: http://localhost:8080/explorer
  - Browse backed up files
  - Search and restore
  - Version history

## 📖 Key Components

### 1. Backup Server (Port 8080)

Receives and stores backup files with:
- Version control and history
- File deduplication
- Metadata management
- Admin interface
- REST API

### 2. GUI Client (Port 3000)

User-friendly interface featuring:
- One-click backup buttons
- Visual configuration
- Schedule management
- Log viewer
- Windows auto-start setup guide
- Plain English help documentation

### 3. Backup Client (CLI)

Command-line tool for:
- Automated backups
- Scheduled operations
- Status monitoring
- Log viewing

## 🛠️ Configuration Management

### Centralized Configuration

The system uses a centralized `ConfigManager` class:

```javascript
const { ConfigManager } = require('./src/lib/config-manager');
const config = new ConfigManager();

// Get values
const serverUrl = config.get('server.url');
const sources = config.get('backup.sources');

// Set values
config.set('schedule.enabled', true);
config.set('backup.parallelUploads', 5);
```

### Configuration File (`config.json`)

```json
{
  "server": {
    "url": "http://localhost:8080",
    "timeout": 60000,
    "retryAttempts": 3,
    "retryDelay": 5000
  },
  "backup": {
    "sources": [],
    "exclusions": [
      "**/node_modules/**",
      "**/.git/**",
      "**/*.tmp"
    ],
    "parallelUploads": 3,
    "chunkSize": 5242880
  },
  "schedule": {
    "enabled": false,
    "times": ["02:00", "14:00", "22:00"],
    "timezone": "local"
  },
  "retention": {
    "keepDays": 30,
    "keepWeeks": 12,
    "keepMonths": 12
  },
  "logging": {
    "level": "info",
    "maxLogSize": 10485760,
    "keepLogs": 30
  }
}
```

## 📝 Logging System

### Centralized Logger

```javascript
const { Logger } = require('./src/lib/logger');
const logger = new Logger({ level: 'info' });

logger.info('Backup started');
logger.warn('File skipped');
logger.error('Upload failed');
logger.debug('Processing file');
```

### Log Files

Located in `logs/` directory:
- `backup-YYYY-MM-DD.log` - General operations
- `error-YYYY-MM-DD.log` - Errors only
- `history-YYYY-MM-DD.log` - Backup history

### Log Rotation

- Automatic rotation at 10MB
- Keeps last 30 days
- JSON formatted entries

## 🔐 Security

- Session-based authentication
- Password hashing (bcrypt)
- Secure file uploads
- Path validation
- Access control

## 🎨 GUI Features

### Dashboard
- Backup statistics
- Server status
- Manual backup controls
- Recent activity
- Quick actions

### Settings
- Server configuration
- Backup sources management
- Schedule setup
- Advanced options
- File exclusions

### Help
- Plain English explanations
- Getting started guide
- FAQ section
- Tips and tricks

### Windows Setup
- Task Scheduler guide
- Startup folder method
- Verification steps
- Troubleshooting

## 🔧 Development

### Project Architecture

```
┌─────────────┐
│   GUI       │ (Port 3000)
│   Server    │ User Interface
└──────┬──────┘
       │
       ├───────────────┐
       │               │
┌──────▼──────┐ ┌─────▼──────┐
│   Backup    │ │  Config    │
│   Client    │ │  Manager   │
└──────┬──────┘ └─────┬──────┘
       │               │
       │        ┌──────▼──────┐
       │        │   Logger    │
       │        └─────────────┘
       │
┌──────▼──────┐
│   Backup    │ (Port 8080)
│   Server    │ Receiver
└─────────────┘
```

### Adding New Features

1. **New utility**: Add to `src/lib/`
2. **New server route**: Add to `routes/`
3. **New GUI page**: Add to `views-gui/`
4. **New client feature**: Modify `client.js`

### Code Style

- Modular design
- Class-based architecture
- Comprehensive error handling
- Detailed logging
- Clear documentation

## 📚 Documentation

Additional documentation in `docs/`:
- `CLIENT-README.md` - Client usage guide
- `QUICK-START.md` - Quick start guide
- `AUTOSTART_SETUP.md` - Auto-start configuration
- `IMPROVEMENTS.md` - Feature enhancements
- `GUI-FEATURES.md` - GUI feature documentation
- `GUI-README.md` - GUI usage guide

## 🐛 Troubleshooting

### Connection Issues

```bash
# Test server connection
curl http://localhost:8080/api/config

# Check if ports are in use
netstat -an | grep 8080
netstat -an | grep 3000
```

### Permission Issues

```bash
# Linux: Make scripts executable
chmod +x scripts/*.sh

# Check file permissions
ls -la scripts/
```

### Configuration Issues

```bash
# Validate config
node -e "console.log(require('./config.json'))"

# Check logs
tail -f logs/backup-$(date +%Y-%m-%d).log
```

## 📄 License

This project is provided as-is for personal and commercial use.

## 🤝 Contributing

Contributions welcome! Please:
1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Submit pull requests

## 📧 Support

For issues and questions:
- Check the Help page in GUI
- Review documentation in `docs/`
- Check log files for errors
- Test connection to server

---

**Version**: 2.0.0
**Last Updated**: December 2025
