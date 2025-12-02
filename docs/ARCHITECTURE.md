# System Architecture Documentation

## Overview

The backup system follows a **modular, three-tier architecture** with clear separation of concerns.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Users / Clients                      │
└────────────┬──────────────────────────┬─────────────────┘
             │                          │
             │ HTTP:3000               │ HTTP:8080
             │                          │
┌────────────▼───────────┐   ┌─────────▼──────────────────┐
│   GUI Server (Port 3000) │   │  Backup Server (Port 8080) │
│   ├─ Dashboard          │   │  ├─ Admin Panel            │
│   ├─ Settings           │   │  ├─ File Explorer          │
│   ├─ Help              │   │  ├─ Upload API             │
│   └─ Logs              │   │  └─ Authentication         │
└────────────┬───────────┘   └─────────┬──────────────────┘
             │                          │
             │                          │
             └───────┬──────────────────┘
                     │
            ┌────────▼─────────┐
            │  Shared Libraries │
            │  ├─ ConfigManager │
            │  ├─ Logger        │
            │  └─ Utilities     │
            └────────┬──────────┘
                     │
            ┌────────▼─────────┐
            │  Backup Client    │
            │  ├─ File Scanner  │
            │  ├─ Uploader     │
            │  └─ Scheduler    │
            └───────────────────┘
                     │
            ┌────────▼─────────┐
            │  File System      │
            │  ├─ data/        │
            │  ├─ logs/        │
            │  └─ config.json  │
            └───────────────────┘
```

## Components

### 1. GUI Server (Port 3000)

**Purpose:** User-friendly web interface for non-technical users

**Technology:**
- Express.js web server
- EJS templating
- RESTful API
- Bootstrap/custom CSS

**Routes:**
- `GET /` - Dashboard
- `GET /settings` - Configuration
- `GET /help` - Documentation
- `GET /logs` - Log viewer
- `GET /setup-windows` - Windows guide
- `POST /api/backup` - Start backup
- `GET /api/status` - System status
- `GET /api/config` - Get configuration
- `POST /api/config` - Update configuration

**Key Files:**
```
src/servers/gui-server.js        # Main server
views-gui/                        # EJS templates
  ├─ dashboard.ejs               # Main dashboard
  ├─ settings.ejs                # Settings page
  ├─ help.ejs                    # Help page
  ├─ logs.ejs                    # Log viewer
  └─ setup-windows.ejs           # Windows setup
```

**Features:**
- One-click backups
- Visual configuration
- Real-time status
- Plain English documentation
- Windows auto-start guide

### 2. Backup Server (Port 8080)

**Purpose:** Receives and stores backup files, provides admin interface

**Technology:**
- Express.js web server
- Session management
- File upload handling (multer)
- SQLite database
- Authentication

**Routes:**
- `GET /admin` - Admin panel
- `GET /explorer` - File browser
- `POST /init-backup` - Initialize backup session
- `POST /upload-file` - Upload file chunks
- `POST /commit-version` - Finalize backup
- `GET /api/stats` - Statistics
- `GET /api/config` - Server config

**Key Files:**
```
server.js                        # Main entry
routes/
  ├─ admin.js                    # Admin routes
  ├─ api.js                      # API endpoints
  ├─ auth.js                     # Authentication
  ├─ backup.js                   # Backup uploads
  ├─ explorer.js                 # File browser
  └─ filesystem.js               # FS operations
middleware/
  └─ auth.js                     # Auth middleware
utils/
  ├─ storage.js                  # Storage management
  └─ fileUtils.js                # File utilities
views/
  ├─ admin.ejs                   # Admin dashboard
  ├─ explorer.ejs                # File explorer
  └─ login.ejs                   # Login page
```

**Features:**
- File versioning
- Deduplication
- Metadata storage
- User authentication
- File explorer
- Search capabilities

### 3. Backup Client (CLI)

**Purpose:** Automated backup operations and scheduling

**Technology:**
- Node.js CLI
- File system operations (fs, klaw)
- HTTP client (axios)
- Event-driven architecture
- Scheduling capabilities

**Commands:**
```bash
node client.js backup [source]   # Run backup
node client.js daemon             # Run as service
node client.js status             # Show status
node client.js logs               # View logs
node client.js config             # Show config
```

**Key Files:**
```
client.js                        # Main entry
src/client/
  └─ backup-client.js            # Client logic (future)
```

**Features:**
- Recursive file scanning
- Smart exclusions
- Hash calculation (SHA-256)
- Parallel uploads
- Error recovery
- Progress tracking
- Scheduling

### 4. Shared Libraries

**Purpose:** Reusable utilities across all components

**Location:** `src/lib/`

#### ConfigManager

**File:** `src/lib/config-manager.js`

**Purpose:** Centralized configuration management

**Methods:**
```javascript
loadConfig()          // Load from config.json
getDefaultConfig()    // Get defaults
saveConfig()          // Save to file
get(key)             // Get nested value
set(key, value)      // Set nested value
getAll()             // Get full config
update(newConfig)    // Merge update
```

**Usage:**
```javascript
const { ConfigManager } = require('./src/lib');
const config = new ConfigManager();
const url = config.get('server.url');
config.set('schedule.enabled', true);
```

#### Logger

**File:** `src/lib/logger.js`

**Purpose:** Centralized logging with rotation

**Methods:**
```javascript
info(message, data)    // Info log
warn(message, data)    // Warning log
error(message, data)   // Error log
debug(message, data)   // Debug log
history(message, data) // History log
readLogs(type, lines)  // Read logs
```

**Features:**
- Multiple log types (backup, error, history)
- JSON formatted entries
- Automatic rotation at 10MB
- Configurable retention (30 days)
- Log cleanup

**Usage:**
```javascript
const { Logger } = require('./src/lib');
const logger = new Logger({ level: 'info' });
logger.info('Backup started', { source: '/path' });
logger.error('Upload failed', { error: err.message });
```

## Data Flow

### Backup Operation Flow

```
1. User Action
   ├─ GUI: Click "Backup Now"
   └─ CLI: node client.js backup

2. Client Initialization
   ├─ Load config.json
   ├─ Initialize logger
   └─ Connect to server

3. File Scanning
   ├─ Walk directory tree
   ├─ Apply exclusions
   ├─ Calculate file hashes
   └─ Build manifest

4. Server Handshake
   ├─ POST /init-backup
   ├─ Send manifest
   └─ Get version ID

5. File Upload
   ├─ For each file:
   │   ├─ Check if exists (hash)
   │   ├─ Upload if needed
   │   └─ Track progress
   └─ Parallel uploads (3 default)

6. Commit Version
   ├─ POST /commit-version
   ├─ Finalize metadata
   └─ Log completion

7. Result
   ├─ Show summary
   ├─ Write logs
   └─ Update GUI
```

### Configuration Flow

```
1. Storage
   └─ config.json (root directory)

2. Loading
   ├─ ConfigManager reads file
   ├─ Validates structure
   └─ Provides defaults

3. Access
   ├─ Server reads config
   ├─ Client reads config
   └─ GUI reads config

4. Modification
   ├─ GUI: Update via form
   ├─ CLI: Edit config.json
   └─ API: POST /api/config

5. Persistence
   └─ ConfigManager saves to file
```

### Logging Flow

```
1. Event Occurs
   └─ Backup start, file upload, error, etc.

2. Logger Called
   ├─ info() / warn() / error() / debug()
   └─ Console output + file write

3. File Writing
   ├─ Append to logs/[type]-[date].log
   ├─ JSON formatted entry
   └─ Timestamp added

4. Log Rotation
   ├─ Check file size
   ├─ Rotate if > 10MB
   └─ Clean old logs > 30 days

5. Log Reading
   ├─ GUI: /logs page
   ├─ API: /api/logs/:type
   └─ CLI: node client.js logs
```

## Security Model

### Authentication

- **Server:** Session-based auth with bcrypt passwords
- **GUI:** No auth (localhost only)
- **Client:** No auth (trusted local process)

### File Security

- **Upload:** SHA-256 hash verification
- **Storage:** Organized by client/timestamp/version
- **Access:** Session-validated routes
- **Download:** Path validation, no traversal

### Network Security

- **Localhost:** All services on localhost by default
- **HTTPS:** Can be configured via reverse proxy
- **CORS:** Disabled (same-origin only)

## Configuration Structure

```json
{
  "server": {
    "url": "http://localhost:8080",
    "timeout": 60000,
    "retryAttempts": 3,
    "retryDelay": 5000
  },
  "backup": {
    "sources": ["/path/to/backup"],
    "exclusions": ["**/node_modules/**"],
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

## Directory Structure Rationale

### Why `src/` Directory?

- **Separation:** Source code separate from config/data
- **Organization:** Clear module boundaries
- **Scalability:** Easy to add new components
- **Standards:** Industry best practice

### Why `scripts/` Directory?

- **Convenience:** All launchers in one place
- **Cross-platform:** Batch + shell scripts together
- **Discovery:** Easy to find startup options
- **Maintenance:** Centralized updates

### Why Keep Root Files?

- **Backward Compatibility:** Old scripts still work
- **Entry Points:** Clear main files (server.js, client.js)
- **Configuration:** config.json at expected location
- **Simplicity:** Direct access for common operations

## Extensibility

### Adding New Features

1. **New Server Route:**
   - Add to `routes/` directory
   - Mount in `server.js`
   - Add view if needed

2. **New GUI Page:**
   - Create `views-gui/newpage.ejs`
   - Add route in `src/servers/gui-server.js`
   - Update navigation

3. **New Utility:**
   - Create `src/lib/new-utility.js`
   - Export in `src/index.js`
   - Use across components

4. **New CLI Command:**
   - Add to `client.js` command parser
   - Implement functionality
   - Update help text

### Integration Points

- **ConfigManager:** Used by all components
- **Logger:** Available everywhere
- **Express Routes:** Modular and mountable
- **Client API:** Callable from GUI

## Performance Considerations

### Parallel Operations

- **Uploads:** 3 parallel by default (configurable)
- **File Scanning:** Async with klaw
- **Hash Calculation:** Streamed (low memory)

### Memory Management

- **Streaming:** Files read as streams
- **Chunks:** Large files sent in 5MB chunks
- **Garbage Collection:** Proper cleanup after operations

### Disk I/O

- **Buffered Writes:** Logs appended efficiently
- **Rotation:** Automatic cleanup prevents disk fill
- **Deduplication:** Files stored once (hash-based)

## Monitoring

### Health Checks

```bash
# Server health
curl http://localhost:8080/api/stats

# GUI health
curl http://localhost:3000/api/status

# Client status
node client.js status
```

### Logs

```bash
# View backup logs
tail -f logs/backup-$(date +%Y-%m-%d).log

# View errors
tail -f logs/error-$(date +%Y-%m-%d).log

# View history
tail -f logs/history-$(date +%Y-%m-d).log
```

### Metrics

- Backup success rate
- Upload speed
- File count
- Error frequency
- Storage usage

## Deployment

### Development

```bash
npm run server    # Terminal 1
npm run gui       # Terminal 2
```

### Production

```bash
# Using PM2
pm2 start server.js --name backup-server
pm2 start src/servers/gui-server.js --name backup-gui

# Using systemd (Linux)
# Create service files in /etc/systemd/system/

# Using Windows Services
# Use node-windows or NSSM
```

### Docker (Future)

```dockerfile
FROM node:16
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 8080 3000
CMD ["npm", "run", "all"]
```

## Testing Strategy

### Unit Tests (Future)

```javascript
// test/lib/config-manager.test.js
const ConfigManager = require('../src/lib/config-manager');

test('loads default config', () => {
  const config = new ConfigManager();
  expect(config.get('server.url')).toBeDefined();
});
```

### Integration Tests

```bash
# Start servers
npm run server &
npm run gui &

# Test endpoints
curl http://localhost:8080/api/stats
curl http://localhost:3000/api/status

# Run backup
node client.js backup /test/path
```

## Conclusion

The architecture provides:

✅ **Modularity** - Clear component separation  
✅ **Scalability** - Easy to extend  
✅ **Maintainability** - Organized structure  
✅ **Reliability** - Error handling and logging  
✅ **Usability** - Multiple interfaces (GUI, CLI, Admin)  
✅ **Performance** - Parallel operations and streaming  
✅ **Security** - Authentication and validation  

---

**Version:** 2.0.0  
**Last Updated:** December 2025
