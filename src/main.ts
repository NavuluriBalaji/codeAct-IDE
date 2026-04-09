import 'dotenv/config';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentKernel } from './kernel/agent.js';
import { MediatorAgent } from './kernel/mediator.js';
import { runInWasm, initPyodide } from './sandbox/pyodide.js';
import { runInNative } from './sandbox/native.js';
import { CodeActState } from './types.js';
import { SemanticMemory } from './kernel/memory.js';
import { readdir, stat, readFile, writeFile } from 'fs/promises';
import os from 'os';
import * as pty from 'node-pty';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kernel = new AgentKernel();
const mediator = new MediatorAgent();
initPyodide().catch(console.error);

let mainWindow: BrowserWindow | null = null;
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#000',
        title: 'CodeACT IDE',
        frame: true,
        webPreferences: {
            preload: path.join(__dirname, '../public/preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    mainWindow.setMenuBarVisibility(false);
    mainWindow.loadFile(path.join(__dirname, '../dist/renderer/index.html'));
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

let currentWorkspace = process.cwd();
ipcMain.handle('get-workspace', () => currentWorkspace);

ipcMain.handle('open-folder', async () => {
    if (!mainWindow) return { success: false };
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (!canceled) { currentWorkspace = filePaths[0]; return { success: true }; }
    return { success: false };
});

ipcMain.handle('read-dir', async (ev, p) => {
    try {
        const files = await readdir(p);
        const items = await Promise.all(files.map(async f => {
            const fp = path.join(p, f);
            const s = await stat(fp);
            return { name: f, path: fp, isDirectory: s.isDirectory() };
        }));
        return { success: true, items };
    } catch { return { success: false, items: [] }; }
});

ipcMain.handle('read-file', async (ev, p) => {
    try {
        const content = await readFile(p, 'utf8');
        return { success: true, content };
    } catch { return { success: false }; }
});

ipcMain.handle('write-file', async (ev, p, c) => {
    try {
        await writeFile(p, c, 'utf8');
        return { success: true };
    } catch { return { success: false }; }
});

ipcMain.handle('delete-item', async (ev, p) => {
    try {
        // Simple mock for safety
        return { success: true };
    } catch { return { success: false}; }
});

ipcMain.handle('execute-loop', async (event, query, context) => {
    try {
        const memory = new SemanticMemory(currentWorkspace);
        await memory.load();

        // PHASE 1: Mediator
        event.sender.send('llm-token', "=== MEDIATOR PHASE ===\n[+] Determining intent...\n\n");
        const mediatorScript = await mediator.parseQuery(query, (t) => event.sender.send('llm-token', t));
        const medResult = await runInWasm(mediatorScript);
        if (medResult.exit_code !== 0) throw new Error("Mediator failed");

        let state = CodeActState.DEBUG_ERROR;
        try { state = JSON.parse(medResult.stdout).state as CodeActState; } catch {}

        // PHASE 2: Kernel
        event.sender.send('llm-token', "\n\n=== KERNEL PHASE ===\n[+] Checking Action Library...\n");
        const actionLibrary = memory.getAllScripts();
        
        const script = await kernel.generateThoughtScript(
            state, 
            query, 
            context, 
            actionLibrary,
            (t) => event.sender.send('llm-token', t)
        );

        // PHASE 3: Execution
        let result;
        if (script.includes('# TIER: NATIVE')) {
            event.sender.send('llm-token', "\n\n[+] Executing Kernel Script natively...\n");
            result = await runInNative(script, currentWorkspace);
        } else {
            event.sender.send('llm-token', "\n\n[+] Executing Kernel Script in WASM Sandbox...\n");
            result = await runInWasm(script);
        }

        // PHASE 4: Synthesis & Learning
        event.sender.send('llm-token', "\n\n=== SYNTHESIS PHASE ===\n[+] Summarizing & Updating Library...\n\n");
        const finalAnswer = await kernel.synthesizeResponse(query, result.stdout || result.stderr);

        if (result.exit_code === 0) {
            memory.addScript({ intent: query, script, language: 'python', reliability_score: 1.0 });
            await memory.save();
        }

        return { script, result, finalAnswer, execution_time_ms: result.execution_time_ms };
    } catch (err: any) { return { error: err.message }; }
});

const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
let ptyProcess: pty.IPty | null = null;
ipcMain.handle('spawn-terminal', (ev) => {
    if (ptyProcess) return;
    ptyProcess = pty.spawn(shell, [], { name: 'xterm-color', cols: 80, rows: 24, cwd: currentWorkspace, env: process.env as any });
    ptyProcess.onData(data => mainWindow?.webContents.send('terminal-output', data));
});
ipcMain.on('terminal-input', (ev, data) => ptyProcess?.write(data));
