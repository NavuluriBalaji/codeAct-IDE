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
        
        this.goToFileOpen = !this.goToFileOpen;
        modal.classList.toggle('hidden');
        
        if (this.goToFileOpen) {
            input.focus();
            input.value = '';
        }
    }

    private initSearchReplace() {
        const searchBtn = document.getElementById('commandBtn') as HTMLElement;
        searchBtn?.addEventListener('click', () => this.toggleSearchReplace());
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
            tab.addEventListener('click', () => {
                const view = (tab as HTMLElement).getAttribute('data-view');
                this.switchSidebarView(view || '');
            });
        });
    }

    private switchSidebarView(view: string) {
        // Toggle active tab
        document.querySelectorAll('.sidebar-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        (event?.target as HTMLElement)?.classList.add('active');

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
