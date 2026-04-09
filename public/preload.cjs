const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('codeactAPI', {
    executeLoop: (query) => ipcRenderer.invoke('execute-loop', query),
    getWorkspace: () => ipcRenderer.invoke('get-workspace'),
    openFolder: () => ipcRenderer.invoke('open-folder'),
    readDir: (path) => ipcRenderer.invoke('read-dir', path),
    readFile: (path) => ipcRenderer.invoke('read-file', path),
    writeFile: (path, content) => ipcRenderer.invoke('write-file', { path, content }),
    createFile: (path) => ipcRenderer.invoke('create-file', path),
    createFolder: (path) => ipcRenderer.invoke('create-folder', path),
    deleteItem: (path) => ipcRenderer.invoke('delete-item', path),
    spawnTerminal: () => ipcRenderer.invoke('spawn-terminal'),
    terminalInput: (data) => ipcRenderer.send('terminal-input', data),
    onTerminalOutput: (callback) => ipcRenderer.on('terminal-output', (_event, value) => callback(value)),
    onToken: (callback) => ipcRenderer.on('llm-token', (_event, value) => callback(value))
});
