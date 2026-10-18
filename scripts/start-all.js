/**
 * scripts/start-all.js — Multi-Port Local Environment Orchestrator
 *
 * Concurrently boots and monitors:
 *  - Backend API Server  : http://localhost:5000
 *  - Student Client UI   : http://localhost:5500
 *  - Admin Panel Client  : http://localhost:5501
 *
 * Gracefully shuts down all child processes on SIGINT/SIGTERM.
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..');
const serverDir = path.join(rootDir, 'server');
const clientDir = path.join(rootDir, 'client');
const adminClientDir = path.join(rootDir, 'admin-client');

// Release ports if previously occupied by orphaned processes to avoid EADDRINUSE
function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5 && parts[1].endsWith(`:${port}`) && parts[3] === 'LISTENING') {
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0' && pid !== String(process.pid)) {
            console.log(`🧹 Releasing occupied port ${port} (PID ${pid})...`);
            try {
              execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            } catch (_) {}
          }
        }
      }
    } else {
      try {
        execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
      } catch (_) {}
    }
  } catch (_) {
    // Port is free
  }
}

const children = [];

function spawnProcess(name, command, args, cwd, useShell = false) {
  console.log(`🚀 Starting ${name} in ${cwd}...`);
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: useShell
  });

  child.on('error', (err) => {
    console.error(`❌ [${name}] Error:`, err.message);
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      console.log(`🛑 [${name}] Stopped via signal ${signal}`);
    } else if (code !== 0 && code !== null) {
      console.error(`⚠️ [${name}] Exited with code ${code}`);
    }
  });

  children.push(child);
  return child;
}

// 0. Ensure ports 5000, 5500, 5501 are clean before booting
freePort(5000);
freePort(5500);
freePort(5501);

// Resolve local 'serve' package entry point to bypass npx overhead and shell deprecation
let serveBin = null;
try {
  serveBin = require.resolve('serve/build/main.js', { paths: [rootDir] });
} catch (_) {
  serveBin = null;
}

// 1. Start Backend API Server (:5000)
spawnProcess('Backend API (:5000)', process.execPath, ['server.js'], serverDir, false);

// 2. Start Student Client (:5500)
if (fs.existsSync(clientDir)) {
  if (serveBin) {
    spawnProcess('Student Client (:5500)', process.execPath, [serveBin, 'client', '-p', '5500'], rootDir, false);
  } else {
    spawnProcess('Student Client (:5500)', 'npx', ['--yes', 'serve', 'client', '-p', '5500'], rootDir, true);
  }
} else {
  console.warn('⚠️ [Student Client] Directory not found: client/');
}

// 3. Start Admin Client (:5501)
if (fs.existsSync(adminClientDir)) {
  if (serveBin) {
    spawnProcess('Admin Client (:5501)', process.execPath, [serveBin, 'admin-client', '-p', '5501'], rootDir, false);
  } else {
    spawnProcess('Admin Client (:5501)', 'npx', ['--yes', 'serve', 'admin-client', '-p', '5501'], rootDir, true);
  }
} else {
  console.warn('⚠️ [Admin Client] Directory not found: admin-client/');
}

// Graceful cleanup handler
function cleanup() {
  console.log('\n🛑 Shutting down all services...');
  for (const child of children) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t'], { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
