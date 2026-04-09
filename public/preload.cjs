const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codeactAPI', {
    executeLoop: (query) => ipcRenderer.invoke('execute-loop', query),
    getWorkspace: () => ipcRenderer.invoke('get-workspace'),
    openFolder: () => ipcRenderer.invoke('open-folder'),
    readDir: (path) => ipcRenderer.invoke('read-dir', path),
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    onToken: (callback) => ipcRenderer.on('llm-token', (_event, value) => callback(value))
});
