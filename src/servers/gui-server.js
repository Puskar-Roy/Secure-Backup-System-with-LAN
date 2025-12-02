/**
 * GUI Server
 * User-friendly web interface for backup management
 * Port: 3000
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const ConfigManager = require('../lib/config-manager');
const Logger = require('../lib/logger');

class GUIServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.config = new ConfigManager();
    this.logger = new Logger({ level: 'info' });
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
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
    this.app.get('/api/test-connection', this.testConnection.bind(this));
    this.app.get('/api/logs/:type', this.getAPILogs.bind(this));
  }

  // View handlers
  getDashboard(req, res) {
    const status = this.getBackupStatus();
    const config = this.config.getAll();
    res.render('dashboard', { status, config });
  }

  getSettings(req, res) {
    const config = this.config.getAll();
    res.render('settings', { config });
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
    const newConfig = req.body;
    const success = this.config.update(newConfig);
    res.json({ 
      success, 
      message: success ? 'Configuration saved' : 'Failed to save configuration' 
    });
  }

  startBackup(req, res) {
    const { source } = req.body;
    
    if (!source) {
      return res.status(400).json({ 
        success: false, 
        message: 'No backup source specified' 
      });
    }

    // Start backup process
    const clientPath = path.join(__dirname, '../../client.js');
    const backup = spawn('node', [clientPath, 'backup', source], {
      cwd: path.join(__dirname, '../..')
    });

    let output = '';
    let errorOutput = '';

    backup.stdout.on('data', (data) => {
      output += data.toString();
    });

    backup.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    backup.on('close', (code) => {
      if (code === 0) {
        this.logger.info('Backup completed via GUI', { source });
      } else {
        this.logger.error('Backup failed via GUI', { source, code, error: errorOutput });
      }
    });

    // Send initial response
    res.json({ 
      success: true, 
      message: 'Backup started',
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
      recentBackups: logs
    };
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`\n🎨 Backup Client GUI running at: http://localhost:${this.port}`);
      console.log(`📊 Dashboard: http://localhost:${this.port}`);
      console.log(`⚙️  Settings: http://localhost:${this.port}/settings`);
      console.log(`❓ Help: http://localhost:${this.port}/help`);
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
