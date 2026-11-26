const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('videoCleaner', {
  choose: () => ipcRenderer.invoke('choose-video'),
  scan: file => ipcRenderer.invoke('scan-video', file),
  clean: file => ipcRenderer.invoke('clean-video', file),
  show: file => ipcRenderer.invoke('show-file', file),
  onLog: callback => ipcRenderer.on('ffmpeg-log', (_e, text) => callback(text))
});
