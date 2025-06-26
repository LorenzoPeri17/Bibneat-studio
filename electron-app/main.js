// Electron main process for Bibneat Electron App
// This file will launch the React frontend and set up the Electron window.
// WASM integration and IPC will be added in later steps.

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const http = require('http');

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

function createWindow() {
  const win = new BrowserWindow({
    width: 1450,
    height: 950,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Vite always outputs .js for both dev and production
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Load the Vite dev server in development, or the built index.html in production
  if (!app.isPackaged && process.env.NODE_ENV === 'development') {
    // Development mode - load from Vite dev server
    win.loadURL('http://localhost:5173');
  } else {
    // Production mode - load from built files
    win.loadFile(path.join(__dirname, '..', 'renderer', 'main_window', 'index.html'));
  }
  
  // Create additional resource paths in production mode
  if (process.env.NODE_ENV === 'production') {
    console.log('Setting up WASM paths for production build...');
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
