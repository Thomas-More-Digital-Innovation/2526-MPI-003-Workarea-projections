// preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addImage: (file, description) => ipcRenderer.invoke('images:addFile', file, description),
  getImages: () => ipcRenderer.invoke('images:getAll'),
  deleteImage: (imageId) => ipcRenderer.invoke('images:delete', imageId)
});