const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const { getMeta, saveMeta, getConfig, getActiveStoreDir, ensureSync } = require('../utils/storage');
const { sha256OfFile } = require('../utils/fileUtils');
const { BACKUPS_DIR, DATA_ROOT } = require('../config/paths');

// Get offset for a partial file (resume)
router.get('/file-offset', (req, res) => {
  const sha = req.query.sha;
  if (!sha) return res.status(400).json({ error: 'sha required' });
  
  const config = getConfig();
  let storePath = null;
  for (const storeDir of config.storageLocations) {
    const testPath = path.join(storeDir, sha);
    if (fs.existsSync(testPath)) {
      storePath = testPath;
      break;
    }
  }
  
  if (!storePath) {
    storePath = path.join(getActiveStoreDir(), sha);
  }
  
  if (fs.existsSync(storePath)) {
    const s = fs.statSync(storePath);
    return res.json({ exists: true, bytes: s.size });
  } else {
    return res.json({ exists: false, bytes: 0 });
  }
});

// Init backup
router.post('/init-backup', (req, res) => {
  const { date, clientId, manifest } = req.body;
  if (!date || !clientId || !manifest)
    return res.status(400).json({ error: 'date, clientId, manifest required' });
  
  const meta = getMeta();
  const config = getConfig();
  
  let dayIndex = meta.nextDayIdByDate[date] || 1;
  meta.nextDayIdByDate[date] = dayIndex + 1;
  saveMeta();

  // build list of missing hashes - check all storage locations
  const missing = [];
  for (const f of manifest) {
    let found = false;
    for (const storeDir of config.storageLocations) {
      const storePath = path.join(storeDir, f.sha);
      if (fs.existsSync(storePath)) {
        found = true;
        break;
      }
    }
    if (!found) missing.push(f.sha);
  }

  const versionId = `version-${new Date().toISOString().replace(/:/g, '-')}`;
  const dateFolder = `date-[${date}] (day ${dayIndex})`;
  const dayPath = path.join(BACKUPS_DIR, dateFolder);
  const versionPath = path.join(dayPath, versionId);
  ensureSync(versionPath);

  const provisional = {
    date,
    dayIndex,
    versionId,
    clientId,
    createdAt: new Date().toISOString(),
    files: {},
  };
  const sessionKey = `${clientId}_${Date.now()}`;
  meta.sessions[sessionKey] = {
    date,
    dayIndex,
    versionId,
    versionPath,
    provisional,
  };
  saveMeta();

  res.json({
    dayIndex,
    versionId,
    versionPath,
    missingHashes: missing,
    sessionKey,
  });
});

// Upload file
router.post('/upload-file', async (req, res) => {
  const sha = req.query.sha;
  const relpath = req.query.relpath;
  const versionId = req.query.versionId;
  if (!sha || !relpath || !versionId)
    return res.status(400).json({ error: 'sha, relpath, versionId required' });

  const meta = getMeta();
  const session = Object.values(meta.sessions).find((s) => s.versionId === versionId);
  if (!session) return res.status(400).json({ error: 'unknown versionId' });

  const activeStoreDir = getActiveStoreDir();
  const storeFile = path.join(activeStoreDir, sha);
  ensureSync(path.dirname(storeFile));

  const startByteHeader = req.header('x-start-byte');
  let startByte = startByteHeader ? parseInt(startByteHeader, 10) : 0;
  if (fs.existsSync(storeFile)) {
    const st = fs.statSync(storeFile);
    if (st.size > startByte) {
      return res.json({ status: 'exists', bytes: st.size });
    } else {
      startByte = st.size;
    }
  }

  await new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(storeFile, { flags: 'a' });
    req.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    req.on('aborted', () => {
      writeStream.close();
      reject(new Error('client aborted'));
    });
  }).catch((err) => {
    console.error('upload-stream error', err);
    return res.status(500).json({ error: 'upload failed', details: err.message });
  });

  const computed = await sha256OfFile(storeFile);
  if (computed !== sha) {
    console.error('hash mismatch', computed, sha);
    return res.status(400).json({ error: 'hash mismatch', computed });
  }

  const versionPath = session.versionPath;
  const manifestFile = path.join(versionPath, 'manifest.json');
  let manifest = { files: {} };
  if (fs.existsSync(manifestFile)) {
    try {
      manifest = JSON.parse(fs.readFileSync(manifestFile));
    } catch {}
  }
  manifest.files[relpath] = { sha, uploadedAt: new Date().toISOString() };
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  res.json({ status: 'ok', sha });
});

// Commit version
router.post('/commit-version', (req, res) => {
  const { sessionKey, manifest, extra } = req.body;
  if (!sessionKey || !manifest)
    return res.status(400).json({ error: 'sessionKey and manifest required' });
  
  const meta = getMeta();
  const session = meta.sessions[sessionKey];
  if (!session) return res.status(400).json({ error: 'invalid sessionKey' });

  const { date, dayIndex, versionId, versionPath } = session;

  const final = {
    metadata: {
      date,
      dayIndex,
      versionId,
      createdAt: new Date().toISOString(),
      extra: extra || {},
    },
    files: {},
  };
  for (const f of manifest) {
    final.files[f.relpath] = { sha: f.sha, size: f.size, mtime: f.mtime };
  }
  fs.writeFileSync(
    path.join(versionPath, 'manifest.json'),
    JSON.stringify(final, null, 2)
  );

  const dateFolder = `date-[${date}] (day ${dayIndex})`;
  const dayPath = path.join(BACKUPS_DIR, dateFolder);
  ensureSync(dayPath);
  
  meta.days[`${dateFolder}`] = meta.days[`${dateFolder}`] || [];
  meta.days[`${dateFolder}`].push({
    versionId,
    path: path.relative(DATA_ROOT, versionPath),
    createdAt: new Date().toISOString(),
  });
  saveMeta();

  delete meta.sessions[sessionKey];
  saveMeta();

  res.json({ status: 'committed', versionId, versionPath });
});

// Check which hashes exist
router.get('/status/has-hashes', (req, res) => {
  const arr = Array.isArray(req.query.sha)
    ? req.query.sha
    : req.query.sha
    ? [req.query.sha]
    : [];
  
  const config = getConfig();
  const exist = {};
  for (const sha of arr) {
    let found = false;
    for (const storeDir of config.storageLocations) {
      if (fs.existsSync(path.join(storeDir, sha))) {
        found = true;
        break;
      }
    }
    exist[sha] = found;
  }
  res.json(exist);
});

module.exports = router;
