const path = require('path');

const DATA_ROOT = path.resolve(__dirname, '..', 'data');
const BACKUPS_DIR = path.join(DATA_ROOT, 'backups');
const STORE_DIR = path.join(DATA_ROOT, 'store');
const META_FILE = path.join(DATA_ROOT, 'metadata.json');
const CONFIG_FILE = path.join(DATA_ROOT, 'config.json');

module.exports = {
  DATA_ROOT,
  BACKUPS_DIR,
  STORE_DIR,
  META_FILE,
  CONFIG_FILE
};
