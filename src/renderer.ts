import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

const qs = (id: string) => document.getElementById(id) as HTMLElement;
const runBtn = qs('runBtn') as HTMLButtonElement;
const queryInput = qs('queryInput') as HTMLTextAreaElement;
const scriptOutput = qs('scriptOutput');
const resultOutput = qs('resultOutput');
const statusText = qs('status');
const fileTree = qs('fileTree');
const openFolderBtn = qs('openFolderBtn');

openFolderBtn.addEventListener('click', async () => {
    // @ts-ignore
    const res = await window.codeactAPI.openFolder();
    if (res.success) {
        renderExploreTree(); // Auto refresh tree
    }
});

// @ts-ignore
async function renderExploreTree() {
    // @ts-ignore
    const ws = await window.codeactAPI.getWorkspace();
    // @ts-ignore
    const res = await window.codeactAPI.readDir(ws);
    
    if (!res.success) {
        fileTree.innerHTML = `<div style="color:red; padding:10px;">Failed to load workspace</div>`;
        return;
    }
    
    fileTree.innerHTML = '';
    const rootHeader = document.createElement('div');
    rootHeader.className = 'workspace-root';
    rootHeader.innerHTML = `
        <div class="ws-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" style="margin-left:-4px"><path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/></svg>
            <span style="text-transform:uppercase">${ws.split(/[\\/]/).pop()}</span>
        </div>
        <div class="ws-actions">
            <!-- New File -->
            <svg id="newFileBtn" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2zM8.5 7v1.5H10a.5.5 0 0 1 0 1H8.5V11a.5.5 0 0 1-1 0V9.5H6a.5.5 0 0 1 0-1h1.5V7a.5.5 0 0 1 1 0z"/></svg>
            <!-- New Folder -->
            <svg id="newFolderBtn" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M9.828 3h3.982a2 2 0 0 1 1.992 2.181l-.637 7A2 2 0 0 1 13.174 14H2.826a2 2 0 0 1-1.991-1.819l-.637-7a1.99 1.99 0 0 1 .342-1.31L.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3zm-8.322.12C1.72 3.042 1.95 3 2.19 3h5.396l-.707-.707A1 1 0 0 0 6.172 2H2.5a1 1 0 0 0-1 .981l.006.139zM13.174 13a1 1 0 0 0 .996-.91l.636-7A1 1 0 0 0 13.81 4H2.19a1 1 0 0 0-.996 1.09l.636 7a1 1 0 0 0 .996.91h10.348zM8.5 6v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 1 0z"/></svg>
            <!-- Refresh -->
            <svg id="refreshBtn" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/><path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/></svg>
            <!-- Collapse All -->
            <svg id="collapseBtn" width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M2.5 4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0 8a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/></svg>
        </div>
    `;
    fileTree.appendChild(rootHeader);

    // Attach click openFolder logic to the entire ws-title bar since we removed the top button
    const titleArea = rootHeader.querySelector('.ws-title');
    titleArea?.addEventListener('click', async () => {
        // @ts-ignore
        const res = await window.codeactAPI.openFolder();
        if (res?.success) renderExploreTree();
    });

    for (const item of res.items) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = item.isDirectory ? `
            <svg style="width:14px; margin-right:5px; vertical-align:middle; color:#DCB67A;" viewBox="0 0 16 16" fill="currentColor"><path d="M14 4H8.414l-1.707-1.707A1 1 0 0 0 6 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z"/></svg> ${item.name}
        ` : `
            <svg style="width:14px; margin-right:5px; vertical-align:middle; color:#519ABA;" viewBox="0 0 16 16" fill="currentColor"><path d="M4 2v12h8V6.828L7.172 2H4z"/></svg> ${item.name}
        `;
        
        div.addEventListener('click', () => {
            if (!item.isDirectory) {
                openFile(item.path);
            }
        });

        fileTree.appendChild(div);
    }
}

let editor: EditorView | null = null;
const editorContainer = qs('editorContainer');

async function openFile(path: string) {
    // @ts-ignore
    const res = await window.codeactAPI.readFile(path);
    if (!res.success) {
        alert("Failed to read file: " + res.error);
        return;
    }

    const extension = path.split('.').pop();
    const language = extension === 'py' ? python() : javascript();

    if (editor) {
        editor.destroy();
    }

    editorContainer.innerHTML = '';
    
    editor = new EditorView({
        doc: res.content,
        extensions: [
            basicSetup,
            language,
            oneDark,
            EditorView.lineWrapping
        ],
        parent: editorContainer
    });

    // Update tab
    const tab = qs('currentTab');
    tab.innerText = path.split(/[\\/]/).pop() || '';
}

// On load
renderExploreTree();

// @ts-ignore
window.codeactAPI.onToken((token) => {
    scriptOutput.innerText += token;
    scriptOutput.scrollTop = scriptOutput.scrollHeight;
});

runBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query) return;

    statusText.innerText = "Generating PoT Script...";
    scriptOutput.innerText = "";
    resultOutput.innerText = "";
    runBtn.disabled = true;

    try {
        // @ts-ignore
        const response = await window.codeactAPI.executeLoop(query);
        
        if (response.error) {
            statusText.innerText = "Error!";
            scriptOutput.innerText = response.script || scriptOutput.innerText || "Failed getting LLM output";
            resultOutput.innerText = `Error:\n${response.error}`;
        } else {
            // We intentionally do NOT overwrite scriptOutput here so you can see the full trace history!
            let finalOutput = response.result.stdout || "";
            if (response.result.stderr) {
                finalOutput += `\n[STDERR]\n${response.result.stderr}`;
            }
            if (!finalOutput) finalOutput = "No text output generated.";

            statusText.innerText = `Done! Execution latency: ${response.execution_time_ms}ms (Exit: ${response.result.exit_code})`;
            resultOutput.innerText = finalOutput;
        }
    } catch (err: any) {
        statusText.innerText = "Fatal Failure";
        resultOutput.innerText = err.message;
    } finally {
        runBtn.disabled = false;
    }
});
