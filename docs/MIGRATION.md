# Migration Guide - v1.0 to v2.0

This guide helps you transition from the old structure to the new organized codebase.

## What Changed

### Directory Structure

**Old Structure:**
```
├── client.js (root)
├── server.js (root)
├── gui-server.js (root)
├── config.json (root)
├── routes/ (mixed)
├── middleware/ (mixed)
├── utils/ (mixed)
├── views/ (server)
├── views-gui/ (gui)
```

**New Structure:**
```
├── src/
│   ├── lib/              # Shared utilities
│   ├── servers/          # Server implementations
│   ├── client/           # Client implementations
│   └── index.js          # Main exports
├── scripts/              # All startup scripts
├── routes/               # Server routes (unchanged)
├── middleware/           # Middleware (unchanged)
├── config/               # Config files (unchanged)
├── utils/                # Server utilities (unchanged)
├── views/                # Server views (unchanged)
├── views-gui/            # GUI views (unchanged)
├── public/               # Static assets
├── client.js             # Client entry (backward compatible)
├── server.js             # Server entry (unchanged)
└── config.json           # Config (unchanged)
```

## Breaking Changes

### None! 🎉

The restructuring maintains **full backward compatibility**:

- ✅ `node server.js` still works
- ✅ `node client.js` still works
- ✅ `config.json` location unchanged
- ✅ All routes and views work as before

## New Features

### 1. Modular Architecture

**Old Way:**
```javascript
// Functions scattered throughout files
function loadConfig() { ... }
function saveConfig() { ... }
function writeLog() { ... }
```

**New Way:**
```javascript
const { ConfigManager, Logger } = require('./src/lib');

const config = new ConfigManager();
const logger = new Logger();

// Clean, reusable, testable
config.get('server.url');
logger.info('Operation completed');
```

### 2. Organized Scripts

**Old Way:**
```bash
# Scripts scattered in root
./start-gui.sh
./start-gui.bat
./start-server-hidden.vbs
```

**New Way:**
```bash
# All in scripts/ directory
./scripts/start-server.sh
./scripts/start-gui.sh
./scripts/start-all.sh
```

### 3. npm Scripts

**Old Way:**
```bash
node client.js backup
node server.js
node gui-server.js
```

**New Way:**
```bash
npm run client:backup
npm run server
npm run gui
npm run all  # Start everything!
```

### 4. Centralized Utilities

**Before:** Configuration code duplicated in multiple files

**Now:** 
- `src/lib/config-manager.js` - One place for all config
- `src/lib/logger.js` - Unified logging
- Easy to test and maintain

## Migration Steps

### No Action Required! ✨

Your existing setup works without changes. But to take advantage of new features:

### Step 1: Update Scripts (Optional)

If using old startup scripts:

**Old:**
```bash
./start-gui.sh
```

**New:**
```bash
./scripts/start-gui.sh
```

### Step 2: Use npm Scripts (Recommended)

```bash
# Instead of: node gui-server.js
npm run gui

# Instead of: node server.js
npm run server

# Instead of: node client.js backup
npm run client:backup
```

### Step 3: Adopt New Utilities (For Developers)

If you've customized the code:

```javascript
// Old way
const config = require('./config.json');
console.log(config.server.url);

// New way
const { ConfigManager } = require('./src/lib');
const config = new ConfigManager();
console.log(config.get('server.url'));
```

## File Mapping

| Old Location | New Location | Status |
|-------------|-------------|---------|
| `client.js` | `client.js` | ✅ Unchanged |
| `server.js` | `server.js` | ✅ Unchanged |
| `gui-server.js` | `gui-server.js` (deprecated)<br>`src/servers/gui-server.js` (new) | ⚠️ Both work |
| `config.json` | `config.json` | ✅ Unchanged |
| `routes/` | `routes/` | ✅ Unchanged |
| `middleware/` | `middleware/` | ✅ Unchanged |
| `utils/` | `utils/` | ✅ Unchanged |
| `views/` | `views/` | ✅ Unchanged |
| `views-gui/` | `views-gui/` | ✅ Unchanged |
| `start-gui.sh` | `scripts/start-gui.sh` | 🆕 Improved |
| `start-gui.bat` | `scripts/start-gui.bat` | 🆕 Improved |
| - | `src/lib/config-manager.js` | 🆕 New utility |
| - | `src/lib/logger.js` | 🆕 New utility |
| - | `scripts/start-all.sh` | 🆕 Start everything |

## Benefits

### 1. Better Organization
- Clear separation of concerns
- Easy to find files
- Logical grouping

### 2. Easier Development
- Reusable components
- Cleaner code
- Better testability

### 3. Improved Documentation
- Comprehensive README
- Migration guide (this file)
- Feature documentation

### 4. Professional Structure
- Industry standard layout
- Scalable architecture
- Maintainable codebase

## Rollback

If you need to use the old structure:

**GUI Server:**
```bash
# Old file still exists
node gui-server.js

# Or use the new one
node src/servers/gui-server.js
```

Both work identically!

## FAQ

### Q: Do I need to change anything?

**A:** No! Everything works as before. Changes are additive only.

### Q: Can I use old and new scripts together?

**A:** Yes! All old scripts still work. New scripts provide better organization.

### Q: Will my config.json work?

**A:** Yes! Configuration format is unchanged.

### Q: What about my data and logs?

**A:** Untouched! All data remains in the same locations.

### Q: Should I switch to npm scripts?

**A:** Recommended but optional. npm scripts provide:
- Shorter commands
- Cross-platform compatibility
- Better documentation

### Q: What happens to old documentation?

**A:** Preserved in `docs/` directory. New README consolidates everything.

## Recommended Next Steps

1. ✅ Review new README.md
2. ✅ Try npm scripts: `npm run gui`, `npm run server`
3. ✅ Use new startup scripts: `./scripts/start-all.sh`
4. ✅ Explore `src/lib/` utilities
5. ✅ Read feature documentation

## Support

If you encounter any issues:

1. Check this migration guide
2. Review README.md
3. Test with old commands first
4. Check logs in `logs/` directory
5. Verify config.json is valid

## Conclusion

The v2.0 restructuring improves code organization while maintaining full backward compatibility. You can:

- Continue using old methods (still work!)
- Gradually adopt new features
- Mix old and new approaches
- Rollback anytime if needed

**Nothing breaks, everything improves!** 🚀

---

**Version**: 2.0.0  
**Migration Difficulty**: None (backward compatible)  
**Recommended**: Yes (better organization)
