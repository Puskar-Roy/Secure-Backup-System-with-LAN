/**
 * Main entry point for backup system
 * Provides clean interface to all components
 */

module.exports = {
  // Core utilities
  ConfigManager: require('./config-manager'),
  Logger: require('./logger'),
  
  // Server components (lazy loaded)
  get BackupServer() {
    return require('../servers/backup-server');
  },
  
  get GUIServer() {
    return require('../servers/gui-server');
  },
  
  // Client components (lazy loaded)
  get BackupClient() {
    return require('../client/backup-client');
  }
};
