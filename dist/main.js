import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentKernel } from './kernel/agent.js';
import { MediatorAgent } from './kernel/mediator.js';
import { runInWasm, initPyodide } from './sandbox/pyodide.js';
import { runInNative } from './sandbox/native.js';
import { CodeActState } from './types.js';
import { readdir, stat, readFile, writeFile } from 'fs/promises';
import os from 'os';
import * as pty from 'node-pty';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kernel = new AgentKernel();
const mediator = new MediatorAgent();
// Warm up pyodide
initPyodide().catch(console.error);
let mainWindow = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#111',
        title: 'CodeACT Loop Visualizer',
        webPreferences: {
            preload: path.join(__dirname, '../public/preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    const indexPath = path.join(__dirname, '../dist/renderer/index.html');
    mainWindow.loadFile(indexPath);
}
app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        app.quit();
});
let currentWorkspace = process.cwd();
ipcMain.handle('get-workspace', () => currentWorkspace);
ipcMain.handle('open-folder', async () => {
    if (!mainWindow)
        return { success: false };
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory'],
        title: 'Open Project Folder'
    });
    if (canceled || filePaths.length === 0)
        return { success: false };
    currentWorkspace = filePaths[0]; // Dynamically switch workspace root
    return { success: true, path: currentWorkspace };
});
ipcMain.handle('read-dir', async (event, dirPath) => {
    try {
        const fullPath = dirPath || currentWorkspace;
        const items = await readdir(fullPath);
        const result = [];
        for (const item of items) {
            if (['node_modules', '.git', 'dist'].includes(item))
                continue;
            const itemPath = path.join(fullPath, item);
            const itemStat = await stat(itemPath).catch(() => null);
            if (!itemStat)
                continue;
            result.push({
                name: item,
                path: itemPath,
                isDirectory: itemStat.isDirectory()
            });
        }
        result.sort((a, b) => {
            if (a.isDirectory && !b.isDirectory)
                return -1;
            if (!a.isDirectory && b.isDirectory)
                return 1;
            return a.name.localeCompare(b.name);
        });
        return { success: true, items: result };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
});
ipcMain.handle('read-file', (event, path) => {
    return readFile(path, 'utf8')
        .then(content => ({ success: true, content }))
        .catch(err => ({ success: false, error: err.message }));
});
ipcMain.handle('write-file', (event, { path, content }) => {
    return writeFile(path, content, 'utf8')
        .then(() => ({ success: true }))
        .catch(err => ({ success: false, error: err.message }));
});
ipcMain.handle('create-file', async (event, path) => {
    try {
        await writeFile(path, '', 'utf8');
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
});
ipcMain.handle('create-folder', async (event, path) => {
    try {
        const { mkdir } = await import('fs/promises');
        await mkdir(path, { recursive: true });
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
});
ipcMain.handle('delete-item', async (event, path) => {
    try {
        const { rm } = await import('fs/promises');
        await rm(path, { recursive: true, force: true });
        return { success: true };
    }
    catch (e) {
        return { success: false, error: e.message };
    }
});
ipcMain.handle('execute-loop', async (event, query) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is not set. The LLM cannot generate the script.");
        }
        // =======================
        // PHASE 2: Mediator Stage
        // =======================
        event.sender.send('llm-token', "=== MEDIATOR PHASE ===\n[+] Writing parser script...\n\n");
        const mediatorScript = await mediator.parseQuery(query, (token) => {
            event.sender.send('llm-token', token);
        });
        event.sender.send('llm-token', "\n\n[+] Running parser in WASM sandbox...\n");
        const mediatorResult = await runInWasm(mediatorScript);
        if (mediatorResult.exit_code !== 0)
            throw new Error(`Mediator parser failed: ${mediatorResult.stderr}`);
        const extractedTokens = mediatorResult.stdout.trim();
        event.sender.send('llm-token', `[+] Extracted JSON Tokens: ${extractedTokens}\n\n=== KERNEL PHASE ===\n[+] Generating logic script...\n\n`);
        // Parse State natively 
        let state = CodeActState.DEBUG_ERROR; // Default fallback
        try {
            const parsed = JSON.parse(extractedTokens);
            if (Object.values(CodeActState).includes(parsed.state)) {
                state = parsed.state;
            }
        }
        catch (e) {
            console.error("Mediator output wasn't valid JSON");
        }
        // =======================
        // PHASE 1: Kernel Stage
        // =======================
        const script = await kernel.generateThoughtScript(state, query, `STRICT EXTRACTED TOKENS (Dictate intent tracking):\n${extractedTokens}`, (token) => {
            event.sender.send('llm-token', token);
        });
        let result;
        if (script.includes('# TIER: NATIVE')) {
            event.sender.send('llm-token', "\n\n[+] Executing Kernel Script natively on local OS...\n");
            const cwd = process.cwd(); // Executing mapped to current dev directory
            result = await runInNative(script, cwd);
        }
        else {
            event.sender.send('llm-token', "\n\n[+] Executing Kernel Script in WASM Sandbox...\n");
            result = await runInWasm(script);
        }
        // =======================
        // PHASE 3: Synthesis Stage
        // =======================
        event.sender.send('llm-token', "\n\n=== SYNTHESIS PHASE ===\n[+] Summarizing findings...\n\n");
        const finalAnswer = await kernel.synthesizeResponse(query, result.stdout || result.stderr);
        return {
            script,
            result,
            finalAnswer,
            execution_time_ms: result.execution_time_ms
        };
    }
    catch (err) {
        return { error: err.message || JSON.stringify(err) };
    }
});
// Terminal PTY Logic
const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
let ptyProcess = null;
ipcMain.on('terminal-input', (event, data) => {
    if (ptyProcess)
        ptyProcess.write(data);
});
ipcMain.handle('spawn-terminal', (event) => {
    if (ptyProcess)
        return;
    ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: currentWorkspace,
        env: process.env
    });
    ptyProcess.onData((data) => {
        if (mainWindow)
            mainWindow.webContents.send('terminal-output', data);
    });
    return { success: true };
});
