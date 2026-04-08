import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('codeactAPI', {
    executeLoop: (query: string) => ipcRenderer.invoke('execute-loop', query)
});
