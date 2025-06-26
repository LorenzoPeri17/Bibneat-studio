// Preload script for Electron (enables secure communication between renderer and main process)
// Extend this file to expose APIs to the renderer via contextBridge if needed.

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('bibneatAPI', {
  // Add methods here for WASM/CLI integration later
});

contextBridge.exposeInMainWorld('electronAPI', {
  proxyFetch: (url, options) => ipcRenderer.invoke('proxy-fetch', url, options)
});
