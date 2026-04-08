import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { AgentKernel } from './kernel/agent.js';
import { MediatorAgent } from './kernel/mediator.js';
import { runInWasm, initPyodide } from './sandbox/pyodide.js';
import { CodeActState } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const kernel = new AgentKernel();
const mediator = new MediatorAgent();
// Warm up pyodide
initPyodide().catch(console.error);

let mainWindow: BrowserWindow | null = null;

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
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('execute-loop', async (event, query: string) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
             throw new Error("GEMINI_API_KEY environment variable is not set. The LLM cannot generate the script.");
        }

        // =======================
        // PHASE 2: Mediator Stage
        // =======================
        event.sender.send('llm-token', "=== MEDIATOR PHASE ===\n[+] Writing parser script...\n\n");
        const mediatorScript = await mediator.parseQuery(query);
        event.sender.send('llm-token', mediatorScript + "\n\n[+] Running parser in WASM sandbox...\n");

        const mediatorResult = await runInWasm(mediatorScript);
        if (mediatorResult.exit_code !== 0) throw new Error(`Mediator parser failed: ${mediatorResult.stderr}`);
        
        const extractedTokens = mediatorResult.stdout.trim();
        event.sender.send('llm-token', `[+] Extracted JSON Tokens: ${extractedTokens}\n\n=== KERNEL PHASE ===\n[+] Generating logic script...\n\n`);

        // Parse State natively 
        let state = CodeActState.DEBUG_ERROR; // Default fallback
        try {
            const parsed = JSON.parse(extractedTokens);
            if (Object.values(CodeActState).includes(parsed.state)) {
                state = parsed.state as CodeActState;
            }
        } catch(e) {
            console.error("Mediator output wasn't valid JSON");
        }

        // =======================
        // PHASE 1: Kernel Stage
        // =======================
        const script = await kernel.generateThoughtScript(state, query, `STRICT EXTRACTED TOKENS (Dictate intent tracking):\n${extractedTokens}`, (token) => {
            event.sender.send('llm-token', token);
        });
        
        event.sender.send('llm-token', "\n\n[+] Executing Kernel Script in Sandbox...\n");
        const result = await runInWasm(script);

        return { script, result, execution_time_ms: result.execution_time_ms };
    } catch (err: any) {
        return { error: err.message || JSON.stringify(err) };
    }
});
