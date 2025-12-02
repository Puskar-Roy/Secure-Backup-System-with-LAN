# Quick Start Guide - Professional Backup Client

## 🚀 Get Started in 3 Steps

### Step 1: Configure Your Backup

Edit `config.json` and set your backup sources:

```json
{
  "server": {
    "url": "http://localhost:8080"
  },
  "backup": {
    "sources": [
      "/home/user/documents",
      "/home/user/pictures",
      "/home/user/projects"
    ]
  }
}
```

### Step 2: Test Your First Backup

Run an immediate backup to test:

```bash
node client.js backup /path/to/folder
```

You'll see real-time progress:
```
🚀 Starting immediate backup of: /path/to/folder
📦 Backup started
🔍 Scanning: 1234/5000 files
✅ Uploaded: photo.jpg
✅ Uploaded: document.pdf
✨ Backup completed successfully!
```

### Step 3: Enable Automatic Backups

Enable scheduling in `config.json`:

```json
{
  "schedule": {
    "enabled": true,
    "times": ["02:00", "14:00", "22:00"]
  }
}
```

Start the daemon:

```bash
node client.js daemon
```

## 📋 Common Commands

```bash
# Run backup now
node client.js backup

# Start scheduled backups (daemon)
node client.js daemon

# Check status
node client.js status

# View logs
node client.js logs

# View errors
node client.js logs error

# Show configuration
node client.js config
```

## 🎯 Example Scenarios

### Scenario 1: Daily Automatic Backups

**Goal**: Backup documents folder every day at 2 AM

**config.json**:
```json
{
  "server": { "url": "http://backup-server:8080" },
  "backup": { "sources": ["/home/user/documents"] },
  "schedule": {
    "enabled": true,
    "times": ["02:00"]
  }
}
```

**Command**:
```bash
node client.js daemon
```

### Scenario 2: Multiple Daily Backups

**Goal**: Backup critical data 3 times per day

**config.json**:
```json
{
  "backup": { 
    "sources": [
      "/home/user/important",
      "/var/www/html"
    ]
  },
  "schedule": {
    "enabled": true,
    "times": ["02:00", "12:00", "20:00"]
  }
}
```

### Scenario 3: Exclude Large Files

**Goal**: Backup code but skip node_modules and build artifacts

**config.json**:
```json
{
  "backup": {
    "sources": ["/home/user/projects"],
    "exclusions": [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.git/**",
      "**/*.log"
    ]
  }
}
```

### Scenario 4: High-Speed Network Backup

**Goal**: Optimize for fast network with parallel uploads

**config.json**:
```json
{
  "server": {
    "url": "http://backup-server:8080",
    "timeout": 120000
  },
  "backup": {
    "parallelUploads": 10,
    "sources": ["/data/large-files"]
  }
}
```

## 🔧 Troubleshooting Quick Fixes

### Problem: "No backup source specified"
**Fix**: Add sources to config.json or specify path:
```bash
node client.js backup /path/to/folder
```

### Problem: "Connection refused"
**Fix**: Check server is running and URL is correct:
```bash
curl http://localhost:8080/api/config
```

### Problem: Files not being backed up
**Fix**: Check exclusion patterns in config.json

### Problem: Slow backup
**Fix**: Increase parallel uploads:
```json
"backup": { "parallelUploads": 5 }
```

## 📊 Understanding Logs

### Backup Log (logs/backup-YYYY-MM-DD.log)
General operations and progress
```bash
node client.js logs
```

### Error Log (logs/error-YYYY-MM-DD.log)
Only errors and failures
```bash
node client.js logs error
```

### History Log (logs/history-YYYY-MM-DD.log)
Backup completion records
```bash
node client.js logs history
```

## 🎮 Interactive Demo

Try these commands in order:

```bash
# 1. Check current status
node client.js status

# 2. View configuration
node client.js config

# 3. Run a test backup
node client.js backup ./test-folder

# 4. Check what happened
node client.js logs

# 5. View backup history
node client.js logs history
```

## 🔐 Security Recommendations

1. **Config File Permissions**
```bash
chmod 600 config.json
```

2. **Use HTTPS in Production**
```json
"server": { "url": "https://backup-server.com:8443" }
```

3. **Restrict Log Access**
```bash
chmod 700 logs/
```

## 🚀 Running as System Service

### Linux

Create systemd service:
```bash
sudo nano /etc/systemd/system/backup-client.service
```

Paste:
```ini
[Unit]
Description=Backup Client
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/backup-client
ExecStart=/usr/bin/node client.js daemon
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable backup-client
sudo systemctl start backup-client
```

### Windows

Use Task Scheduler or NSSM (Non-Sucking Service Manager)

## 💡 Pro Tips

1. **Schedule During Off-Hours**: Set backups at 2-4 AM for minimal disruption

2. **Exclude System Files**: Add common system folders to exclusions:
   - Windows: `**/Windows/**`, `**/ProgramData/**`
   - Linux: `**/proc/**`, `**/sys/**`, `**/dev/**`

3. **Monitor Logs Daily**: Quick check for errors:
   ```bash
   node client.js logs error | tail -20
   ```

4. **Test Before Scheduling**: Always test manual backup before enabling daemon

5. **Multiple Sources**: Separate critical and non-critical data:
   ```json
   "sources": [
     "/critical/data",
     "/important/files"
   ]
   ```

## 📈 Performance Benchmarks

Typical performance (varies by hardware/network):

- **Small Files (< 1MB)**: ~100-500 files/second
- **Large Files (> 100MB)**: Network speed dependent
- **Parallel Uploads**: 3-5 optimal for most setups
- **Scanning**: ~1000 files/second on SSD

## 🎓 Next Steps

1. Read full documentation: `CLIENT-README.md`
2. Configure your backup sources
3. Test with non-critical data first
4. Monitor logs for first few backups
5. Enable scheduling when confident
6. Set up system service for automatic startup

## 📞 Getting Help

Check these in order:
1. Error logs: `node client.js logs error`
2. Status: `node client.js status`
3. Configuration: `node client.js config`
4. Full docs: `CLIENT-README.md`

---

**Ready to backup?** Start with:
```bash
node client.js backup /path/to/your/data
```
