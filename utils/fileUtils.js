const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { DATA_ROOT } = require('../config/paths');

// SHA256 hash of file
function sha256OfFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const s = fs.createReadStream(filePath);
    s.on('data', (d) => hash.update(d));
    s.on('end', () => resolve(hash.digest('hex')));
    s.on('error', reject);
  });
}

// Prevent path traversal and ensure version path is under DATA_ROOT
function safeResolveVersionPath(versionPath) {
  const abs = path.isAbsolute(versionPath) ? versionPath : path.join(DATA_ROOT, versionPath);
  const normalized = path.normalize(abs);
  if (!normalized.startsWith(DATA_ROOT)) throw new Error('invalid versionPath');
  return normalized;
}

module.exports = {
  sha256OfFile,
  safeResolveVersionPath
};
