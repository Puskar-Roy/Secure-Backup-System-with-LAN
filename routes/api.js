const express = require('express');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { getConfig, saveConfig, getMeta } = require('../utils/storage');

// Get stats
router.get('/stats', requireAuth, (req, res) => {
  const config = getConfig();
  const meta = getMeta();
  let totalBackups = 0;
  let totalStorage = 0;
  let uniqueFiles = 0;
  
  // Count backups
  for (const versions of Object.values(meta.days)) {
    totalBackups += versions.length;
  }
  
  // Calculate storage from all configured locations
  config.storageLocations.forEach(storeDir => {
    try {
      if (fs.existsSync(storeDir)) {
        const files = fs.readdirSync(storeDir);
        uniqueFiles += files.length;
        files.forEach(file => {
          try {
            const stat = fs.statSync(path.join(storeDir, file));
            totalStorage += stat.size;
          } catch (e) {}
        });
      }
    } catch (e) {
      console.warn('Could not read storage dir:', storeDir, e.message);
    }
  });
  
  res.json({ totalBackups, totalStorage, totalFiles: uniqueFiles });
});

// Get config
router.get('/config', requireAuth, (req, res) => {
  const config = getConfig();
  res.json({
    storageLocations: config.storageLocations,
    activeStorageIndex: config.activeStorageIndex
  });
});

// Add storage location
router.post('/config/storage', requireAuth, (req, res) => {
  const { path: storagePath } = req.body;
  const config = getConfig();
  
  if (!storagePath) {
    return res.json({ success: false, error: 'Path is required' });
  }
  
  try {
    mkdirp.sync(storagePath);
    if (!config.storageLocations.includes(storagePath)) {
      config.storageLocations.push(storagePath);
      saveConfig();
      res.json({ success: true });
    } else {
      res.json({ success: false, error: 'Storage location already exists' });
    }
  } catch (err) {
    res.json({ success: false, error: 'Invalid path or permission denied' });
  }
});

// Set active storage
router.post('/config/storage/active', requireAuth, (req, res) => {
  const { index } = req.body;
  const config = getConfig();
  
  if (index >= 0 && index < config.storageLocations.length) {
    config.activeStorageIndex = index;
    saveConfig();
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid storage index' });
  }
});

// Remove storage location
router.delete('/config/storage/:index', requireAuth, (req, res) => {
  const index = parseInt(req.params.index);
  const config = getConfig();
  
  if (config.storageLocations.length <= 1) {
    return res.json({ success: false, error: 'Cannot remove last storage location' });
  }
  
  if (index === config.activeStorageIndex) {
    return res.json({ success: false, error: 'Cannot remove active storage location' });
  }
  
  if (index >= 0 && index < config.storageLocations.length) {
    config.storageLocations.splice(index, 1);
    if (config.activeStorageIndex > index) {
      config.activeStorageIndex--;
    }
    saveConfig();
    res.json({ success: true });
  } else {
    res.json({ success: false, error: 'Invalid storage index' });
  }
});

// Get all backups with details
router.get('/backups', requireAuth, (req, res) => {
  const meta = getMeta();
  const backups = [];
  
  for (const [day, versions] of Object.entries(meta.days)) {
    versions.forEach((version, idx) => {
      backups.push({
        day,
        version: idx,
        timestamp: version.timestamp,
        fileCount: version.files ? version.files.length : 0,
        totalSize: version.files ? version.files.reduce((sum, f) => sum + (f.size || 0), 0) : 0,
        files: version.files || []
      });
    });
  }
  
  // Sort by timestamp (newest first)
  backups.sort((a, b) => b.timestamp - a.timestamp);
  
  res.json(backups);
});

// Get specific backup details
router.get('/backups/:day/:version', requireAuth, (req, res) => {
  const { day, version } = req.params;
  const meta = getMeta();
  
  if (!meta.days[day] || !meta.days[day][parseInt(version)]) {
    return res.status(404).json({ error: 'Backup not found' });
  }
  
  const backup = meta.days[day][parseInt(version)];
  res.json(backup);
});

// Delete a specific backup
router.delete('/backups/:day/:version', requireAuth, (req, res) => {
  const { day, version } = req.params;
  const meta = getMeta();
  const { saveMeta } = require('../utils/storage');
  
  if (!meta.days[day] || !meta.days[day][parseInt(version)]) {
    return res.status(404).json({ success: false, error: 'Backup not found' });
  }
  
  try {
    // Remove the version
    meta.days[day].splice(parseInt(version), 1);
    
    // If no versions left for this day, remove the day
    if (meta.days[day].length === 0) {
      delete meta.days[day];
    }
    
    saveMeta();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete all backups for a specific day
router.delete('/backups/:day', requireAuth, (req, res) => {
  const { day } = req.params;
  const meta = getMeta();
  const { saveMeta } = require('../utils/storage');
  
  if (!meta.days[day]) {
    return res.status(404).json({ success: false, error: 'Day not found' });
  }
  
  try {
    delete meta.days[day];
    saveMeta();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
