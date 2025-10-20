// preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Image functies
  addImage: (file, description) => ipcRenderer.invoke('images:addFile', file, description),
  getImages: () => ipcRenderer.invoke('images:getAll'),
  deleteImage: (imageId) => ipcRenderer.invoke('images:delete', imageId),
  
  // Preset functies
  addPreset: (preset) => ipcRenderer.invoke('add-preset', preset),
  getPresets: () => ipcRenderer.invoke('get-presets'),
});