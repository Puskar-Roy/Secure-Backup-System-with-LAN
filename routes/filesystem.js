const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Browse filesystem - list directories
router.get('/browse-folders', requireAuth, (req, res) => {
  const currentPath = req.query.path || (process.platform === 'win32' ? 'C:\\' : '/');
  
  try {
    // Security: Normalize and validate path
    const normalizedPath = path.normalize(currentPath);
    
    // Check if path exists and is a directory
    if (!fs.existsSync(normalizedPath)) {
      return res.json({ error: 'Path does not exist', path: normalizedPath });
    }
    
    const stat = fs.statSync(normalizedPath);
    if (!stat.isDirectory()) {
      return res.json({ error: 'Path is not a directory', path: normalizedPath });
    }
    
    // Read directory contents
    const items = fs.readdirSync(normalizedPath);
    const folders = [];
    
    items.forEach(item => {
      try {
        const itemPath = path.join(normalizedPath, item);
        const itemStat = fs.statSync(itemPath);
        
        if (itemStat.isDirectory()) {
          // Skip hidden folders (optional)
          if (!item.startsWith('.') || item === '..') {
            folders.push({
              name: item,
              path: itemPath,
              isDirectory: true
            });
          }
        }
      } catch (err) {
        // Skip items we can't access
      }
    });
    
    // Sort folders alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    
    // Get parent directory
    const parentPath = path.dirname(normalizedPath);
    const isRoot = normalizedPath === parentPath;
    
    res.json({
      currentPath: normalizedPath,
      parentPath: isRoot ? null : parentPath,
      isRoot,
      folders
    });
  } catch (err) {
    res.status(500).json({ error: err.message, path: currentPath });
  }
});

// Get available drives (Windows) or root directories (Linux/Mac)
router.get('/get-drives', requireAuth, (req, res) => {
  if (process.platform === 'win32') {
    // Windows: Get available drives
    const drives = [];
    for (let i = 65; i <= 90; i++) { // A-Z
      const driveLetter = String.fromCharCode(i);
      const drivePath = `${driveLetter}:\\`;
      try {
        if (fs.existsSync(drivePath)) {
          drives.push({
            name: `${driveLetter}:`,
            path: drivePath
          });
        }
      } catch (err) {
        // Skip inaccessible drives
      }
    }
    res.json(drives);
  } else {
    // Linux/Mac: Common mount points
    const commonPaths = [
      { name: 'Root (/)', path: '/' },
      { name: 'Home', path: '/home' },
      { name: 'Media (USB)', path: '/media' },
      { name: 'Mount Points', path: '/mnt' },
      { name: 'Temporary', path: '/tmp' }
    ];
    
    const drives = commonPaths.filter(p => {
      try {
        return fs.existsSync(p.path);
      } catch {
        return false;
      }
    });
    
    res.json(drives);
  }
});

module.exports = router;
