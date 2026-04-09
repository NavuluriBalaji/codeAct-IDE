# CodeACT IDE: Architectural Review Graph

This graph visualizes the internal "Program-of-Thoughts" flow and the component relationships within the project.

```mermaid
graph TD
    subgraph UI_Layer ["Renderer (Frontend)"]
        A[index.html] --> B[renderer.ts]
        B -->|Code Editing| C[CodeMirror 6]
        B -->|Command Execution| D[Terminal - xterm.js]
    end

    subgraph IPC_Bridge ["IPC Layer (Bridge)"]
        B <-->|contextBridge| E[preload.cjs]
    end

    subgraph Backend_Process ["Electron Main (Native)"]
        E <--> F[main.ts]
        
        subgraph Logic_Engine ["CodeACT Intelligence"]
            F -->|User Request| G[Mediator Agent]
            G -->|PoT Parser| H[WASM Sandbox - Pyodide]
            H -->|JSON Intent| I[Kernel Agent]
            I -->|PoT Executive| J[Execution Router]
        end

        subgraph Environment ["Execution Tiers"]
            J -->|# TIER: WASM| H
            J -->|# TIER: NATIVE| K[Native Sandbox - Node child_process]
            F <-->|Terminal Stream| L[Node-PTY Shell]
        end
        
        subgraph Filesystem ["Workspace"]
            K <--> M[Local Disk / Files]
            F <--> M
        end
    end

    style UI_Layer fill:#1a1a1a,stroke:#BAFF39,color:#fff
    style Backend_Process fill:#000,stroke:#333,color:#fff
    style Logic_Engine fill:#0F0F0F,stroke:#BAFF39,color:#fff
    style WASM fill:#1E1E1E,stroke:#EB7FC6,color:#fff
    style Environment fill:#0F0F0F,stroke:#007acc,color:#fff
```

### Key Component Review:

| Component | Responsibility | Risk Level |
| :--- | :--- | :--- |
| **Mediator Agent** | Parses user intent into numerical tokens using a WASM Python script. Prevents "prompt leakage" to the Kernel. | Low |
| **Kernel Agent** | Generates the Executive Program-of-Thought script. It "guesses" the solution by writing code. | High (Execution) |
| **Execution Router** | Determines if a thought is safe for WASM or requires Native access. | Medium |
| **Node-PTY** | Direct bridge to the host OS shell. Powers the real-deal terminal experience. | High (Security) |
| **CodeMirror 6** | Modern, modular editor providing the "IDE" surface. | Low |

### The "Thinking" Data Flow:
1.  **Input**: User enters Natural Language in the AI Pane.
2.  **Mediate**: LLM writes a Python script → Runs in WASM → Returns a **Clean Token Map**.
3.  **Think**: LLM receives Token Map → Writes a **Native Python Script** to solve the task.
4.  **Act**: Script executes on Local OS → Returns `stdout`/`stderr`.
5.  **Observe**: Results are piped back to the UI in real-time.
