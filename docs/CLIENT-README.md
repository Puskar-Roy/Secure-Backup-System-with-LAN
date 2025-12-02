# Professional Backup Client

A robust, enterprise-grade backup client with comprehensive error handling, scheduling, and monitoring capabilities.

## Features

### 🔒 Robust Error Handling
- Graceful handling of file access issues (permissions, not found, corrupted files)
- Automatic retry logic for temporary failures
- Continues backup process even when individual files fail
- Detailed error logging for troubleshooting

### ⚙️ Configuration Management
- Persistent JSON-based configuration
- Multiple backup source paths
- Flexible exclusion patterns
- Server connection settings
- Retention policies

### ⏰ Automated Scheduling
- Support for multiple backup times per day
- Background daemon mode
- Runs independently of GUI
- Configurable backup windows

### 🎮 Manual Controls
- Immediate "Backup Now" command
- Real-time progress monitoring
- Backup status display
- Historical log viewing

### 📊 Comprehensive Logging
- Separate logs for errors, history, and general operations
- Structured JSON log format
- Configurable log levels
- Automatic log rotation

## Installation

```bash
# Install dependencies
npm install

# Create default configuration
node client.js setup
```

## Configuration

Edit `config.json` to configure your backup settings:

### Server Configuration
```json
"server": {
  "url": "http://localhost:8080",
  "timeout": 60000,
  "retryAttempts": 3,
  "retryDelay": 5000
}
```

### Backup Sources
```json
"backup": {
  "sources": [
    "/home/user/documents",
    "/home/user/pictures"
  ],
  "exclusions": [
    "**/node_modules/**",
    "**/.git/**",
    "**/temp/**"
  ],
  "parallelUploads": 3
}
```

### Schedule Configuration
```json
"schedule": {
  "enabled": true,
  "times": ["02:00", "14:00", "22:00"],
  "timezone": "local"
}
```

### Retention Policies
```json
"retention": {
  "keepDays": 30,
  "keepWeeks": 12,
  "keepMonths": 12
}
```

## Usage

### Run Immediate Backup
```bash
# Backup configured sources
node client.js backup

# Backup specific path
node client.js backup /path/to/folder
```

### Run as Daemon (Background Service)
```bash
# Start scheduler with configured backup times
node client.js daemon
```

### Check Status
```bash
# View configuration and status
node client.js status
```

### View Logs
```bash
# View backup logs
node client.js logs

# View error logs
node client.js logs error

# View backup history
node client.js logs history
```

### View Configuration
```bash
# Display current config.json
node client.js config
```

### Setup Wizard
```bash
# Create default configuration
node client.js setup
```

## Error Handling

The client handles various error scenarios gracefully:

### File Access Errors
- **Permission Denied**: Skips file and continues
- **File Not Found**: Logs warning and continues
- **Corrupted Files**: Logs error and continues

### Network Errors
- **Connection Timeout**: Retries with exponential backoff
- **Upload Failure**: Automatic retry (configurable attempts)
- **Server Unavailable**: Logs error and exits gracefully

### File System Errors
- **Path Not Accessible**: Skips and logs
- **Read Errors**: Retries up to 3 times
- **Hash Calculation Failures**: Skips file and logs

## Logging

Logs are stored in the `logs/` directory:

### Log Types
- `backup-YYYY-MM-DD.log` - General backup operations
- `error-YYYY-MM-DD.log` - Error events only
- `history-YYYY-MM-DD.log` - Backup completion history

### Log Format
```json
{
  "timestamp": "2025-12-03T10:30:45.123Z",
  "level": "info",
  "message": "Backup completed",
  "data": {
    "files": 1234,
    "size": "5.2 GB",
    "duration": "15m 30s"
  }
}
```

### Log Levels
- `debug` - Detailed debugging information
- `info` - General informational messages
- `warn` - Warning messages (non-critical issues)
- `error` - Error messages (critical issues)

## Scheduled Backups

### Enable Scheduling
1. Edit `config.json`:
```json
"schedule": {
  "enabled": true,
  "times": ["02:00", "14:00", "22:00"]
}
```

2. Start daemon:
```bash
node client.js daemon
```

### Multiple Backup Times
Configure multiple backup windows per day:
```json
"times": [
  "02:00",  // 2:00 AM
  "08:00",  // 8:00 AM
  "14:00",  // 2:00 PM
  "20:00"   // 8:00 PM
]
```

### Run as System Service

#### Linux (systemd)
Create `/etc/systemd/system/backup-client.service`:
```ini
[Unit]
Description=Backup Client Daemon
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backup-client
ExecStart=/usr/bin/node client.js daemon
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable backup-client
sudo systemctl start backup-client
sudo systemctl status backup-client
```

#### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to "At startup"
4. Action: Start a program
5. Program: `node.exe`
6. Arguments: `client.js daemon`
7. Start in: `C:\path\to\backup-client`

## Exclusion Patterns

Use glob patterns to exclude files/folders:

### Examples
```json
"exclusions": [
  "**/node_modules/**",      // All node_modules folders
  "**/.git/**",              // All .git folders
  "**/temp/**",              // All temp folders
  "**/*.tmp",                // All .tmp files
  "**/.DS_Store",            // macOS metadata
  "**/Thumbs.db",            // Windows thumbnails
  "**/.cache/**",            // Cache folders
  "**/*.log"                 // Log files
]
```

### Pattern Syntax
- `**` - Matches any directory depth
- `*` - Matches any characters except `/`
- `*.ext` - Matches files with extension

## Monitoring and Progress

### Real-time Progress
When running backup manually, you'll see:
```
📦 Backup started: /home/user/documents
🔍 Scanning: 1234/5000 files
✅ Uploaded: photo.jpg
✅ Uploaded: document.pdf
...
✨ Backup completed successfully!
📊 Stats:
   - Files: 500/1234
   - Size: 2.5 GB
   - Skipped: 100
   - Errors: 2
   - Duration: 5m 30s
```

### Backup Statistics
Each backup tracks:
- Total files scanned
- Files uploaded (new/changed)
- Files skipped (excluded/unchanged)
- Errors encountered
- Total data transferred
- Duration

## Troubleshooting

### Issue: Backup fails to start
**Solution**: Check `config.json` syntax and server URL

### Issue: Files not backing up
**Solution**: Check exclusion patterns and file permissions

### Issue: Server connection timeout
**Solution**: Increase `server.timeout` in config.json

### Issue: High memory usage
**Solution**: Reduce `backup.parallelUploads` value

### Issue: Scheduler not working
**Solution**: Verify `schedule.enabled` is `true` and daemon is running

## Advanced Usage

### Environment Variables
Override config values:
```bash
export BACKUP_SERVER_URL=http://192.168.1.100:8080
export BACKUP_PARALLEL_UPLOADS=5
node client.js backup
```

### Programmatic Usage
```javascript
const { BackupManager, ConfigManager, Logger } = require('./client.js');

const config = new ConfigManager();
const logger = new Logger(config);
const manager = new BackupManager(config, logger);

manager.on('completed', (result) => {
  console.log('Backup done:', result);
});

await manager.runBackup('/path/to/backup');
```

## Performance Tips

1. **Parallel Uploads**: Adjust `backup.parallelUploads` based on network speed
   - Slow network: 1-2
   - Fast network: 5-10

2. **Exclusions**: Add common large folders to exclusions:
   - Development: `node_modules`, `.git`, `dist`, `build`
   - System: `temp`, `cache`, `tmp`

3. **Schedule**: Run backups during off-peak hours (2 AM - 4 AM)

4. **Incremental**: The client automatically does incremental backups (only changed files)

## Security

### Best Practices
- Use HTTPS for server URL in production
- Store config.json with restricted permissions (chmod 600)
- Regularly rotate logs
- Monitor error logs for suspicious activity

### File Permissions
```bash
chmod 600 config.json
chmod 700 logs/
```

## Support

For issues or questions:
1. Check error logs: `node client.js logs error`
2. Verify configuration: `node client.js config`
3. Test connectivity: `curl <server-url>/api/config`

## Version History

### v2.0.0 (2025-12-03)
- Complete rewrite with professional architecture
- Added robust error handling
- Implemented configuration management
- Added scheduling system
- Created comprehensive logging
- Added CLI interface
- Support for multiple backup times
- Background daemon mode

### v1.0.0 (Initial)
- Basic backup functionality
- Command-line arguments only
- No error recovery
