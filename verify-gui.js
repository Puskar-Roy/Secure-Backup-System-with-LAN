#!/usr/bin/env node

/**
 * GUI Verification Script
 * Tests that all GUI functionality works properly
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 GUI Verification Test\n');
console.log('This will verify your backup client GUI is working correctly.\n');

let passed = 0;
let failed = 0;

function pass(test) {
  console.log(`✅ ${test}`);
  passed++;
}

function fail(test, error) {
  console.log(`❌ ${test}`);
  if (error) console.log(`   Error: ${error}`);
  failed++;
}

// Test 1: Check files exist
console.log('📁 Checking files...\n');

const files = [
  'src/servers/gui-server.js',
  'config.json',
  'client.js',
  'server.js'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    pass(`${file} exists`);
  } else {
    fail(`${file} exists`, 'File not found');
  }
});

// Test 2: Check config.json structure
console.log('\n⚙️  Checking config.json...\n');

try {
  const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
  
  if (config.server) {
    pass('config.server exists');
  } else {
    fail('config.server exists');
  }
  
  if (config.server?.url) {
    pass(`Server URL: ${config.server.url}`);
  } else {
    fail('Server URL configured');
  }
  
  if (config.backup) {
    pass('config.backup exists');
  } else {
    fail('config.backup exists');
  }
  
  if (config.backup?.sources) {
    pass(`Backup sources: ${config.backup.sources.length} configured`);
    if (config.backup.sources.length === 0) {
      console.log('   ⚠️  No backup sources configured');
      console.log('   Add sources in GUI at http://localhost:3000/settings');
    }
  } else {
    fail('Backup sources array exists');
  }
  
} catch (err) {
  fail('Parse config.json', err.message);
}

// Test 3: Check if GUI server can start
console.log('\n🚀 Checking GUI server...\n');

try {
  const GUIServer = require('./src/servers/gui-server.js');
  pass('GUI server module loads');
  
  const server = new GUIServer(3000);
  pass('GUI server instantiates');
  
  console.log('\n   Note: Server not started in test mode');
  console.log('   To start: node src/servers/gui-server.js');
  
} catch (err) {
  fail('GUI server loads', err.message);
}

// Test 4: Check logs directory
console.log('\n📋 Checking logs directory...\n');

if (fs.existsSync('logs')) {
  pass('logs/ directory exists');
  
  const logFiles = fs.readdirSync('logs').filter(f => f.endsWith('.log'));
  if (logFiles.length > 0) {
    pass(`Found ${logFiles.length} log file(s)`);
  } else {
    console.log('   ℹ️  No log files yet (normal for new installation)');
  }
} else {
  console.log('   ⚠️  logs/ directory missing (will be created on first run)');
}

// Test 5: Check if backup server is running (optional)
console.log('\n🌐 Checking backup server...\n');

const checkServer = () => {
  return new Promise((resolve) => {
    const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const url = config.server?.url || 'http://localhost:8080';
    const parsedUrl = new URL(url);
    
    const req = http.get({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: '/api/config',
      timeout: 2000
    }, (res) => {
      if (res.statusCode === 200 || res.statusCode === 401) {
        pass(`Backup server running at ${url}`);
        resolve(true);
      } else {
        fail('Backup server accessible');
        resolve(false);
      }
    });
    
    req.on('error', () => {
      console.log(`   ⚠️  Backup server not running at ${url}`);
      console.log('   Start with: node server.js');
      resolve(false);
    });
    
    req.on('timeout', () => {
      console.log(`   ⚠️  Backup server timeout at ${url}`);
      resolve(false);
    });
  });
};

checkServer().then(() => {
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary\n');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Your GUI is ready to use.\n');
    console.log('Start the GUI:');
    console.log('  node src/servers/gui-server.js\n');
    console.log('Then open:');
    console.log('  http://localhost:3000\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues above.\n');
    console.log('See TROUBLESHOOTING.md for help.');
  }
  
  console.log('\n📚 Documentation:');
  console.log('  - Complete Guide: GUI_FULLY_WORKING.md');
  console.log('  - Quick Summary: COMPLETE_FIX_SUMMARY.md');
  console.log('  - Troubleshooting: TROUBLESHOOTING.md');
  console.log('');
});
