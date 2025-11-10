// preload.cjs
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Image functies
  addImage: (file, description) => ipcRenderer.invoke('images:addFile', file, description),
  getImages: () => ipcRenderer.invoke('images:getAll'),
  deleteImage: (imageId) => ipcRenderer.invoke('images:delete', imageId),
  
  // Preset functies
  addPreset: (preset) => ipcRenderer.invoke('preset:add', preset),
  getPresets: () => ipcRenderer.invoke('preset:getAll'),
  updatePreset: (preset) => ipcRenderer.invoke('preset:update', preset),
  deletePreset: (presetId) => ipcRenderer.invoke('preset:delete', presetId),
  
  // GridLayout functies
  addGridLayout: (gridLayout) => ipcRenderer.invoke('gridlayout:add', gridLayout),
  getGridLayouts: () => ipcRenderer.invoke('gridlayout:getAll'),
  updateGridLayout: (gridLayout) => ipcRenderer.invoke('gridlayout:update', gridLayout),
  deleteGridLayout: (gridLayoutId) => ipcRenderer.invoke('gridlayout:delete', gridLayoutId),
  
  // Step functies
  addStep: (step) => ipcRenderer.invoke('step:add', step),
  getSteps: () => ipcRenderer.invoke('step:getAll'),
  getStepsByPreset: (presetId) => ipcRenderer.invoke('step:getByPreset', presetId),
  updateStep: (step) => ipcRenderer.invoke('step:update', step),
  deleteStep: (stepId) => ipcRenderer.invoke('step:delete', stepId),
  
  // Combined query for presets with gridlayouts
  getPresetsWithGridLayouts: () => ipcRenderer.invoke('preset:getWithGridLayouts'),

  //Export/import
  exportData: () => ipcRenderer.invoke('data:export'),
  importData: () => ipcRenderer.invoke('data:import'),
});
