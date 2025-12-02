/**
 * Configuration Manager
 * Centralized configuration loading and management
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor(configPath = null) {
    this.configPath = configPath || path.join(process.cwd(), 'config.json');
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
          '**/Thumbs.db',
          '**/.cache/**',
          '**/Cache/**',
          '**/*.log'
        ],
        parallelUploads: 3,
        chunkSize: 5242880 // 5MB
      },
      schedule: {
        enabled: false,
        times: ['02:00', '14:00', '22:00'],
        timezone: 'local'
      },
      retention: {
        keepDays: 30,
        keepWeeks: 12,
        keepMonths: 12
      },
      logging: {
        level: 'info',
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

  getAll() {
    return this.config;
  }

  update(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return this.saveConfig();
  }
}

module.exports = ConfigManager;
