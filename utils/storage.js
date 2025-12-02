const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const bcrypt = require('bcryptjs');
const { STORE_DIR, META_FILE, CONFIG_FILE } = require('../config/paths');

// Metadata management
let meta = { days: {}, nextDayIdByDate: {}, sessions: {} };

function loadMeta() {
  if (fs.existsSync(META_FILE)) {
    try {
      meta = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
    } catch (e) {
      console.warn('meta load failed', e);
    }
  } else {
    saveMeta();
  }
}

function saveMeta() {
  fs.writeFileSync(META_FILE, JSON.stringify(meta, null, 2));
}

function getMeta() {
  return meta;
}

// Config management
let config = {
  storageLocations: [STORE_DIR],
  activeStorageIndex: 0,
  username: 'admin',
  passwordHash: bcrypt.hashSync('www.puskarroy.in74495123', 10)
};

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.warn('config load failed', e);
    }
  } else {
    saveConfig();
  }
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getConfig() {
  return config;
}

// Helper to get current active storage directory
function getActiveStoreDir() {
  const activeDir = config.storageLocations[config.activeStorageIndex] || STORE_DIR;
  mkdirp.sync(activeDir);
  return activeDir;
}

// Helper: ensure folder exists
function ensureSync(p) {
  mkdirp.sync(p);
}

// Initialize storage
function initStorage() {
  const { BACKUPS_DIR, STORE_DIR } = require('../config/paths');
  mkdirp.sync(BACKUPS_DIR);
  mkdirp.sync(STORE_DIR);
  loadMeta();
  loadConfig();
}

module.exports = {
  getMeta,
  saveMeta,
  getConfig,
  saveConfig,
  getActiveStoreDir,
  ensureSync,
  initStorage
};
