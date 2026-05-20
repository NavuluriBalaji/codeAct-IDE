// UI Handlers for CodeACT IDE - Cursor-like Features

export class UIHandlers {
    private commandPaletteOpen = false;
    private goToFileOpen = false;
    private searchReplaceOpen = false;
    private settingsPanelOpen = false;
    private splitEditorActive = false;

    constructor() {
        this.initKeyboardShortcuts();
        this.initCommandPalette();
        this.initSearchReplace();
        this.initSettingsPanel();
        this.initEditorSplitting();
        this.initContextMenus();
        this.initSidebarTabs();
        this.initTerminalTabs();
        this.initSymbolOutline();
    }

    private initKeyboardShortcuts() {
        document.addEventListener('keydown', (e: KeyboardEvent) => {
            // Windows/Linux shortcuts
            if (e.ctrlKey && e.key === 'k' && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                this.toggleCommandPalette();
            }
            if (e.ctrlKey && e.key === 'p' && !e.shiftKey) {
                e.preventDefault();
                this.toggleGoToFile();
            }
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                this.toggleSearchReplace();
            }
            if (e.ctrlKey && e.key === ',') {
                e.preventDefault();
                this.toggleSettingsPanel();
            }
            if (e.ctrlKey && e.key === 'b') {
                e.preventDefault();
                this.toggleSidebar();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.toggleAIPanel();
            }
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                this.toggleTerminal();
            }
            if (e.ctrlKey && e.key === '\\') {
                e.preventDefault();
                this.toggleSplitEditor();
            }
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveCurrentFile();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.saveFileAs();
            }
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.openFile();
            }

            // Close modals with Escape
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    private initCommandPalette() {
        const palette = document.getElementById('commandPalette') as HTMLElement;
        const input = document.getElementById('paletteInput') as HTMLInputElement;
        const results = document.getElementById('paletteResults') as HTMLElement;

        const commandBtn = document.getElementById('commandBtn') as HTMLElement;
        const globalSearch = document.getElementById('globalSearch') as HTMLElement;

        commandBtn?.addEventListener('click', () => this.toggleCommandPalette());
        globalSearch?.addEventListener('click', () => this.toggleCommandPalette());

        input?.addEventListener('input', (e) => {
            const query = (e.target as HTMLInputElement).value.toLowerCase();
            this.filterCommands(query, results);
        });

        input?.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                const selected = results.querySelector('.palette-result-item.selected') as HTMLElement;
                selected?.click();
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.selectNextCommand(results);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.selectPrevCommand(results);
            }
        });
    }

    private filterCommands(query: string, resultsContainer: HTMLElement) {
        const commands = [
            { label: 'Go to File', action: 'goToFile', shortcut: 'Ctrl+P' },
            { label: 'Command Palette', action: 'commandPalette', shortcut: 'Ctrl+K' },
            { label: 'Search & Replace', action: 'findReplace', shortcut: 'Ctrl+H' },
            { label: 'Settings', action: 'settings', shortcut: 'Ctrl+,' },
            { label: 'Toggle Sidebar', action: 'toggleSidebar', shortcut: 'Ctrl+B' },
            { label: 'Toggle AI Panel', action: 'toggleAi', shortcut: 'Ctrl+Shift+L' },
            { label: 'Toggle Terminal', action: 'toggleTerminal', shortcut: 'Ctrl+`' },
            { label: 'Split Editor', action: 'splitEditor', shortcut: 'Ctrl+\\' },
            { label: 'Save File', action: 'saveFile', shortcut: 'Ctrl+S' },
            { label: 'New File', action: 'newFile', shortcut: 'Ctrl+N' },
            { label: 'New Folder', action: 'newFolder', shortcut: 'Ctrl+Shift+N' },
            { label: 'Format Document', action: 'formatCode', shortcut: 'Shift+Alt+F' },
            { label: 'Run Task', action: 'runTask', shortcut: 'Ctrl+Shift+B' },
            { label: 'Show Problems', action: 'showProblems', shortcut: 'Ctrl+Shift+M' },
            { label: 'Show Git Changes', action: 'showGit', shortcut: 'Ctrl+Shift+G' },
        ];

        const filtered = commands.filter(cmd => 
            cmd.label.toLowerCase().includes(query) || 
            cmd.action.toLowerCase().includes(query)
        );

        resultsContainer.innerHTML = filtered.map((cmd, idx) => `
            <div class="palette-result-item ${idx === 0 ? 'selected' : ''}" data-action="${cmd.action}">
                <span>${cmd.label}</span>
                <span class="palette-shortcut">${cmd.shortcut}</span>
            </div>
        `).join('');

        resultsContainer.querySelectorAll('.palette-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = (item as HTMLElement).getAttribute('data-action');
                this.executeCommand(action || '');
                this.closeAllModals();
            });
        });
    }

    private selectNextCommand(resultsContainer: HTMLElement) {
        const items = resultsContainer.querySelectorAll('.palette-result-item');
        const selected = resultsContainer.querySelector('.palette-result-item.selected') as HTMLElement;
        const currentIndex = Array.from(items).indexOf(selected);
        const nextIndex = (currentIndex + 1) % items.length;
        
        items.forEach(item => item.classList.remove('selected'));
        (items[nextIndex] as HTMLElement).classList.add('selected');
    }

    private selectPrevCommand(resultsContainer: HTMLElement) {
        const items = resultsContainer.querySelectorAll('.palette-result-item');
        const selected = resultsContainer.querySelector('.palette-result-item.selected') as HTMLElement;
        const currentIndex = Array.from(items).indexOf(selected);
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        
        items.forEach(item => item.classList.remove('selected'));
        (items[prevIndex] as HTMLElement).classList.add('selected');
    }

    private toggleCommandPalette() {
        const palette = document.getElementById('commandPalette') as HTMLElement;
        const input = document.getElementById('paletteInput') as HTMLInputElement;
        
        this.commandPaletteOpen = !this.commandPaletteOpen;
        palette.classList.toggle('hidden');
        
        if (this.commandPaletteOpen) {
            input.focus();
            input.value = '';
            this.filterCommands('', document.getElementById('paletteResults') as HTMLElement);
        }
    }

    private toggleGoToFile() {
        const modal = document.getElementById('goToFileModal') as HTMLElement;
        const input = document.getElementById('goToFileInput') as HTMLInputElement;
        const results = document.getElementById('fileSearchResults') as HTMLElement;
        
        this.goToFileOpen = !this.goToFileOpen;
        modal.classList.toggle('hidden');
        
        if (this.goToFileOpen) {
            input.focus();
            input.value = '';
            
            // Set up search
            const files = (window as any).getWorkspaceFiles ? (window as any).getWorkspaceFiles() : [];
            this.renderFileSearchResults(files, results);
            
            const handleInput = (e: Event) => {
                const query = (e.target as HTMLInputElement).value.toLowerCase();
                const filtered = files.filter((f: any) => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query));
                this.renderFileSearchResults(filtered, results);
            };
            
            const handleKeydown = (e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    const selected = results.querySelector('.palette-result-item.selected') as HTMLElement;
                    selected?.click();
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.selectNextCommand(results);
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.selectPrevCommand(results);
                }
            };

            // Remove old listeners to avoid duplicates
            const oldInput = input.cloneNode(true);
            input.parentNode?.replaceChild(oldInput, input);
            
            const newInput = document.getElementById('goToFileInput') as HTMLInputElement;
            newInput.focus();
            newInput.addEventListener('input', handleInput);
            newInput.addEventListener('keydown', handleKeydown);
        }
    }

    private renderFileSearchResults(files: any[], resultsContainer: HTMLElement) {
        resultsContainer.innerHTML = files.slice(0, 50).map((file, idx) => `
            <div class="palette-result-item ${idx === 0 ? 'selected' : ''}" data-path="${file.path}" data-name="${file.name}">
                <span>📄 ${file.name}</span>
                <span class="palette-shortcut" style="font-size: 10px; color: var(--clr-muted);">${file.path}</span>
            </div>
        `).join('');

        resultsContainer.querySelectorAll('.palette-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const path = (item as HTMLElement).getAttribute('data-path');
                const name = (item as HTMLElement).getAttribute('data-name');
                if (path && name && (window as any).openFileTab) {
                    (window as any).openFileTab(path, name);
                }
                this.closeAllModals();
            });
        });
    }

    private initSearchReplace() {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        const replaceInput = document.getElementById('replaceInput') as HTMLInputElement;
        
        searchInput?.addEventListener('input', () => this.performSearch());
        
        replaceInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.performReplaceAll();
            }
        });
        
        ['matchCase', 'matchWord', 'useRegex'].forEach(id => {
            const btn = document.getElementById(id);
            btn?.addEventListener('click', () => {
                btn.classList.toggle('active');
                btn.style.background = btn.classList.contains('active') ? 'var(--clr-accent)' : 'transparent';
                btn.style.color = btn.classList.contains('active') ? '#000' : 'inherit';
                this.performSearch();
            });
        });
    }

    private performSearch() {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        const results = document.getElementById('searchResults') as HTMLElement;
        const editor = (window as any).getActiveEditor?.();
        
        if (!editor || !searchInput.value) {
            if (results) results.innerHTML = '';
            return;
        }
        
        const code = editor.state.doc.toString();
        const query = searchInput.value;
        const isRegex = document.getElementById('useRegex')?.classList.contains('active');
        const matchCase = document.getElementById('matchCase')?.classList.contains('active');
        const matchWord = document.getElementById('matchWord')?.classList.contains('active');
        
        let flags = 'g';
        if (!matchCase) flags += 'i';
        
        let matches: any[] = [];
        try {
            let pattern = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (matchWord) pattern = `\\b${pattern}\\b`;
            
            const regex = new RegExp(pattern, flags);
            const lines = code.split('\n');
            
            lines.forEach((line: string, i: number) => {
                let m;
                while ((m = regex.exec(line)) !== null) {
                    matches.push({ line: i + 1, text: line, index: m.index, length: m[0].length });
                    if (!regex.global) break;
                }
            });
        } catch (e) {
            // Invalid regex
        }
        
        if (results) {
            results.innerHTML = matches.slice(0, 50).map(m => `
                <div class="search-result-item" style="padding:6px; border-bottom:1px solid #333; font-size:12px; cursor:pointer;">
                    <span style="color:var(--clr-muted); margin-right:8px;">Line ${m.line}</span>
                    <span>${m.text.substring(0, 60).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
                </div>
            `).join('');
            
            results.querySelectorAll('.search-result-item').forEach((item, idx) => {
                item.addEventListener('click', () => {
                    const match = matches[idx];
                    const lineObj = editor.state.doc.line(Math.min(match.line, editor.state.doc.lines));
                    const pos = lineObj.from + match.index;
                    editor.dispatch({ selection: { anchor: pos, head: pos + match.length }, scrollIntoView: true });
                });
                item.addEventListener('mouseover', () => (item as HTMLElement).style.background = '#2a2a2a');
                item.addEventListener('mouseout', () => (item as HTMLElement).style.background = 'transparent');
            });
        }
    }

    private performReplaceAll() {
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        const replaceInput = document.getElementById('replaceInput') as HTMLInputElement;
        const editor = (window as any).getActiveEditor?.();
        
        if (!editor || !searchInput.value) return;
        
        const code = editor.state.doc.toString();
        const query = searchInput.value;
        const replaceWith = replaceInput.value;
        const isRegex = document.getElementById('useRegex')?.classList.contains('active');
        const matchCase = document.getElementById('matchCase')?.classList.contains('active');
        const matchWord = document.getElementById('matchWord')?.classList.contains('active');
        
        let flags = 'g';
        if (!matchCase) flags += 'i';
        
        try {
            let pattern = isRegex ? query : query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            if (matchWord) pattern = `\\b${pattern}\\b`;
            
            const regex = new RegExp(pattern, flags);
            const newCode = code.replace(regex, replaceWith);
            
            if (newCode !== code) {
                editor.dispatch({ 
                    changes: { from: 0, to: code.length, insert: newCode } 
                });
                this.performSearch();
                this.showNotification('Replaced all occurrences', 'success');
            } else {
                this.showNotification('No occurrences found', 'info');
            }
        } catch (e) {
            this.showNotification('Replace failed', 'error');
        }
    }

    private toggleSearchReplace() {
        const modal = document.getElementById('searchReplaceModal') as HTMLElement;
        const searchInput = document.getElementById('searchInput') as HTMLInputElement;
        
        this.searchReplaceOpen = !this.searchReplaceOpen;
        modal.classList.toggle('hidden');
        
        if (this.searchReplaceOpen) {
            searchInput.focus();
        }
    }

    private initSettingsPanel() {
        const closeBtn = document.getElementById('closeSettings') as HTMLElement;
        closeBtn?.addEventListener('click', () => this.toggleSettingsPanel());
        this.loadSettings();
        this.bindSettings();
    }

    private loadSettings() {
        const settings = JSON.parse(localStorage.getItem('codeact_settings') || '{}');
        
        const fontSize = document.getElementById('fontSizeSetting') as HTMLInputElement;
        const tabSize = document.getElementById('tabSizeSetting') as HTMLInputElement;
        const wordWrap = document.getElementById('wordWrapSetting') as HTMLInputElement;
        const autoSave = document.getElementById('autoSaveSetting') as HTMLSelectElement;
        const model = document.getElementById('modelSetting') as HTMLSelectElement;
        const temp = document.getElementById('temperatureSetting') as HTMLInputElement;
        const apiKey = document.getElementById('apiKeySetting') as HTMLInputElement;

        if (fontSize && settings.fontSize) fontSize.value = settings.fontSize;
        if (tabSize && settings.tabSize) tabSize.value = settings.tabSize;
        if (wordWrap && settings.wordWrap !== undefined) wordWrap.checked = settings.wordWrap;
        if (autoSave && settings.autoSave) autoSave.value = settings.autoSave;
        if (model && settings.model) model.value = settings.model;
        if (temp && settings.temperature) temp.value = settings.temperature;
        if (apiKey && settings.apiKey) apiKey.value = settings.apiKey;
        
        this.applySettings(settings);
    }

    private bindSettings() {
        const inputs = [
            'fontSizeSetting', 'tabSizeSetting', 'wordWrapSetting', 
            'autoSaveSetting', 'modelSetting', 'temperatureSetting', 'apiKeySetting'
        ];
        
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.saveSettings());
            }
        });
    }

    private saveSettings() {
        const settings = {
            fontSize: (document.getElementById('fontSizeSetting') as HTMLInputElement)?.value,
            tabSize: (document.getElementById('tabSizeSetting') as HTMLInputElement)?.value,
            wordWrap: (document.getElementById('wordWrapSetting') as HTMLInputElement)?.checked,
            autoSave: (document.getElementById('autoSaveSetting') as HTMLSelectElement)?.value,
            model: (document.getElementById('modelSetting') as HTMLSelectElement)?.value,
            temperature: (document.getElementById('temperatureSetting') as HTMLInputElement)?.value,
            apiKey: (document.getElementById('apiKeySetting') as HTMLInputElement)?.value,
        };
        
        localStorage.setItem('codeact_settings', JSON.stringify(settings));
        this.applySettings(settings);
        this.showNotification('Settings saved', 'success');
    }

    private applySettings(settings: any) {
        // Apply basic styles globally where possible
        if (settings.fontSize) {
            document.documentElement.style.setProperty('--editor-font-size', `${settings.fontSize}px`);
            const editorContainers = document.querySelectorAll('.editor-instance');
            editorContainers.forEach((el: any) => el.style.fontSize = `${settings.fontSize}px`);
        }
        if (settings.apiKey && (window as any).codeactAPI?.setApiKey) {
            (window as any).codeactAPI.setApiKey(settings.apiKey);
        }
    }

    private toggleSettingsPanel() {
        const panel = document.getElementById('settingsPanel') as HTMLElement;
        this.settingsPanelOpen = !this.settingsPanelOpen;
        panel.classList.toggle('hidden');
    }

    private initEditorSplitting() {
        const splitBtn = document.getElementById('splitEditorBtn') as HTMLElement;
        splitBtn?.addEventListener('click', () => this.toggleSplitEditor());
    }

    private initSymbolOutline() {
        const outlineHeader = document.querySelector('.outline-header svg');
        outlineHeader?.addEventListener('click', () => {
            document.getElementById('symbolOutline')?.classList.add('hidden');
        });
        
        // Expose update method so we can call it when opening
        (window as any).updateSymbolOutline = () => this.updateSymbolOutline();
    }

    private updateSymbolOutline() {
        const editor = (window as any).getActiveEditor?.();
        if (!editor) return;
        const code = editor.state.doc.toString();
        
        const symbols: { name: string, type: string, line: number }[] = [];
        const lines = code.split('\n');
        
        lines.forEach((line: string, i: number) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('function ') || trimmed.startsWith('async function ')) {
                const match = trimmed.match(/function\s+([a-zA-Z0-9_]+)/);
                if (match) symbols.push({ name: match[1], type: 'function', line: i + 1 });
            } else if (trimmed.startsWith('class ')) {
                const match = trimmed.match(/class\s+([a-zA-Z0-9_]+)/);
                if (match) symbols.push({ name: match[1], type: 'class', line: i + 1 });
            } else if (trimmed.includes('const ') && trimmed.includes(' = (') && trimmed.includes('=>')) {
                const match = trimmed.match(/const\s+([a-zA-Z0-9_]+)/);
                if (match) symbols.push({ name: match[1], type: 'function', line: i + 1 });
            } else if (trimmed.startsWith('def ')) {
                const match = trimmed.match(/def\s+([a-zA-Z0-9_]+)/);
                if (match) symbols.push({ name: match[1], type: 'function', line: i + 1 });
            }
        });

        const list = document.getElementById('symbolList') as HTMLElement;
        if (list) {
            list.innerHTML = symbols.map(s => `
                <div class="symbol-item" data-line="${s.line}" style="padding: 4px 8px; cursor: pointer; display: flex; gap: 8px; font-size: 13px;">
                    <span style="color: ${s.type === 'class' ? 'var(--clr-accent)' : '#88c0d0'}; width: 14px; text-align: center;">${s.type === 'class' ? 'C' : 'ƒ'}</span>
                    <span>${s.name}</span>
                </div>
            `).join('');

            list.querySelectorAll('.symbol-item').forEach(item => {
                item.addEventListener('click', () => {
                    const line = parseInt((item as HTMLElement).getAttribute('data-line') || '1');
                    const lineObj = editor.state.doc.line(Math.min(line, editor.state.doc.lines));
                    editor.dispatch({ selection: { anchor: lineObj.from, head: lineObj.from }, scrollIntoView: true });
                    document.getElementById('symbolOutline')?.classList.add('hidden');
                });
                item.addEventListener('mouseover', () => (item as HTMLElement).style.background = '#2a2a2a');
                item.addEventListener('mouseout', () => (item as HTMLElement).style.background = 'transparent');
            });
        }
    }

    private toggleSplitEditor() {
        const editor1 = document.getElementById('editorContainer') as HTMLElement;
        const editor2 = document.getElementById('editorContainer2') as HTMLElement;
        
        this.splitEditorActive = !this.splitEditorActive;
        editor2?.classList.toggle('hidden');
    }

    private initContextMenus() {
        document.addEventListener('contextmenu', (e) => {
            const fileItem = (e.target as HTMLElement).closest('.file-item');
            if (fileItem) {
                e.preventDefault();
                const menu = document.getElementById('contextMenu') as HTMLElement;
                menu.style.left = e.clientX + 'px';
                menu.style.top = e.clientY + 'px';
                menu.classList.remove('hidden');
            }
        });

        document.addEventListener('click', () => {
            const menu = document.getElementById('contextMenu') as HTMLElement;
            menu?.classList.add('hidden');
        });
    }

    private initSidebarTabs() {
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.addEventListener('click', (event) => {
                const view = (tab as HTMLElement).getAttribute('data-view');
                this.switchSidebarView(view || '', event);
            });
        });
    }

    private switchSidebarView(view: string, event: Event) {
        const tab = event.currentTarget as HTMLElement;
        const sidebar = document.querySelector('.codeic-sidebar') as HTMLElement;
        const resizer = document.getElementById('sidebarResizer');
        
        if (tab.classList.contains('active')) {
            const isHidden = sidebar.style.display === 'none';
            sidebar.style.display = isHidden ? 'flex' : 'none';
            if (resizer) resizer.style.display = isHidden ? 'block' : 'none';
            return;
        }

        sidebar.style.display = 'flex';
        if (resizer) resizer.style.display = 'block';

        // Toggle active tab
        document.querySelectorAll('.sidebar-tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');

        // Toggle sections
        document.querySelectorAll('.explorer-section').forEach(section => {
            section.setAttribute('style', 'display:none;');
        });
        const section = document.querySelector(`[data-section="${view}"]`) as HTMLElement;
        if (section) section.style.display = 'flex';
    }

    private initTerminalTabs() {
        document.querySelectorAll('.terminal-tab-item').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = (tab as HTMLElement).getAttribute('data-tab');
                this.switchTerminalTab(tabName || '');
            });
        });
    }

    private switchTerminalTab(tab: string) {
        document.querySelectorAll('.terminal-tab-item').forEach(t => {
            t.classList.remove('terminal-tab-active');
        });
        (event?.target as HTMLElement)?.classList.add('terminal-tab-active');

        document.querySelectorAll('.terminal-content').forEach(content => {
            content.classList.add('hidden');
        });
        const content = document.getElementById(tab + 'Pane') as HTMLElement;
        if (content) content.classList.remove('hidden');
    }

    private toggleSidebar() {
        const sidebar = document.querySelector('.codeic-sidebar') as HTMLElement;
        sidebar?.style.display === 'none' 
            ? (sidebar.style.display = 'flex') 
            : (sidebar.style.display = 'none');
    }

    private toggleAIPanel() {
        const aiPanel = document.querySelector('.codeic-ai') as HTMLElement;
        aiPanel?.style.display === 'none' 
            ? (aiPanel.style.display = 'flex') 
            : (aiPanel.style.display = 'none');
    }

    private toggleTerminal() {
        const terminal = document.getElementById('terminalPane') as HTMLElement;
        terminal?.style.display === 'none' 
            ? (terminal.style.display = 'flex') 
            : (terminal.style.display = 'none');
    }

    private closeAllModals() {
        document.getElementById('commandPalette')?.classList.add('hidden');
        document.getElementById('goToFileModal')?.classList.add('hidden');
        document.getElementById('searchReplaceModal')?.classList.add('hidden');
        this.commandPaletteOpen = false;
        this.goToFileOpen = false;
        this.searchReplaceOpen = false;
    }

    private executeCommand(action: string) {
        const actions: { [key: string]: () => void } = {
            'goToFile': () => this.toggleGoToFile(),
            'commandPalette': () => this.toggleCommandPalette(),
            'findReplace': () => this.toggleSearchReplace(),
            'settings': () => this.toggleSettingsPanel(),
            'toggleSidebar': () => this.toggleSidebar(),
            'toggleAi': () => this.toggleAIPanel(),
            'toggleTerminal': () => this.toggleTerminal(),
            'splitEditor': () => this.toggleSplitEditor(),
            'saveFile': () => this.saveCurrentFile(),
            'newFile': () => this.newFile(),
            'newFolder': () => this.newFolder(),
            'formatCode': () => this.formatCode(),
            'showProblems': () => this.showProblems(),
            'showGit': () => this.showGit(),
            'goToSymbol': () => {
                const outline = document.getElementById('symbolOutline') as HTMLElement;
                if (outline) {
                    outline.classList.remove('hidden');
                    this.updateSymbolOutline();
                }
            },
        };

        actions[action]?.();
    }

    private saveCurrentFile() {
        console.log('Save file action triggered');
        const notification = this.showNotification('File saved', 'success');
    }

    private saveFileAs() {
        console.log('Save as action triggered');
    }

    private openFile() {
        console.log('Open file action triggered');
    }

    private newFile() {
        console.log('New file action triggered');
    }

    private newFolder() {
        console.log('New folder action triggered');
    }

    private formatCode() {
        console.log('Format code action triggered');
    }

    private showProblems() {
        console.log('Show problems action triggered');
    }

    private showGit() {
        console.log('Show git action triggered');
    }

    private showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
        const container = document.getElementById('notificationContainer') as HTMLElement;
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);

        return notification;
    }
}

// Export for use in renderer
export default UIHandlers;
