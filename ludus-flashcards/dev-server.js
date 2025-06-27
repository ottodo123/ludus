#!/usr/bin/env node

// Reliable development server that works consistently
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

console.log('🚀 Starting reliable development server...');

// Check if we need to build first
const buildExists = fs.existsSync(path.join(__dirname, 'build'));
if (!buildExists) {
  console.log('📦 No build found, creating production build...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });
  
  buildProcess.on('close', (code) => {
    if (code === 0) {
      startServer();
    } else {
      console.error('❌ Build failed');
      process.exit(1);
    }
  });
} else {
  startServer();
}

function startServer() {
  // Serve static files from build directory
  app.use('/ludus', express.static(path.join(__dirname, 'build')));
  
  // Handle client-side routing
  app.get('/ludus/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  
  // Redirect root to ludus
  app.get('/', (req, res) => {
    res.redirect('/ludus');
  });
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Server running at:');
    console.log(`   http://localhost:${PORT}/ludus`);
    console.log(`   http://127.0.0.1:${PORT}/ludus`);
    console.log('');
    console.log('🔄 This server is refreshable and stable!');
    console.log('📝 To rebuild: npm run build');
  });
}