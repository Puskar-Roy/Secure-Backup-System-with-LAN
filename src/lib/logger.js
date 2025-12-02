/**
 * Logger
 * Centralized logging with file rotation and levels
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(options = {}) {
    this.level = options.level || 'info';
    this.logsDir = options.logsDir || path.join(process.cwd(), 'logs');
    this.maxLogSize = options.maxLogSize || 10485760; // 10MB
    this.keepLogs = options.keepLogs || 30;
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
      this.rotateIfNeeded(logPath);
    } catch (err) {
      console.error('Failed to write log:', err.message);
    }
  }

  rotateIfNeeded(logPath) {
    try {
      const stats = fs.statSync(logPath);
      if (stats.size > this.maxLogSize) {
        const timestamp = new Date().getTime();
        const rotatedPath = `${logPath}.${timestamp}`;
        fs.renameSync(logPath, rotatedPath);
        this.cleanOldLogs();
      }
    } catch (err) {
      // Ignore rotation errors
    }
  }

  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const maxAge = this.keepLogs * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        const filePath = path.join(this.logsDir, file);
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
        }
      });
    } catch (err) {
      // Ignore cleanup errors
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
    if (this.level === 'debug') {
      console.log(`[DEBUG] ${message}`);
      this.write('backup', 'debug', message, data);
    }
  }

  history(message, data) {
    this.write('history', 'info', message, data);
  }

  readLogs(type = 'backup', lines = 50) {
    try {
      const logPath = this.getLogPath(type);
      
      if (!fs.existsSync(logPath)) return [];
      
      const content = fs.readFileSync(logPath, 'utf8');
      const allLogs = content.split('\n').filter(Boolean);
      const recentLogs = allLogs.slice(-lines);
      
      return recentLogs.map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return { message: line };
        }
      });
    } catch (err) {
      console.error('Log read error:', err);
      return [];
    }
  }
}

module.exports = Logger;
