import { contextBridge, ipcRenderer } from 'electron';
contextBridge.exposeInMainWorld('codeactAPI', {
    executeLoop: (query) => ipcRenderer.invoke('execute-loop', query)
});
