import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3010;
let isBuilding = false;
let buildLogs = [];

// Helper to set CORS headers
const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const server = http.createServer((req, res) => {
  setCors(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // Status endpoint
  if (pathname === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ready', 
      isBuilding, 
      platform: process.platform,
      rustInstalled: true
    }));
    return;
  }

  // Trigger Build endpoint (streams logs via SSE)
  if (pathname === '/build' && req.method === 'POST') {
    if (isBuilding) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Build is already in progress' }));
      return;
    }

    isBuilding = true;
    buildLogs = [];
    
    // Set headers for Server-Sent Events (SSE)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('status', { message: 'Mulai proses kompilasi...' });
    
    // Run npx tauri build
    // On Windows, spawned commands need shell option
    const buildProcess = spawn('npx', ['tauri', 'build', '--ci'], { 
      shell: true,
      cwd: __dirname
    });

    buildProcess.stdout.on('data', (data) => {
      const text = data.toString();
      buildLogs.push(text);
      sendEvent('log', { text });
    });

    buildProcess.stderr.on('data', (data) => {
      const text = data.toString();
      buildLogs.push(text);
      sendEvent('log', { text });
    });

    buildProcess.on('close', (code) => {
      isBuilding = false;
      if (code === 0) {
        sendEvent('success', { 
          message: 'Build selesai! File EXE siap diunduh.',
          exeName: 'mavi-mes_0.1.0_x64-setup.exe' 
        });
      } else {
        sendEvent('failed', { message: `Build gagal dengan exit code ${code}` });
      }
      res.end();
    });

    req.on('close', () => {
      // Client disconnected, but keep build running in background
      console.log('Client build screen closed, compiling continues...');
    });
    return;
  }

  // Download EXE Installer endpoint
  if (pathname === '/download/exe' && req.method === 'GET') {
    const exePath = path.join(
      __dirname, 
      'src-tauri', 
      'target', 
      'release', 
      'bundle', 
      'nsis', 
      'mavi-mes_0.1.0_x64-setup.exe'
    );

    if (fs.existsSync(exePath)) {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename=mavi-mes_0.1.0_x64-setup.exe',
      });
      const fileStream = fs.createReadStream(exePath);
      fileStream.pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File installer (.exe) belum dibuat atau tidak ditemukan. Jalankan build terlebih dahulu.' }));
    }
    return;
  }

  // Download MSI Installer endpoint
  if (pathname === '/download/msi' && req.method === 'GET') {
    const msiPath = path.join(
      __dirname, 
      'src-tauri', 
      'target', 
      'release', 
      'bundle', 
      'msi', 
      'mavi-mes_0.1.0_x64_en-US.msi'
    );

    if (fs.existsSync(msiPath)) {
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename=mavi-mes_0.1.0_x64.msi',
      });
      const fileStream = fs.createReadStream(msiPath);
      fileStream.pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File installer (.msi) belum dibuat atau tidak ditemukan.' }));
    }
    return;
  }

  // Default fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Route not found' }));
});

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`   MAVI MES BUILD BRIDGE RUNNING ON PORT ${PORT} `);
  console.log(`   URL Status: http://localhost:${PORT}/status    `);
  console.log(`==================================================`);
});
