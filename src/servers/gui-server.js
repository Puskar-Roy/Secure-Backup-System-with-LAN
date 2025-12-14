/**
 * GUI Server
 * User-friendly web interface for backup management
 * Port: 3000
 * Uses client.js for all backup operations
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const ConfigManager = require('../lib/config-manager');
const Logger = require('../lib/logger');

class GUIServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.configPath = path.join(__dirname, '../../config.json');
    this.config = new ConfigManager(this.configPath);
    this.logger = new Logger({ level: 'info' });
    this.activeBackups = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      next();
    });
    
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, '../../public')));
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, '../../views-gui'));
  }

  setupRoutes() {
    // View routes
    this.app.get('/', this.getDashboard.bind(this));
    this.app.get('/settings', this.getSettings.bind(this));
    this.app.get('/help', this.getHelp.bind(this));
    this.app.get('/setup-windows', this.getWindowsSetup.bind(this));
    this.app.get('/logs', this.getLogs.bind(this));

    // API routes
    this.app.get('/api/status', this.getStatus.bind(this));
    this.app.get('/api/config', this.getConfig.bind(this));
    this.app.post('/api/config', this.updateConfig.bind(this));
    this.app.post('/api/backup', this.startBackup.bind(this));
    this.app.get('/api/backup-status/:pid', this.getBackupStatus.bind(this));
    this.app.get('/api/test-connection', this.testConnection.bind(this));
    this.app.get('/api/logs/:type', this.getAPILogs.bind(this));
    this.app.get('/api/browse-folders', this.browseFolders.bind(this));

    // Store active backup processes
    this.activeBackups = new Map();
  }

  // View handlers
  getDashboard(req, res) {
    const status = this.getBackupStatus();
    const config = this.config.getAll();
    res.render('dashboard', { status, config });
  }

  getSettings(req, res) {
    const config = this.config.getAll();
    const homeDir = require('os').homedir();
    res.render('settings', { config, homeDir });
  }

  getHelp(req, res) {
    res.render('help');
  }

  getWindowsSetup(req, res) {
    res.render('setup-windows');
  }

  getLogs(req, res) {
    const type = req.query.type || 'backup';
    const logs = this.logger.readLogs(type, 100);
    res.render('logs', { logs, type });
  }

  // API handlers
  getStatus(req, res) {
    const status = this.getBackupStatus();
    res.json(status);
  }

  getConfig(req, res) {
    const config = this.config.getAll();
    res.json(config);
  }

  updateConfig(req, res) {
    try {
      const newConfig = req.body;
      
      // Validate config structure
      if (!newConfig.server || !newConfig.backup) {
        return res.status(400).json({
          success: false,
          message: 'Invalid configuration structure'
        });
      }

      // Write directly to config.json
      fs.writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2), 'utf8');
      
      // Reload config
      this.config = new ConfigManager(this.configPath);
      
      this.logger.info('Configuration updated', { 
        sources: newConfig.backup.sources?.length || 0,
        scheduleEnabled: newConfig.schedule?.enabled 
      });

      res.json({ 
        success: true, 
        message: 'Configuration saved successfully' 
      });
    } catch (err) {
      this.logger.error('Failed to save configuration', { error: err.message });
      res.status(500).json({
        success: false,
        message: `Failed to save configuration: ${err.message}`
      });
    }
  }

  startBackup(req, res) {
    const { source } = req.body;
    
    if (!source) {
      return res.status(400).json({ 
        success: false, 
        message: 'No backup source specified' 
      });
    }

    // Validate source exists and resolve to absolute path
    const fs = require('fs');
    const resolvedSource = path.resolve(source);
    
    if (!fs.existsSync(resolvedSource)) {
      return res.status(400).json({
        success: false,
        message: `Source path does not exist: ${source}`
      });
    }

    // Check if it's a directory
    try {
      const stats = fs.statSync(resolvedSource);
      if (!stats.isDirectory()) {
        return res.status(400).json({
          success: false,
          message: `Source must be a directory: ${source}`
        });
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: `Cannot access source: ${err.message}`
      });
    }

    // Check if backup is already running for this source
    for (const [pid, info] of this.activeBackups.entries()) {
      if (info.source === source && info.status === 'running') {
        return res.json({
          success: false,
          message: 'Backup already running for this source',
          pid: pid
        });
      }
    }

    // Use client.js for backup
    const clientPath = path.join(__dirname, '../../client.js');
    
    if (!fs.existsSync(clientPath)) {
      return res.status(500).json({
        success: false,
        message: 'client.js not found'
      });
    }

    this.logger.info('Starting backup via GUI', { source: resolvedSource, clientPath });
    
    // Run client.js backup command with absolute path
    const backup = spawn('node', [clientPath, 'backup', resolvedSource], {
      cwd: path.join(__dirname, '../..'),
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const pid = backup.pid;
    const startTime = Date.now();
    
    // Store backup info
    this.activeBackups.set(pid, {
      source: resolvedSource,
      status: 'running',
      startTime,
      output: '',
      error: '',
      progress: 0
    });

    let output = '';
    let errorOutput = '';

    backup.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Update stored output
      const backupInfo = this.activeBackups.get(pid);
      if (backupInfo) {
        backupInfo.output += text;
        
        // Extract progress from output
        if (text.includes('Backup started')) {
          backupInfo.progress = 10;
        } else if (text.includes('Scanning files')) {
          backupInfo.progress = 20;
        } else if (text.includes('Found') && text.includes('files')) {
          backupInfo.progress = 30;
        } else if (text.includes('Server ready')) {
          backupInfo.progress = 40;
        } else if (text.includes('Uploading') || text.includes('Uploaded')) {
          backupInfo.progress = Math.min(90, backupInfo.progress + 5);
        } else if (text.includes('Committing backup')) {
          backupInfo.progress = 95;
        } else if (text.includes('Backup completed')) {
          backupInfo.progress = 100;
        }
      }
    });

    backup.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      
      const backupInfo = this.activeBackups.get(pid);
      if (backupInfo) {
        backupInfo.error += text;
      }
    });

    backup.on('error', (err) => {
      this.logger.error('Failed to start backup process', { source, error: err.message });
      const backupInfo = this.activeBackups.get(pid);
      if (backupInfo) {
        backupInfo.status = 'failed';
        backupInfo.error = err.message;
      }
    });

    backup.on('close', (code) => {
      const duration = Date.now() - startTime;
      const backupInfo = this.activeBackups.get(pid);
      
      console.log(`[Backup ${pid}] Process exited with code ${code}`);
      
      if (code === 0) {
        this.logger.info('Backup completed via GUI', { source, duration });
        if (backupInfo) {
          backupInfo.status = 'completed';
          backupInfo.progress = 100;
          backupInfo.duration = duration;
          console.log(`[Backup ${pid}] Status updated to completed`);
        }
      } else {
        this.logger.error('Backup failed via GUI', { source, code, error: errorOutput });
        if (backupInfo) {
          backupInfo.status = 'failed';
          backupInfo.exitCode = code;
          backupInfo.duration = duration;
          console.log(`[Backup ${pid}] Status updated to failed`);
        }
      }
      
      // Clean up after 5 minutes
      setTimeout(() => {
        this.activeBackups.delete(pid);
      }, 5 * 60 * 1000);
    });

    // Send immediate response
    res.json({ 
      success: true, 
      message: `Backup started for ${resolvedSource}`,
      pid: pid,
      source: resolvedSource,
      status: 'running'
    });
  }

  async testConnection(req, res) {
    const serverUrl = this.config.get('server.url');
    
    if (!serverUrl) {
      return res.json({ 
        success: false, 
        message: 'Server URL not configured' 
      });
    }

    try {
      const axios = require('axios');
      await axios.get(`${serverUrl}/api/config`, { timeout: 5000 });
      res.json({ success: true, message: 'Connection successful' });
    } catch (err) {
      res.json({ 
        success: false, 
        message: `Connection failed: ${err.message}` 
      });
    }
  }

  getAPILogs(req, res) {
    const type = req.params.type;
    const logs = this.logger.readLogs(type, 100);
    res.json({ logs });
  }

  getBackupStatus(req, res) {
    const pid = parseInt(req.params.pid);
    const backupInfo = this.activeBackups.get(pid);
    
    console.log(`[Status Check] PID ${pid}:`, backupInfo ? backupInfo.status : 'not found');
    
    if (!backupInfo) {
      return res.json({
        success: false,
        message: 'Backup process not found',
        status: 'unknown'
      });
    }
    
    res.json({
      success: true,
      ...backupInfo,
      duration: Date.now() - backupInfo.startTime
    });
  }

  browseFolders(req, res) {
    const requestedPath = req.query.path || require('os').homedir();
    
    try {
      // Security: only allow browsing real paths
      const resolvedPath = path.resolve(requestedPath);
      
      if (!fs.existsSync(resolvedPath)) {
        return res.status(404).json({ 
          success: false, 
          message: 'Path does not exist' 
        });
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Path is not a directory' 
        });
      }

      const items = fs.readdirSync(resolvedPath)
        .map(name => {
          const itemPath = path.join(resolvedPath, name);
          try {
            const itemStats = fs.statSync(itemPath);
            return {
              name,
              path: itemPath,
              isDirectory: itemStats.isDirectory(),
              size: itemStats.size,
              modified: itemStats.mtime
            };
          } catch (err) {
            return null;
          }
        })
        .filter(item => item !== null && item.isDirectory)
        .sort((a, b) => a.name.localeCompare(b.name));

      const parent = resolvedPath !== path.parse(resolvedPath).root 
        ? path.dirname(resolvedPath) 
        : null;

      res.json({
        success: true,
        currentPath: resolvedPath,
        parent,
        items
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }

  // Helper methods
  getBackupStatus() {
    const config = this.config.getAll();
    const logs = this.logger.readLogs('history', 5);
    
    return {
      serverUrl: config?.server?.url || 'Not configured',
      sources: config?.backup?.sources || [],
      scheduleEnabled: config?.schedule?.enabled || false,
      scheduleTimes: config?.schedule?.times || [],
      lastBackup: logs.length > 0 ? logs[logs.length - 1] : null,
      recentBackups: logs,
      activeBackups: this.activeBackups ? this.activeBackups.size : 0
    };
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`\n🎨 Backup Client GUI running at: http://localhost:${this.port}`);
      console.log(`📊 Dashboard: http://localhost:${this.port}`);
      console.log(`⚙️  Settings: http://localhost:${this.port}/settings`);
      console.log(`📋 Logs: http://localhost:${this.port}/logs`);
      console.log(`❓ Help: http://localhost:${this.port}/help`);
      console.log(`\n✅ All features integrated with client.js`);
      console.log(`📁 Config file: ${this.configPath}`);
      console.log(`\nPress Ctrl+C to stop\n`);
    });
  }
}

// If run directly
if (require.main === module) {
  const server = new GUIServer();
  server.start();
}

module.exports = GUIServer;
