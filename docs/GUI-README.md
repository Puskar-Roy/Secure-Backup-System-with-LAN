# Backup Client GUI

A user-friendly graphical interface for managing your backups. Perfect for non-technical users!

## 🚀 Quick Start

### Start the GUI

```bash
node gui-server.js
```

Then open your web browser and go to: **http://localhost:3000**

### Windows Users - Double-Click to Start

We've included a convenient batch file:
1. Double-click `start-gui.bat`
2. The GUI will open automatically in your browser

## 📋 Features

### Dashboard
- **One-Click Backup**: Start a backup immediately with the "Backup Now" button
- **System Status**: See if your backups are configured and running correctly
- **Recent Activity**: View your last 5 backups
- **Quick Actions**: Test server connection and view logs

### Settings
- **Server Configuration**: Set your backup server URL
- **Backup Sources**: Add folders you want to backup
- **Schedule**: Enable automatic backups and choose times
- **Advanced Settings**: Adjust parallel uploads and retry attempts

### Help & Tutorials
- **Plain English Explanations**: Every feature explained in simple terms
- **Getting Started Guide**: Step-by-step setup instructions
- **FAQ**: Answers to common questions
- **Tips**: Best practices for reliable backups

### Windows Auto-Backup Setup
- **Detailed Tutorial**: Complete guide with screenshots
- **Two Methods**: Task Scheduler (recommended) or Startup Folder
- **Troubleshooting**: Solutions to common problems
- **Verification Steps**: Make sure everything is working

### Logs Viewer
- **General Logs**: See what the backup client is doing
- **Error Logs**: View any problems that occurred
- **History**: Track all completed backups

## 🎯 For Non-Technical Users

### What is this?

Think of this as a digital photocopier for your computer files. Just like you make photocopies of important documents and store them in a safe place, this program makes copies of your computer files and stores them safely on another computer (the backup server).

### Why do I need it?

If your computer breaks, gets stolen, or files get deleted by accident, you won't lose your important photos, documents, and other files. They'll be safely stored in the backup and you can get them back.

### How do I use it?

1. **First Time Setup** (5 minutes):
   - Open the GUI: http://localhost:3000
   - Click "Settings"
   - Click "Add Folder" and type the path to folders you want to backup
   - Click "Save Settings"

2. **Run Your First Backup**:
   - Go to "Dashboard"
   - Click "Backup Now"
   - Wait for it to finish (you'll see a green checkmark)

3. **Enable Automatic Backups**:
   - Go to "Settings"
   - Turn on "Enable Automatic Backups"
   - Choose times (like 2:00 AM when you're sleeping)
   - Click "Save Settings"

4. **Set Up Windows Auto-Start** (Optional but recommended):
   - Click "Setup Auto Backup on Windows" button
   - Follow the simple step-by-step instructions
   - This ensures backups run even if you forget!

### Is it working?

Check the Dashboard:
- ✅ Green checkmarks = Good!
- 📊 "Last Backup" shows a recent date = Good!
- 📋 Recent activity shows completed backups = Good!

If you see any red error messages, click the "Help" button for solutions.

## 🖥️ Pages Overview

### 1. Dashboard (Home)
**What you'll see:**
- Number of folders being backed up
- Server connection status
- Automatic backup status (enabled/disabled)
- Big buttons to backup your files
- List of recent backups

**What you can do:**
- Start a backup right now
- Test if the server is reachable
- See recent backup activity
- Go to other pages

### 2. Settings
**What you'll see:**
- Server connection settings
- List of folders being backed up
- Automatic backup schedule
- Advanced options (for technical users)

**What you can do:**
- Add or remove folders to backup
- Change backup times
- Enable/disable automatic backups
- Adjust performance settings

### 3. Logs
**What you'll see:**
- Timestamped list of events
- Three tabs: General, Errors, History

**What you can do:**
- Check if backups completed successfully
- View error messages
- See backup history

### 4. Help
**What you'll see:**
- Plain English explanations of all features
- Step-by-step getting started guide
- Frequently asked questions
- Helpful tips

**What you can do:**
- Learn how to use every feature
- Find answers to common questions
- Get troubleshooting help

### 5. Windows Setup Guide
**What you'll see:**
- Detailed instructions with numbered steps
- Two different methods to choose from
- Tips and warnings
- Troubleshooting section

**What you can do:**
- Follow along to set up automatic startup
- Learn about Task Scheduler
- Verify everything is working

## 🔧 Technical Details

### Requirements
- Node.js installed
- Backup client (`client.js`) configured
- Port 3000 available

### API Endpoints
- `GET /` - Dashboard
- `GET /settings` - Settings page
- `GET /help` - Help page
- `GET /setup-windows` - Windows setup guide
- `GET /logs?type=<backup|error|history>` - Logs viewer
- `GET /api/status` - Get system status
- `GET /api/config` - Get configuration
- `POST /api/config` - Update configuration
- `POST /api/backup` - Run backup
- `GET /api/test-connection` - Test server connection

### File Structure
```
views-gui/
  ├── dashboard.ejs      - Main dashboard
  ├── settings.ejs       - Settings configuration
  ├── help.ejs          - Help & documentation
  ├── setup-windows.ejs - Windows auto-start guide
  └── logs.ejs          - Log viewer
```

## 🎨 Design

- Professional slate color theme
- Responsive design (works on tablets too)
- Font Awesome icons throughout
- Consistent with admin panel design
- Accessible and easy to read

## 🚀 Starting the GUI

### Method 1: Command Line
```bash
node gui-server.js
```

### Method 2: Windows Batch File
```bash
# Just double-click:
start-gui.bat
```

### Method 3: Auto-start with Task Scheduler
Follow the Windows Setup Guide in the GUI for detailed instructions.

## 🔒 Security Notes

- GUI runs on localhost (127.0.0.1) only
- No authentication required (assumes trusted local environment)
- For remote access, consider adding authentication
- Config file contains sensitive information - protect it

## 💡 Tips

1. **First-time users**: Start with the Help page - it explains everything!

2. **Keep it simple**: Only backup folders with files you can't replace (photos, documents)

3. **Test first**: Run a manual backup before enabling automatic backups

4. **Check weekly**: Look at the Dashboard once a week to make sure backups are running

5. **Leave computer on**: For automatic backups to work, your computer needs to be on (sleep is OK)

## 🆘 Troubleshooting

### "Can't connect to http://localhost:3000"
**Solution**: Make sure the GUI server is running. Run `node gui-server.js` first.

### "Server connection test failed"
**Solution**: Check that the backup server is running and the URL in Settings is correct.

### "Backups not running automatically"
**Solution**: 
1. Check Settings - make sure "Enable Automatic Backups" is ON
2. Check that backup times are set
3. Make sure your computer is on at those times
4. Follow the Windows Setup Guide to enable auto-start

### "No folders to backup"
**Solution**: Go to Settings and add folders using the "Add Folder" button.

## 📖 For More Help

- Click the "Help" button in the GUI
- Check the logs for error messages
- Read CLIENT-README.md for technical details
- Read QUICK-START.md for command-line usage

## 🎓 Learning Path

1. **Start Here**: Open GUI → Read the Help page
2. **Next**: Configure Settings → Add folders
3. **Then**: Test Manual Backup
4. **Finally**: Enable Automatic Backups → Follow Windows Setup Guide

---

**Need help?** Click the "Help" button in the GUI for detailed explanations of every feature!
