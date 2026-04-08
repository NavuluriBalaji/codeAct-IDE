const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codeactAPI', {
    executeLoop: (query) => ipcRenderer.invoke('execute-loop', query),
    onToken: (callback) => ipcRenderer.on('llm-token', (_event, value) => callback(value))
});
