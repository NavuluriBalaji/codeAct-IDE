import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentKernel } from './kernel/agent.js';
import { runInWasm, initPyodide } from './sandbox/pyodide.js';
import { CodeActState } from './types.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const kernel = new AgentKernel();
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
    const indexPath = path.join(__dirname, '../public/index.html');
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
ipcMain.handle('execute-loop', async (event, query) => {
    try {
        const state = CodeActState.DEBUG_ERROR; // Hardcoded default routing for Phase 1
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is not set. The LLM cannot generate the script.");
        }
        const script = await kernel.generateThoughtScript(state, query, "", (token) => {
            event.sender.send('llm-token', token);
        });
        const result = await runInWasm(script);
        return { script, result, execution_time_ms: result.execution_time_ms };
    }
    catch (err) {
        return { error: err.message || JSON.stringify(err) };
    }
});
