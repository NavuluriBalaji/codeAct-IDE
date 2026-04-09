# CodeACT IDE: The AI-Native Program-of-Thoughts Environment

> "Thinking in code is far more powerful than thinking in language."

CodeACT is a production-grade, AI-native IDE architecture designed to move beyond the limitations of traditional LLM-based assistants. Most current AI IDEs rely on Natural Language Processing (NLP) for their internal loops (Input → Thinking → ACT → Observation). **CodeACT replaces this fuzzy linguistic reasoning with deterministic, high-precision code execution.**

## 🚀 The Core Philosophy

### 1. Program-of-Thoughts (PoT) vs. Chain-of-Thought (CoT)
Traditional "Chain-of-Thought" forces LLMs to reason in English prose. This is slow, prone to hallucination, and linguistically noisy. CodeACT enforces a strict **Program-of-Thoughts** architecture. The LLM's "thinking" process is a literal sequence of executable Python scripts. 

By thinking in code, the agent gains:
*   **Mathematical Precision**: No more semantic ambiguity.
*   **Zero Hallucination**: The script physically verifies the filesystem, imports, and variables.
*   **Self-Correction**: Runtime errors provide immediate, deterministic feedback to the "thought" loop.

### 2. Numerical Intent (Tokenized Communication)
LLMs are deep-learning models that fundamentally operate on math and indices. CodeACT eliminates "chatty" communication between internal agents. 
*   **The Mediator**: A specialized agent converts user natural language into a dense, numerical/tokenized format.
*   **The Kernel**: The executive agent receives these "Numerical Intents," allowing it to process complex instructions with near-zero linguistic overhead.

### 3. On-the-Fly Dynamic Tooling
Instead of relying on a rigid, hard-coded library of "Tools," CodeACT uses a **smolagents-inspired** approach. The Agent Kernel writes the specific tool it needs in real-time. If it needs to analyze a 10,000-line codebase, it doesn't call a `summarize_repo` tool; it writes a specialized AST-parsing script tailored to that exact request and executes it.

## 🏗️ Architectural Flow

The IDE operates on a dual-stage execution pipeline:

1.  **Mediator Stage (The Parser)**: 
    *   Takes User Input.
    *   Writes a PoT Python script to extract structural intent.
    *   Runs in a secure **WASM Sandbox (Pyodide)**.
    *   Outputs a numerical "Intent Map."

2.  **Kernel Stage (The Executive)**:
    *   Receives the numerical Intent Map.
    *   Generates a heavy-duty execution script.
    *   Routes execution to the appropriate tier:
        *   `# TIER: WASM`: For pure logic, string manipulation, and sandboxed math.
        *   `# TIER: NATIVE`: For filesystem access, terminal commands, and system modification.

## 🛠️ Technology Stack

*   **Runtime**: Electron (Node.js + Chromium)
*   **AI Engine**: Google Gemini (1.5 Flash / 2.5 Flash Lite)
*   **Execution**: Multi-tier (WASM/Pyodide & Native Child Process)
*   **Frontend**: CodeMirror 6 (Pro Editor Shell)

## 📖 Research Background
This project is inspired by the research paper: [Program of Thoughts Prompting: Disentangling Computation from Reasoning](https://arxiv.org/abs/2211.12588), which concludes that decoupling the reasoning from the computation (by delegating to an external tool/code execution) significantly improves LLM performance on complex tasks.

---
Built with ⚡ by [Balaji](mailto:balajinbtt@gmail.com)
