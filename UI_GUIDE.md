# CodeACT IDE - Enhanced UI Features Guide

## Quick Start

### Opening CodeACT IDE with New Features

The IDE now has Cursor-like features that make it easier to navigate and use. All the core PoT (Program-of-Thoughts) and execution logic remains the same - this is purely a UI enhancement.

## Essential Keyboard Shortcuts

### Navigation
- **Ctrl+P** - Go to File (search and open files quickly)
- **Ctrl+K** - Command Palette (find any command)
- **Ctrl+G** - Go to Line

### Editing
- **Ctrl+S** - Save File
- **Ctrl+H** - Search & Replace
- **Shift+Alt+F** - Format Document
- **Ctrl+Shift+E** - Focus File Explorer

### Views
- **Ctrl+B** - Toggle Sidebar
- **Ctrl+Shift+L** - Toggle AI Panel
- **Ctrl+`** - Toggle Terminal
- **Ctrl+\\** - Split Editor
- **Ctrl+Shift+F** - Search across files

### Version Control
- **Ctrl+Shift+G** - Show Source Control (Git)

### Debug & Problems
- **Ctrl+Shift+M** - Show Problems
- **Ctrl+Shift+D** - Run & Debug

## UI Components

### 1. Command Palette (Ctrl+K)

The command palette is your quick access to all IDE functions.

**How to use:**
1. Press `Ctrl+K`
2. Type to search for commands
3. Use arrow keys to navigate
4. Press Enter to execute

**Example commands:**
- "save" → Save File
- "format" → Format Document
- "split" → Split Editor
- "git" → Show Source Control

### 2. Go to File (Ctrl+P)

Quickly jump to any file in your workspace.

**How to use:**
1. Press `Ctrl+P`
2. Type filename or path
3. Results filter in real-time
4. Select with arrow keys and Enter

### 3. Search & Replace (Ctrl+H)

Find and replace text across your files.

**Features:**
- Case sensitive matching (toggle with `Aa` button)
- Whole word matching (toggle with `ab` button)  
- Regular expression support (toggle with `.*` button)
- Replace functionality

### 4. Split Editor (Ctrl+\\)

View two files side-by-side for comparison or simultaneous editing.

**How to use:**
1. Open a file
2. Press `Ctrl+\\` to open split view
3. Click tab to switch which file appears in right pane
4. Press `Ctrl+\\` again to close split view

### 5. Settings (Ctrl+,)

Customize editor and AI behavior.

**Available Settings:**
- Font Size (8-32px)
- Tab Size (1-8 spaces)
- Word Wrap toggle
- Auto Save mode (Off, After Delay, On Focus Change)
- AI Model selection
- Temperature control (0-1)

### 6. File Explorer

The sidebar shows your workspace files with multiple views:

**Explorer (Ctrl+Shift+E)**
- View all files and folders
- Right-click for context menu (New File, Delete, Rename, etc.)
- Drag files to the AI input area to reference them
- Double-click to open files

**Search (Ctrl+Shift+F)**
- Search across all files in your workspace
- See results with file paths
- Click to navigate to matches

**Source Control (Ctrl+Shift+G)**
- View git status
- See modified files
- Commit changes

### 7. Breadcrumbs

The breadcrumb bar below the tabs shows your current file path. Click any part to jump to parent directories.

### 8. Symbol Outline

The outline sidebar (toggleable from View menu) shows code structure:
- Functions, classes, methods
- Variables and constants
- Click to jump to definition
- Nested structure shows hierarchy

### 9. Status Bar

The status bar at the bottom shows:
- Current git branch
- Cursor position (Ln X, Col Y)
- File encoding and language
- Execution latency
- AI model status

### 10. Notifications

Success, error, and info messages appear briefly in the bottom-right corner and auto-dismiss after 3 seconds.

### 11. Terminal Tabs

Switch between different outputs:
- **Terminal** - Shell/system output
- **Problems** - Linting/compilation errors
- **Output** - Program output
- **Debug** - Debug information

## Right-Click Context Menu

Right-click on any file in the explorer:
- **Open** - Open in current editor
- **Open in New Tab** - Open in new tab
- **Reveal in Explorer** - Show parent folder
- **New File** - Create new file in this folder
- **New Folder** - Create new folder
- **Rename** - Rename file/folder
- **Delete** - Delete file/folder
- **Copy Path** - Copy absolute path to clipboard
- **Copy Relative Path** - Copy relative path to clipboard

## AI Panel Features

The AI panel on the right is where you interact with CodeACT's intelligence.

### File References
- Type `@` to see file suggestions
- Type `@filename` to reference files
- Drag files from explorer to mention them
- References help the AI understand context

### Commands
- Type natural language commands
- Ask for code analysis, refactoring, debugging
- The AI will think through the problem as executable code

### Chat History
- All interactions are preserved
- Scroll up to see previous results
- Clear chat with the 🗑️ icon

## Menu System

All traditional IDE menus are available:

### File Menu
- New File / New Folder
- Open File / Open Folder
- Save / Save All / Save As
- Close Editor / Close All
- Auto Save toggle

### Edit Menu
- Undo / Redo
- Cut / Copy / Paste
- Find & Replace
- Format Document

### View Menu
- Toggle Sidebar
- Toggle AI Panel
- Toggle Terminal
- Split Editor
- Settings
- Extensions

### Go Menu
- Go to File (Ctrl+P)
- Go to Symbol (Ctrl+Shift+O)
- Go to Line (Ctrl+G)
- Show Problems

### Terminal Menu
- New Terminal
- Clear Terminal

## Tips & Tricks

1. **Quick File Opening**: Use Ctrl+P for fastest file access - faster than using the mouse
2. **Command Discovery**: Use Ctrl+K to discover available commands
3. **Side-by-Side Comparison**: Use Ctrl+\\ to compare two files
4. **Search in Workspace**: Use Ctrl+Shift+F for project-wide search
5. **Keyboard Navigation**: Most UI elements respond to arrow keys and Enter
6. **File Mentions**: Drag files to AI input to get context awareness
7. **Settings Persistence**: Your settings are saved automatically
8. **Terminal Management**: Right-click terminal tabs to manage multiple terminals
9. **Breadcrumb Navigation**: Click breadcrumbs to jump to parent directories
10. **Status Bar**: Hover status items for more information

## Customization

### Keyboard Shortcuts
All shortcuts use VS Code/Cursor conventions:
- Ctrl for Windows/Linux
- ⌘ for Mac (when available)
- Alt/Option for modifiers

### Theme & Appearance
The dark theme uses:
- Deep black background: `#000000`
- Neon lime accent: `#BAFF39`
- Consistent typography with Outfit (UI) and JetBrains Mono (code)

## Troubleshooting

### Command Palette Not Opening
- Ensure focus is on the window
- Try Ctrl+K again
- Check if modal is already open

### File Not Showing in Go to File
- File might be in .gitignore
- Check file permissions
- Try refreshing the file tree

### Settings Not Saving
- Ensure you're saving the settings
- Check browser console for errors
- Try clearing cache and reopening

### Keyboard Shortcuts Not Working
- Check if another application is intercepting them
- Ensure the IDE window is focused
- Try using the menu instead

## Future Enhancements

Planned features:
- Multi-cursor editing
- Code folding
- Git blame view
- Workspace settings
- Custom theme editor
- Keybinding customization
- More language support
- Extension marketplace

## Support

For issues or feature requests:
1. Check the troubleshooting section
2. Review the CURSOR_FEATURES.md documentation
3. Check GitHub issues
4. Submit bug reports with reproduction steps
