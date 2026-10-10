const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desk', {
  savePDF: name => ipcRenderer.invoke('save-pdf', name),
  onOpen: cb => ipcRenderer.on('open-file', (e, f) => cb(f))
});
