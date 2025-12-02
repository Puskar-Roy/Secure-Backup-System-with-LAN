# Windows Autostart Setup Guide

This guide will help you set up the backup server to start automatically when Windows boots.

## Method 1: Startup Folder (Easiest)

1. **Press `Win + R`** to open Run dialog
2. **Type:** `shell:startup` and press Enter
3. **Create a shortcut** to `start-server.bat` in the startup folder:
   - Right-click in the startup folder
   - Select "New" → "Shortcut"
   - Browse to: `start-server.bat` in your project folder
   - Name it: "Backup Server"

### Run Hidden (No Console Window):
Instead of creating a shortcut to `start-server.bat`, create a shortcut to:
```
wscript.exe "C:\Path\To\Your\Project\start-server-hidden.vbs" "C:\Path\To\Your\Project\start-server.bat"
```

---

## Method 2: Task Scheduler (Advanced - Runs even without login)

1. **Open Task Scheduler:**
   - Press `Win + R`
   - Type: `taskschd.msc`
   - Press Enter

2. **Create New Task:**
   - Click "Create Task" (not "Create Basic Task")
   - Name: `Backup Server`
   - Description: `Starts the backup server on system startup`
   - Check "Run with highest privileges"
   - Check "Run whether user is logged on or not"

3. **Triggers Tab:**
   - Click "New..."
   - Begin the task: `At startup`
   - Click "OK"

4. **Actions Tab:**
   - Click "New..."
   - Action: `Start a program`
   - Program/script: `node.exe` (or full path like `C:\Program Files\nodejs\node.exe`)
   - Add arguments: `server.js 8080`
   - Start in: `C:\Path\To\Your\Project\Testing-Backup` (your project folder)
   - Click "OK"

5. **Conditions Tab:**
   - Uncheck "Start the task only if the computer is on AC power"

6. **Settings Tab:**
   - Check "Allow task to be run on demand"
   - Check "If the task fails, restart every: 1 minute"
   - Click "OK"

---

## Method 3: Windows Service (Most Reliable)

### Using `node-windows` package:

1. **Install node-windows:**
   ```bash
   pnpm add node-windows
   ```

2. **Create `install-service.js`:**
   ```javascript
   const Service = require('node-windows').Service;
   const path = require('path');

   const svc = new Service({
     name: 'Backup Server',
     description: 'Network Backup Server',
     script: path.join(__dirname, 'server.js'),
     nodeOptions: ['--harmony', '--max_old_space_size=4096']
   });

   svc.on('install', () => {
     console.log('Service installed!');
     svc.start();
   });

   svc.install();
   ```

3. **Run as Administrator:**
   ```bash
   node install-service.js
   ```

---

## Verify Server is Running

After setup, check if the server is running:

1. **Open browser:** `http://localhost:8080`
2. **Login with:**
   - Username: `admin`
   - Password: `www.puskarroy.in74495123`

---

## Stopping the Server

### If using Startup Folder:
- Open Task Manager (`Ctrl + Shift + Esc`)
- Find "Node.js: Server..." process
- Click "End task"

### If using Task Scheduler:
- Open Task Scheduler
- Find "Backup Server" task
- Right-click → "End"

### If using Windows Service:
```bash
net stop "Backup Server"
```

---

## Troubleshooting

### Server doesn't start:
1. Check Node.js is installed: `node --version`
2. Check the project path is correct
3. Check port 8080 is not in use
4. Check Event Viewer for errors: `eventvwr.msc`

### Can't access from network:
1. Check Windows Firewall
2. Add firewall rule for port 8080:
   ```
   netsh advfirewall firewall add rule name="Backup Server" dir=in action=allow protocol=TCP localport=8080
   ```

---

## Security Notes

- Change the default password after first login
- Consider setting up HTTPS if accessing over untrusted networks
- Restrict firewall access to your local network only
