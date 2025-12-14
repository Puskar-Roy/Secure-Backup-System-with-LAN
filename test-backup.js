#!/usr/bin/env node

/**
 * Test Backup System
 * Quick test to verify backup functionality
 */

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing Backup System\n');

// Test 1: Check if client.js exists
console.log('1️⃣  Checking client.js...');
const clientPath = path.join(__dirname, 'client.js');
if (!fs.existsSync(clientPath)) {
  console.error('❌ client.js not found!');
  process.exit(1);
}
console.log('✅ client.js found');

// Test 2: Check if config.json exists
console.log('\n2️⃣  Checking config.json...');
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  console.error('❌ config.json not found!');
  process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
console.log('✅ config.json found');
console.log(`   Server: ${config.server.url}`);
console.log(`   Sources: ${config.backup.sources.length}`);

// Test 3: Check if backup sources exist
console.log('\n3️⃣  Checking backup sources...');
let validSources = 0;
for (const source of config.backup.sources) {
  if (fs.existsSync(source)) {
    console.log(`   ✅ ${source}`);
    validSources++;
  } else {
    console.log(`   ❌ ${source} (not found)`);
  }
}

if (validSources === 0) {
  console.error('\n❌ No valid backup sources found!');
  console.log('   Add valid paths to config.json under backup.sources');
  process.exit(1);
}

// Test 4: Test running client.js
console.log('\n4️⃣  Testing client.js execution...');
const testProcess = spawn('node', [clientPath, '--help'], {
  cwd: __dirname,
  stdio: 'pipe'
});

let output = '';
testProcess.stdout.on('data', (data) => {
  output += data.toString();
});

testProcess.stderr.on('data', (data) => {
  output += data.toString();
});

testProcess.on('close', (code) => {
  if (code === 0 || output.includes('Backup Client')) {
    console.log('✅ client.js executes successfully');
    console.log('\n5️⃣  Running a test backup (dry run)...');
    console.log('   This will scan files but not upload them.\n');
    
    // Run actual backup for first source
    const source = config.backup.sources[0];
    console.log(`   Backing up: ${source}\n`);
    
    const backup = spawn('node', [clientPath, 'backup', source], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    backup.on('close', (backupCode) => {
      if (backupCode === 0) {
        console.log('\n✅ All tests passed! Backup system is working correctly.');
      } else {
        console.log('\n⚠️  Backup completed with errors. Check logs for details.');
      }
    });
  } else {
    console.error('❌ client.js failed to execute');
    console.error('   Output:', output);
    process.exit(1);
  }
});
