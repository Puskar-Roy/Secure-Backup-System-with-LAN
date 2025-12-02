const express = require('express');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const router = express.Router();
const { requireAuthHTML } = require('../middleware/auth');
const { getMeta, getConfig } = require('../utils/storage');
const { safeResolveVersionPath } = require('../utils/fileUtils');

// Main explorer
router.get('/explorer', requireAuthHTML, (req, res) => {
  res.render('explorer');
});

// Legacy explorer
router.get('/explorer/v1', requireAuthHTML, (req, res) => {
  res.render('explorer-v1');
});

// Browse: list date folders & summary
router.get('/browse', (req, res) => {
  const meta = getMeta();
  const result = [];
  for (const [dateFolder, versions] of Object.entries(meta.days)) {
    result.push({
      dateFolder,
      versions: versions.map(v => ({ versionId: v.versionId, path: v.path, createdAt: v.createdAt }))
    });
  }
  res.json({ days: result });
});

// List versions in a dateFolder
router.get('/list', (req, res) => {
  const dateFolder = req.query.dateFolder;
  if (!dateFolder) return res.status(400).json({ error: 'dateFolder required' });
  
  const meta = getMeta();
  const versions = meta.days[dateFolder] || [];
  res.json({ dateFolder, versions });
});

// Return the version manifest.json
router.get('/version-manifest', (req, res) => {
  const versionPath = req.query.versionPath;
  if (!versionPath) return res.status(400).json({ error: 'versionPath required' });
  
  try {
    const vp = safeResolveVersionPath(versionPath);
    const mf = path.join(vp, 'manifest.json');
    if (!fs.existsSync(mf)) return res.status(404).json({ error: 'manifest not found' });
    const data = JSON.parse(fs.readFileSync(mf, 'utf8'));
    res.json({ manifest: data, versionPath: path.relative(require('../config/paths').DATA_ROOT, vp) });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Stream/download a file by versionPath + relpath
router.get('/file', (req, res) => {
  const { versionPath, relpath } = req.query;
  if (!versionPath || !relpath) return res.status(400).json({ error: 'versionPath & relpath required' });
  
  try {
    const vp = safeResolveVersionPath(versionPath);
    const mf = path.join(vp, 'manifest.json');
    if (!fs.existsSync(mf)) return res.status(404).json({ error: 'manifest not found' });
    const manifest = JSON.parse(fs.readFileSync(mf, 'utf8'));
    
    const fileEntry = manifest.files[relpath];
    if (!fileEntry) return res.status(404).json({ error: 'file not found in manifest' });
    const sha = fileEntry.sha;
    
    const config = getConfig();
    let storeFile = null;
    for (const storeDir of config.storageLocations) {
      const testPath = path.join(storeDir, sha);
      if (fs.existsSync(testPath)) {
        storeFile = testPath;
        break;
      }
    }
    
    if (!storeFile) return res.status(404).json({ error: 'content not found in store' });

    const stat = fs.statSync(storeFile);
    const total = stat.size;

    const range = req.headers.range;
    if (range) {
      const m = range.match(/bytes=(\d*)-(\d*)/);
      if (!m) return res.status(416).end();
      let start = m[1] ? parseInt(m[1], 10) : 0;
      let end = m[2] ? parseInt(m[2], 10) : total - 1;
      if (isNaN(start) || isNaN(end) || start > end || end >= total) return res.status(416).end();
      res.status(206);
      res.set({
        'Content-Range': `bytes ${start}-${end}/${total}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': (end - start) + 1,
        'Content-Type': mime.lookup(relpath) || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(relpath)}"`
      });
      const rs = fs.createReadStream(storeFile, { start, end });
      rs.pipe(res);
    } else {
      res.set({
        'Content-Length': total,
        'Accept-Ranges': 'bytes',
        'Content-Type': mime.lookup(relpath) || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${path.basename(relpath)}"`
      });
      const rs = fs.createReadStream(storeFile);
      rs.pipe(res);
    }
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Stream/download by sha directly
router.get('/file-by-sha', (req, res) => {
  const sha = req.query.sha;
  if (!sha) return res.status(400).json({ error: 'sha required' });
  
  const config = getConfig();
  let storeFile = null;
  for (const storeDir of config.storageLocations) {
    const testPath = path.join(storeDir, sha);
    if (fs.existsSync(testPath)) {
      storeFile = testPath;
      break;
    }
  }
  
  if (!storeFile) return res.status(404).json({ error: 'not found' });

  const stat = fs.statSync(storeFile);
  const total = stat.size;
  const range = req.headers.range;
  const mimeType = mime.lookup(storeFile) || 'application/octet-stream';

  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (!m) return res.status(416).end();
    let start = m[1] ? parseInt(m[1], 10) : 0;
    let end = m[2] ? parseInt(m[2], 10) : total - 1;
    if (isNaN(start) || isNaN(end) || start > end || end >= total) return res.status(416).end();
    res.status(206);
    res.set({
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': (end - start) + 1,
      'Content-Type': mimeType
    });
    fs.createReadStream(storeFile, { start, end }).pipe(res);
  } else {
    res.set({
      'Content-Length': total,
      'Accept-Ranges': 'bytes',
      'Content-Type': mimeType
    });
    fs.createReadStream(storeFile).pipe(res);
  }
});

// Search across manifests
router.get('/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  if (!q) return res.status(400).json({ error: 'q required' });
  
  const meta = getMeta();
  const matches = [];
  
  for (const [dateFolder, versions] of Object.entries(meta.days)) {
    for (const v of versions) {
      try {
        const vp = safeResolveVersionPath(v.path);
        const mfFile = path.join(vp, 'manifest.json');
        if (!fs.existsSync(mfFile)) continue;
        const mf = JSON.parse(fs.readFileSync(mfFile, 'utf8'));
        for (const [rel, info] of Object.entries(mf.files || {})) {
          if (rel.toLowerCase().includes(q)) {
            matches.push({
              dateFolder,
              versionId: v.versionId,
              versionPath: v.path,
              relpath: rel,
              sha: info.sha,
              size: info.size || null
            });
            if (matches.length >= 500) break;
          }
        }
      } catch (e) {
        console.warn('search skip', e.message);
      }
    }
  }
  res.json({ q, count: matches.length, matches });
});

module.exports = router;
