// Enhanced Backup Client with Professional Architecture
// Usage: 
//   node client.js                     - Run with config.json
//   node client.js backup              - Backup now
//   node client.js daemon              - Run as background service
//   node client.js status              - Show backup status
//   node client.js logs                - View backup logs
//   node client.js config              - Show configuration

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const klaw = require("klaw");
const os = require("os");
const { EventEmitter } = require("events");

// ==================== Configuration Manager ====================
class ConfigManager {
  constructor(configPath = './config.json') {
    this.configPath = configPath;
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (err) {
      console.warn('Config file error, using defaults:', err.message);
    }
    
    return this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      server: {
        url: 'http://localhost:8080',
        timeout: 60000,
        retryAttempts: 3,
        retryDelay: 5000
      },
      backup: {
        sources: [],
        exclusions: [
          '**/node_modules/**',
          '**/.git/**',
          '**/temp/**',
          '**/tmp/**',
          '**/*.tmp',
          '**/.DS_Store',
          '**/Thumbs.db'
        ],
        parallelUploads: 3,
        chunkSize: 5242880 // 5MB
      },
      schedule: {
        enabled: false,
        times: ['02:00', '14:00', '22:00'], // Multiple backups per day
        timezone: 'local'
      },
      retention: {
        keepDays: 30,
        keepWeeks: 12,
        keepMonths: 12
      },
      logging: {
        level: 'info', // debug, info, warn, error
        maxLogSize: 10485760, // 10MB
        keepLogs: 30
      }
    };
  }

  saveConfig() {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (err) {
      console.error('Failed to save config:', err.message);
      return false;
    }
  }

  get(key) {
    const keys = key.split('.');
    let value = this.config;
    for (const k of keys) {
      value = value?.[k];
    }
    return value;
  }

  set(key, value) {
    const keys = key.split('.');
    let obj = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {};
      obj = obj[keys[i]];
    }
    obj[keys[keys.length - 1]] = value;
    this.saveConfig();
  }
}

// ==================== Logger ====================
class Logger {
  constructor(config) {
    this.config = config;
    this.logsDir = path.join(__dirname, 'logs');
    this.ensureLogsDir();
  }

  ensureLogsDir() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  getLogPath(type) {
    const date = new Date().toISOString().slice(0, 10);
    return path.join(this.logsDir, `${type}-${date}.log`);
  }

  write(type, level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    const logPath = this.getLogPath(type);

    try {
      fs.appendFileSync(logPath, logLine);
    } catch (err) {
      console.error('Failed to write log:', err.message);
    }
  }

  info(message, data) {
    console.log(`[INFO] ${message}`);
    this.write('backup', 'info', message, data);
  }

  warn(message, data) {
    console.warn(`[WARN] ${message}`);
    this.write('backup', 'warn', message, data);
  }

  error(message, data) {
    console.error(`[ERROR] ${message}`);
    this.write('error', 'error', message, data);
  }

  debug(message, data) {
    if (this.config.get('logging.level') === 'debug') {
      console.log(`[DEBUG] ${message}`);
      this.write('backup', 'debug', message, data);
    }
  }

  history(message, data) {
    this.write('history', 'info', message, data);
  }
}

// ==================== Backup Manager ====================
class BackupManager extends EventEmitter {
  constructor(config, logger) {
    super();
    this.config = config;
    this.logger = logger;
    this.clientId = os.hostname() + "_" + process.pid;
    this.isRunning = false;
    this.currentBackup = null;
    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      skippedFiles: 0,
      uploadedFiles: 0,
      errors: 0,
      totalBytes: 0,
      uploadedBytes: 0
    };
  }

  // Check if path should be excluded
  shouldExclude(relPath) {
    const exclusions = this.config.get('backup.exclusions') || [];
    for (const pattern of exclusions) {
      const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
      if (regex.test(relPath)) {
        return true;
      }
    }
    return false;
  }

  // Build manifest with error handling
  async buildManifest(root) {
    const files = [];
    const errors = [];
    
    return new Promise((resolve) => {
      klaw(root)
        .on('data', (item) => {
          try {
            if (!item.stats.isFile()) return;
            
            const rel = path.relative(root, item.path).split(path.sep).join('/');
            
            // Skip excluded paths
            if (this.shouldExclude(rel)) {
              this.logger.debug(`Excluded: ${rel}`);
              this.stats.skippedFiles++;
              return;
            }

            // Check file accessibility
            try {
              fs.accessSync(item.path, fs.constants.R_OK);
              files.push({
                fullpath: item.path,
                relpath: rel,
                size: item.stats.size,
                mtime: item.stats.mtimeMs,
              });
              this.stats.totalBytes += item.stats.size;
            } catch (accessErr) {
              this.logger.warn(`Cannot access file: ${rel}`, { error: accessErr.message });
              errors.push({ path: rel, error: 'Access denied' });
              this.stats.skippedFiles++;
            }
          } catch (err) {
            this.logger.error(`Error processing item: ${item.path}`, { error: err.message });
            errors.push({ path: item.path, error: err.message });
            this.stats.errors++;
          }
        })
        .on('end', async () => {
          this.logger.info(`Scan complete. Found ${files.length} files, skipped ${errors.length}`);
          
          // Compute hashes with error handling
          for (const f of files) {
            try {
              f.sha = await this.sha256OfFile(f.fullpath);
              this.stats.processedFiles++;
              this.emit('progress', {
                phase: 'scanning',
                current: this.stats.processedFiles,
                total: files.length
              });
            } catch (err) {
              this.logger.error(`Hash calculation failed: ${f.relpath}`, { error: err.message });
              errors.push({ path: f.relpath, error: 'Hash calculation failed' });
              this.stats.errors++;
            }
          }
          
          // Filter out files that failed hash calculation
          const validFiles = files.filter(f => f.sha);
          
          resolve({ files: validFiles, errors });
        })
        .on('error', (err) => {
          this.logger.error('Directory walk error', { error: err.message });
          resolve({ files, errors });
        });
    });
  }

  async sha256OfFile(file, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await new Promise((resolve, reject) => {
          const h = crypto.createHash('sha256');
          const s = fs.createReadStream(file);
          s.on('data', (d) => h.update(d));
          s.on('end', () => resolve(h.digest('hex')));
          s.on('error', reject);
        });
      } catch (err) {
        if (attempt === retries) throw err;
        this.logger.warn(`Hash retry ${attempt}/${retries} for ${file}`);
        await this.sleep(1000 * attempt);
      }
    }
  }

  async uploadFileWithResume(file, sha, versionId, receiver, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const url = `${receiver}/upload-file?sha=${sha}&relpath=${encodeURIComponent(file.relpath)}&versionId=${encodeURIComponent(versionId)}`;
        
        // Check server offset
        const offResp = await axios.get(`${receiver}/file-offset?sha=${sha}`, {
          timeout: 10000,
        });
        
        const existing = offResp.data?.bytes || 0;
        if (existing >= file.size) {
          this.logger.debug(`Already uploaded: ${file.relpath}`);
          this.stats.uploadedBytes += file.size;
          return;
        }

        const start = existing;
        const readStream = fs.createReadStream(file.fullpath, { start });
        
        this.logger.info(`Uploading ${file.relpath} (${this.formatSize(file.size)}) from byte ${start}`);
        
        const resp = await axios({
          method: 'post',
          url,
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-start-byte': String(start),
            'x-filesize': String(file.size),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
          data: readStream,
          timeout: 0,
        });

        if (resp.data?.status === 'ok') {
          this.stats.uploadedFiles++;
          this.stats.uploadedBytes += (file.size - start);
          this.emit('fileUploaded', { file: file.relpath, size: file.size });
          return;
        }
      } catch (err) {
        if (attempt === retries) {
          this.logger.error(`Upload failed after ${retries} attempts: ${file.relpath}`, { error: err.message });
          this.stats.errors++;
          throw err;
        }
        this.logger.warn(`Upload retry ${attempt}/${retries} for ${file.relpath}`);
        await this.sleep(this.config.get('server.retryDelay') || 5000);
      }
    }
  }

  async runBackup(sourcePath) {
    if (this.isRunning) {
      this.logger.warn('Backup already running');
      return { success: false, message: 'Backup already in progress' };
    }

    this.isRunning = true;
    this.resetStats();
    const startTime = Date.now();
    const dateStr = new Date().toISOString().slice(0, 10);

    try {
      const root = path.resolve(sourcePath);
      const receiver = this.config.get('server.url');

      this.logger.info(`Starting backup: ${root} -> ${receiver}`);
      this.emit('started', { root, receiver });

      // Build manifest
      this.logger.info('Scanning files...');
      const { files: manifest, errors: scanErrors } = await this.buildManifest(root);
      
      if (manifest.length === 0) {
        this.logger.warn('No files to backup');
        return { success: false, message: 'No files found' };
      }

      this.logger.info(`Found ${manifest.length} files (${this.formatSize(this.stats.totalBytes)})`);
      
      // Send initial request
      const initResp = await axios.post(
        `${receiver}/init-backup`,
        {
          date: dateStr,
          clientId: this.clientId,
          manifest: manifest.map((f) => ({
            relpath: f.relpath,
            size: f.size,
            mtime: f.mtime,
            sha: f.sha,
          })),
        },
        { timeout: this.config.get('server.timeout') }
      );

      const { dayIndex, versionId, sessionKey, missingHashes } = initResp.data;
      this.logger.info(`Server ready: version=${versionId}, missing=${missingHashes.length} files`);

      // Upload missing files
      if (missingHashes.length > 0) {
        const shaToFile = {};
        for (const f of manifest) shaToFile[f.sha] = f;

        const parallel = this.config.get('backup.parallelUploads') || 3;
        const queue = missingHashes.slice();
        
        const worker = async () => {
          while (queue.length > 0) {
            const sha = queue.shift();
            const f = shaToFile[sha];
            if (!f) {
              this.logger.warn(`Server requested unknown hash: ${sha}`);
              continue;
            }
            try {
              await this.uploadFileWithResume(f, sha, versionId, receiver);
            } catch (err) {
              // Error logged in uploadFileWithResume
              // Continue with other files
            }
          }
        };

        const workers = [];
        for (let i = 0; i < parallel; i++) {
          workers.push(worker());
        }
        await Promise.all(workers);
      }

      // Commit version
      this.logger.info('Committing backup...');
      const commitResp = await axios.post(
        `${receiver}/commit-version`,
        {
          sessionKey,
          manifest: manifest.map((f) => ({
            relpath: f.relpath,
            sha: f.sha,
            size: f.size,
            mtime: f.mtime,
          })),
          extra: { host: os.hostname() },
        },
        { timeout: this.config.get('server.timeout') }
      );

      const duration = Date.now() - startTime;
      const result = {
        success: true,
        date: dateStr,
        dayIndex,
        versionId,
        stats: this.stats,
        duration,
        errors: scanErrors
      };

      this.logger.info(`Backup completed in ${this.formatDuration(duration)}`);
      this.logger.history('Backup completed', result);
      this.emit('completed', result);

      return result;

    } catch (err) {
      const duration = Date.now() - startTime;
      this.logger.error('Backup failed', { error: err.message, stack: err.stack });
      this.emit('failed', { error: err.message, duration });
      return { success: false, message: err.message, duration };
    } finally {
      this.isRunning = false;
    }
  }

  resetStats() {
    this.stats = {
      totalFiles: 0,
      processedFiles: 0,
      skippedFiles: 0,
      uploadedFiles: 0,
      errors: 0,
      totalBytes: 0,
      uploadedBytes: 0
    };
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Scheduler ====================
class BackupScheduler {
  constructor(config, logger, backupManager) {
    this.config = config;
    this.logger = logger;
    this.backupManager = backupManager;
    this.timers = [];
  }

  start() {
    if (!this.config.get('schedule.enabled')) {
      this.logger.info('Scheduler disabled in config');
      return;
    }

    const times = this.config.get('schedule.times') || [];
    this.logger.info(`Starting scheduler with ${times.length} backup times`);

    for (const time of times) {
      this.scheduleBackup(time);
    }
  }

  scheduleBackup(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    const scheduleNext = () => {
      const now = new Date();
      const scheduled = new Date(now);
      scheduled.setHours(hours, minutes, 0, 0);
      
      if (scheduled <= now) {
        scheduled.setDate(scheduled.getDate() + 1);
      }
      
      const delay = scheduled.getTime() - now.getTime();
      this.logger.info(`Next backup at ${timeStr}: ${scheduled.toLocaleString()}`);
      
      const timer = setTimeout(async () => {
        this.logger.info(`Scheduled backup starting at ${timeStr}`);
        await this.runScheduledBackup();
        scheduleNext(); // Schedule next occurrence
      }, delay);
      
      this.timers.push(timer);
    };

    scheduleNext();
  }

  async runScheduledBackup() {
    const sources = this.config.get('backup.sources') || [];
    
    if (sources.length === 0) {
      this.logger.warn('No backup sources configured');
      return;
    }

    for (const source of sources) {
      try {
        await this.backupManager.runBackup(source);
      } catch (err) {
        this.logger.error(`Scheduled backup failed for ${source}`, { error: err.message });
      }
    }
  }

  stop() {
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers = [];
    this.logger.info('Scheduler stopped');
  }
}

// ==================== CLI Interface ====================
class BackupCLI {
  constructor() {
    this.configManager = new ConfigManager();
    this.logger = new Logger(this.configManager);
    this.backupManager = new BackupManager(this.configManager, this.logger);
    this.scheduler = new BackupScheduler(this.configManager, this.logger, this.backupManager);

    // Setup event listeners for progress
    this.backupManager.on('started', (data) => {
      console.log(`\n📦 Backup started: ${data.root}`);
    });

    this.backupManager.on('progress', (data) => {
      if (data.phase === 'scanning') {
        process.stdout.write(`\r🔍 Scanning: ${data.current}/${data.total} files`);
      }
    });

    this.backupManager.on('fileUploaded', (data) => {
      console.log(`✅ Uploaded: ${data.file}`);
    });

    this.backupManager.on('completed', (data) => {
      console.log(`\n\n✨ Backup completed successfully!`);
      console.log(`📊 Stats:`);
      console.log(`   - Files: ${data.stats.uploadedFiles}/${data.stats.processedFiles}`);
      console.log(`   - Size: ${this.backupManager.formatSize(data.stats.uploadedBytes)}`);
      console.log(`   - Skipped: ${data.stats.skippedFiles}`);
      console.log(`   - Errors: ${data.stats.errors}`);
      console.log(`   - Duration: ${this.backupManager.formatDuration(data.duration)}`);
    });

    this.backupManager.on('failed', (data) => {
      console.log(`\n\n❌ Backup failed: ${data.error}`);
    });
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'help';

    switch (command) {
      case 'backup':
        await this.backupNow(args[1]);
        break;
      case 'daemon':
        await this.runDaemon();
        break;
      case 'status':
        this.showStatus();
        break;
      case 'logs':
        this.showLogs(args[1]);
        break;
      case 'config':
        this.showConfig();
        break;
      case 'setup':
        await this.setupWizard();
        break;
      default:
        this.showHelp();
    }
  }

  async backupNow(sourcePath) {
    const source = sourcePath || this.configManager.get('backup.sources')?.[0];
    
    if (!source) {
      console.error('❌ No backup source specified. Use: node client.js backup <path>');
      console.error('   Or configure sources in config.json');
      process.exit(1);
    }

    console.log(`🚀 Starting immediate backup of: ${source}`);
    await this.backupManager.runBackup(source);
    process.exit(0);
  }

  async runDaemon() {
    console.log('🔄 Starting backup daemon...');
    console.log('   Press Ctrl+C to stop\n');
    
    this.scheduler.start();

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\n👋 Stopping daemon...');
      this.scheduler.stop();
      process.exit(0);
    });

    // Prevent exit
    setInterval(() => {}, 1000000);
  }

  showStatus() {
    console.log('\n📊 Backup Client Status\n');
    console.log(`Server: ${this.configManager.get('server.url')}`);
    console.log(`Sources: ${this.configManager.get('backup.sources')?.length || 0}`);
    console.log(`Schedule: ${this.configManager.get('schedule.enabled') ? 'Enabled' : 'Disabled'}`);
    
    if (this.configManager.get('schedule.enabled')) {
      const times = this.configManager.get('schedule.times') || [];
      console.log(`Backup times: ${times.join(', ')}`);
    }
    
    console.log(`\nBackup sources:`);
    const sources = this.configManager.get('backup.sources') || [];
    sources.forEach((src, i) => {
      console.log(`  ${i + 1}. ${src}`);
    });
  }

  showLogs(type = 'backup') {
    const logsDir = path.join(__dirname, 'logs');
    const date = new Date().toISOString().slice(0, 10);
    const logPath = path.join(logsDir, `${type}-${date}.log`);

    console.log(`\n📋 Logs from ${logPath}\n`);

    if (!fs.existsSync(logPath)) {
      console.log('No logs found for today');
      return;
    }

    const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
    const recentLogs = logs.slice(-50); // Show last 50 entries

    recentLogs.forEach(line => {
      try {
        const entry = JSON.parse(line);
        const time = new Date(entry.timestamp).toLocaleTimeString();
        const level = entry.level.toUpperCase().padEnd(5);
        console.log(`[${time}] ${level} ${entry.message}`);
      } catch (err) {
        console.log(line);
      }
    });
  }

  showConfig() {
    console.log('\n⚙️  Current Configuration\n');
    console.log(JSON.stringify(this.configManager.config, null, 2));
  }

  async setupWizard() {
    console.log('\n🎯 Backup Client Setup Wizard\n');
    console.log('This will create a config.json file with your settings.\n');
    
    // For now, create default config
    const config = this.configManager.getDefaultConfig();
    
    console.log('Created default config.json');
    console.log('Please edit config.json to set:');
    console.log('  - server.url: Your backup server URL');
    console.log('  - backup.sources: Folders to backup');
    console.log('  - schedule.times: When to run backups');
    
    this.configManager.saveConfig();
  }

  showHelp() {
    console.log(`
🔐 Professional Backup Client

Usage:
  node client.js <command> [options]

Commands:
  backup [path]    Run backup now (uses config.json sources if no path given)
  daemon           Run as background service with scheduled backups
  status           Show backup status and configuration
  logs [type]      View logs (backup, error, history)
  config           Show current configuration
  setup            Run setup wizard to create config.json
  help             Show this help message

Examples:
  node client.js backup /home/user/documents
  node client.js daemon
  node client.js status
  node client.js logs error

Configuration:
  Edit config.json to configure:
  - Server URL and connection settings
  - Backup source paths
  - Scheduled backup times
  - Retention policies
  - Exclusion patterns

For more information, see README.md
`);
  }
}

// ==================== Main Entry Point ====================
if (require.main === module) {
  const cli = new BackupCLI();
  cli.run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
