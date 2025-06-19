// Preload script for Electron (enables secure communication between renderer and main process)
// Extend this file to expose APIs to the renderer via contextBridge if needed.

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('bibneatAPI', {
  // Add methods here for WASM/CLI integration later
});
