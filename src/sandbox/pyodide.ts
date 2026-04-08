import { loadPyodide, PyodideInterface } from 'pyodide';
import type { ExecutionResult } from '../types.js';

let pyodideInstance: PyodideInterface | null = null;

export const initPyodide = async (): Promise<PyodideInterface> => {
    if (!pyodideInstance) {
        pyodideInstance = await loadPyodide();
    }
    return pyodideInstance;
};

export const runInWasm = async (script: string): Promise<ExecutionResult> => {
    const start = Date.now();
    const py = await initPyodide();
    
    // We capture stdout and stderr natively via python sys manipulation or Pyodide globals
    await py.runPythonAsync(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

    let finalOutput = '';
    let finalFormat = 'text';

    // Inject our required environment primitive: output_to_user
    py.globals.set('output_to_user', (content: string, format_: string) => {
        finalOutput = content;
        finalFormat = format_;
    });

    let exitCode = 0;
    try {
        await py.runPythonAsync(script);
    } catch (err: any) {
        exitCode = 1;
        py.globals.set('__sys_err', err.toString());
        await py.runPythonAsync(`sys.stderr.write(__sys_err)`);
    }

    const stdoutLines = await py.runPythonAsync(`sys.stdout.getvalue()`);
    const stderrLines = await py.runPythonAsync(`sys.stderr.getvalue()`);
    
    const execution_time_ms = Date.now() - start;

    return {
        stdout: finalOutput || stdoutLines, // If output_to_user wasn't called, return stdout as fallback
        stderr: stderrLines,
        exit_code: exitCode,
        execution_time_ms
    };
};
