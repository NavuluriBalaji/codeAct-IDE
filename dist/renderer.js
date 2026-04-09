import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
// @ts-ignore
import '@xterm/xterm/css/xterm.css';
const qs = (id) => document.getElementById(id);
const runBtn = qs('runBtn');
const queryInput = qs('queryInput');
const aiScroll = qs('aiScroll');
const statusText = qs('status');
const fileTree = qs('fileTree');
const openFolderBtn = qs('openFolderBtn');
const openFolderMenu = qs('openFolderMenu');
const newFileBtn = qs('newFileBtn');
const newFolderBtn = qs('newFolderBtn');
const tabScroller = document.querySelector('.tab-scroller');
const explorerSection = document.querySelector('.explorer-section');
const sourceControlSection = qs('sourceControlSection');
const gitChanges = qs('gitChanges');
const editorContainer = qs('editorContainer');
const scrollLeft = qs('scrollLeft');
const scrollRight = qs('scrollRight');
const mentionsDropdown = qs('mentionsDropdown');
let openFiles = [];
let workspaceFileCache = [];
let activeFilePath = null;
let activeWorkspacePath = null;
let editor = null;
let currentTraceBox = null;
// Tab Scroll Controls
scrollLeft.addEventListener('click', () => tabScroller.scrollBy({ left: -200, behavior: 'smooth' }));
scrollRight.addEventListener('click', () => tabScroller.scrollBy({ left: 200, behavior: 'smooth' }));
// Resizer logic
function setupResizer(resizerId, targetId, type, isReverse = false) {
    const resizer = qs(resizerId);
    const target = document.querySelector(`.${targetId}`);
    if (!resizer || !target)
        return;
    resizer.addEventListener('mousedown', (e) => {
        e.preventDefault();
        const sPos = type === 'col' ? e.clientX : e.clientY;
        const sSize = type === 'col' ? target.offsetWidth : target.offsetHeight;
        const onMM = (ev) => {
            const cPos = type === 'col' ? ev.clientX : ev.clientY;
            let nSize = isReverse ? sSize + (sPos - cPos) : sSize + (cPos - sPos);
            if (type === 'col') {
                target.style.width = `${nSize}px`;
                target.style.flex = 'none';
            }
            else {
                target.style.height = `${nSize}px`;
            }
        };
        const onMU = () => { document.removeEventListener('mousemove', onMM); document.removeEventListener('mouseup', onMU); };
        document.addEventListener('mousemove', onMM);
        document.addEventListener('mouseup', onMU);
    });
}
setupResizer('sidebarResizer', 'codeic-sidebar', 'col');
setupResizer('aiResizer', 'codeic-ai', 'col', true);
setupResizer('terminalResizer', 'codeic-terminal', 'row', true);
// AI Toggles
const aiPanel = document.querySelector('.codeic-ai');
const aiResizer = qs('aiResizer');
const toggleAiBtn = qs('toggleAiBtn');
const globalAiToggle = qs('globalAiToggle');
let lAiW = 450;
const toggleAi = () => {
    const hid = aiPanel.style.display === 'none';
    if (!hid)
        lAiW = aiPanel.offsetWidth;
    aiPanel.style.display = hid ? 'flex' : 'none';
    aiResizer.style.display = hid ? 'block' : 'none';
    if (hid)
        aiPanel.style.width = `${lAiW}px`;
};
toggleAiBtn.addEventListener('click', toggleAi);
globalAiToggle.addEventListener('click', toggleAi);
// Conversation Threading
function addMessage(role, content) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role === 'user' ? 'user-message' : 'ai-message'}`;
    if (content)
        bubble.innerText = content;
    aiScroll.appendChild(bubble);
    aiScroll.scrollTop = aiScroll.scrollHeight;
    return bubble;
}
// @ Mentions Logic
queryInput.addEventListener('input', () => {
    const val = queryInput.value;
    const cPos = queryInput.selectionStart;
    const lAt = val.lastIndexOf('@', cPos - 1);
    if (lAt !== -1 && !val.slice(lAt, cPos).includes(' ')) {
        showMentions(val.slice(lAt + 1, cPos).toLowerCase());
    }
    else {
        mentionsDropdown.style.display = 'none';
    }
});
function showMentions(q) {
    mentionsDropdown.innerHTML = '';
    const m = workspaceFileCache.filter(f => f.name.toLowerCase().includes(q)).slice(0, 10);
    if (m.length > 0) {
        m.forEach(f => {
            const r = document.createElement('div');
            r.className = 'mention-row';
            r.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><span>${f.name}</span>`;
            r.addEventListener('click', () => {
                const v = queryInput.value;
                const pos = queryInput.selectionStart;
                const lat = v.lastIndexOf('@', pos - 1);
                queryInput.value = v.slice(0, lat) + `@${f.name} ` + v.slice(pos);
                mentionsDropdown.style.display = 'none';
                queryInput.focus();
            });
            mentionsDropdown.appendChild(r);
        });
        mentionsDropdown.style.display = 'block';
    }
    else {
        mentionsDropdown.style.display = 'none';
    }
}
queryInput.addEventListener('dragover', (e) => { e.preventDefault(); queryInput.style.borderColor = '#BAFF39'; });
queryInput.addEventListener('dragleave', () => { queryInput.style.borderColor = '#222'; });
queryInput.addEventListener('drop', (e) => {
    e.preventDefault();
    queryInput.style.borderColor = '#222';
    const path = e.dataTransfer?.getData('text/plain');
    if (path) {
        queryInput.value += ` @${path.split(/[\\/]/).pop()} `;
    }
});
const handleOpenFolder = async () => {
    // @ts-ignore
    const res = await window.codeactAPI.openFolder();
    if (res.success)
        initWorkspace();
};
openFolderBtn.addEventListener('click', handleOpenFolder);
openFolderMenu.addEventListener('click', handleOpenFolder);
async function initWorkspace() {
    // @ts-ignore
    activeWorkspacePath = await window.codeactAPI.getWorkspace();
    fileTree.innerHTML = '';
    workspaceFileCache = [];
    if (activeWorkspacePath) {
        await renderFolder(activeWorkspacePath, fileTree);
        updateGitStatus();
    }
}
async function renderFolder(path, parent, depth = 0) {
    // @ts-ignore
    const res = await window.codeactAPI.readDir(path);
    if (!res.success)
        return;
    for (const item of res.items) {
        if (!item.isDirectory)
            workspaceFileCache.push({ name: item.name, path: item.path });
        const cont = document.createElement('div');
        cont.className = 'item-container';
        const el = document.createElement('div');
        el.className = 'file-item';
        el.draggable = true;
        el.addEventListener('dragstart', (e) => { e.dataTransfer?.setData('text/plain', item.path); });
        el.style.paddingLeft = `${20 + (depth * 15)}px`;
        const ic = item.isDirectory ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z"/></svg>` : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
        el.innerHTML = `${ic}<span>${item.name}</span>`;
        cont.appendChild(el);
        const sub = document.createElement('div');
        sub.className = 'sub-folder';
        sub.style.display = 'none';
        cont.appendChild(sub);
        el.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (item.isDirectory) {
                if (sub.innerHTML === '')
                    await renderFolder(item.path, sub, depth + 1);
                sub.style.display = sub.style.display === 'none' ? 'block' : 'none';
            }
            else {
                addTab(item.path, item.name);
            }
        });
        el.addEventListener('contextmenu', async (e) => {
            e.preventDefault();
            if (confirm(`Delete ${item.name}?`)) { // @ts-ignore
                const r = await window.codeactAPI.deleteItem(item.path);
                if (r.success) {
                    closeTab(item.path);
                    initWorkspace();
                }
            }
        });
        parent.appendChild(cont);
    }
}
function updateTabUI() {
    tabScroller.innerHTML = '';
    openFiles.forEach(f => {
        const t = document.createElement('div');
        t.className = `codeic-tab ${f.path === activeFilePath ? 'active' : ''}`;
        t.id = `tab-${btoa(f.path).replace(/=/g, '')}`;
        t.innerHTML = `<span>${f.name}</span><span class="close-tab">×</span>`;
        t.addEventListener('click', () => { if (activeFilePath !== f.path)
            openFile(f.path); });
        t.querySelector('.close-tab')?.addEventListener('click', (e) => { e.stopPropagation(); closeTab(f.path); });
        tabScroller.appendChild(t);
    });
}
function addTab(p, n) { if (!openFiles.find(f => f.path === p))
    openFiles.push({ path: p, name: n }); openFile(p); }
function closeTab(p) {
    const idx = openFiles.findIndex(f => f.path === p);
    if (idx === -1)
        return;
    openFiles.splice(idx, 1);
    if (activeFilePath === p) {
        if (openFiles.length > 0)
            openFile(openFiles[Math.max(0, idx - 1)].path);
        else {
            activeFilePath = null;
            if (editor)
                editor.destroy();
            editorContainer.innerHTML = '<div style="text-align:center; padding-top:100px; color:#444;">Select a file to begin</div>';
        }
    }
    updateTabUI();
}
async function openFile(p) {
    if (activeFilePath && editor) {
        const cf = openFiles.find(f => f.path === activeFilePath);
        if (cf)
            cf.state = editor.state;
    }
    activeFilePath = p;
    updateTabUI();
    setTimeout(() => { const tid = `tab-${btoa(p).replace(/=/g, '')}`; const tel = document.getElementById(tid); if (tel)
        tel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }, 50);
    const file = openFiles.find(f => f.path === p);
    if (!file)
        return;
    if (editor)
        editor.destroy();
    editorContainer.innerHTML = '';
    if (file.state) {
        editor = new EditorView({ state: file.state, parent: editorContainer });
        return;
    }
    // @ts-ignore
    const res = await window.codeactAPI.readFile(p);
    if (!res.success)
        return;
    const ext = p.split('.').pop();
    const lang = ext === 'py' ? python() : javascript();
    file.state = EditorState.create({ doc: res.content, extensions: [basicSetup, lang, oneDark, EditorView.lineWrapping] });
    editor = new EditorView({ state: file.state, parent: editorContainer });
}
async function saveFile() {
    if (!activeFilePath || !editor)
        return;
    const c = editor.state.doc.toString();
    statusText.innerText = "Saving...";
    // @ts-ignore
    const r = await window.codeactAPI.writeFile(activeFilePath, c);
    if (r.success) {
        statusText.innerText = "File Saved";
        setTimeout(() => { statusText.innerText = "Ready"; }, 2000);
    }
}
window.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveFile();
} });
async function updateGitStatus() {
    gitChanges.innerHTML = '<div style="padding:10px; font-size:12px; color:#666;">Scanning repository...</div>';
    // @ts-ignore
    await window.codeactAPI.executeLoop("Run 'git status --short' and return the list of files");
}
const tc = qs('terminalContainer');
const trm = new Terminal({ theme: { background: '#000', foreground: '#ccc', cursor: '#BAFF39' }, fontSize: 13, fontFamily: 'JetBrains Mono, monospace' });
const fi = new FitAddon();
trm.loadAddon(fi);
trm.open(tc);
fi.fit();
// @ts-ignore
window.codeactAPI.spawnTerminal();
trm.onData(d => {
    window.codeactAPI.terminalInput(d);
});
// @ts-ignore
window.codeactAPI.onTerminalOutput(d => trm.write(d));
window.addEventListener('resize', () => fi.fit());
const sT = document.querySelectorAll('.sidebar-tab');
sT.forEach((tab, index) => {
    tab.addEventListener('click', () => {
        const act = tab.classList.contains('active');
        const side = document.querySelector('.codeic-sidebar');
        const res = qs('sidebarResizer');
        if (act) {
            const hid = side.style.display === 'none';
            side.style.display = hid ? 'flex' : 'none';
            res.style.display = hid ? 'block' : 'none';
            if (hid)
                tab.classList.add('active');
            else
                tab.classList.remove('active');
        }
        else {
            sT.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            side.style.display = 'flex';
            res.style.display = 'block';
            if (index === 0) {
                explorerSection.style.display = 'block';
                sourceControlSection.style.display = 'none';
            }
            else if (index === 1) {
                explorerSection.style.display = 'none';
                sourceControlSection.style.display = 'block';
                updateGitStatus();
            }
        }
    });
});
initWorkspace();
// @ts-ignore
window.codeactAPI.onToken((t) => {
    if (currentTraceBox) {
        currentTraceBox.innerText += t;
        aiScroll.scrollTop = aiScroll.scrollHeight;
    }
});
runBtn.addEventListener('click', async () => {
    const query = queryInput.value.trim();
    if (!query)
        return;
    // 1. User Message
    addMessage('user', query);
    queryInput.value = "";
    // 2. Prepare AI Container
    const aiResp = addMessage('ai');
    aiResp.innerHTML = `<div class="final-answer">Thinking...</div>`;
    currentTraceBox = document.createElement('div');
    currentTraceBox.className = 'trace-box';
    aiResp.appendChild(currentTraceBox);
    statusText.innerText = "Executing thought loop...";
    runBtn.disabled = true;
    try {
        // @ts-ignore
        const resp = await window.codeactAPI.executeLoop(query);
        if (resp.error) {
            aiResp.querySelector('.final-answer').innerHTML = `<span style="color:#ff5555">Error: ${resp.error}</span>`;
        }
        else {
            aiResp.querySelector('.final-answer').innerText = resp.finalAnswer || "Analysis complete.";
            statusText.innerText = `Complete ${resp.execution_time_ms}ms`;
        }
    }
    catch (err) {
        aiResp.querySelector('.final-answer').innerHTML = `<span style="color:#ff5555">Host Failure: ${err.message}</span>`;
    }
    finally {
        runBtn.disabled = false;
        currentTraceBox = null;
    }
});
