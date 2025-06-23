// Electron main process for Bibneat Electron App
// This file will launch the React frontend and set up the Electron window.
// WASM integration and IPC will be added in later steps.

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

// Register proxy-fetch handler at the top level
ipcMain.handle('proxy-fetch', async (event, url, options = {}) => {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1250,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // Use CommonJS preload
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the Vite dev server in development, or the built index.html in production
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
