import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomUUID } from 'crypto';
import type { ExecutionResult } from '../types.js';

const execAsync = promisify(exec);

export async function runInNative(script: string, cwd: string): Promise<ExecutionResult> {
    const startTime = performance.now();
    
    // We physically write the thought snippet into a secure temp file
    const tempFile = join(tmpdir(), `codeact_native_${randomUUID()}.py`);
    
    try {
        const preamble = `
import sys
import os

def output_to_user(content, format_="text"):
    print(content) # Direct relay to stdout for kernel capture

def execute_code(script):
    # Placeholder for recursive execution 
    return {"exit_code": 0, "stdout": "recursive execution not supported yet in prompt-bound native", "stderr": ""}

# ====================
# AGENT SCRIPT START
# ====================
`;
        const wrappedScript = preamble + script;
        await writeFile(tempFile, wrappedScript, 'utf8');
        
        const command = process.platform === 'win32' ? `python "${tempFile}"` : `python3 "${tempFile}"`;
        
        try {
            // Execute locally with massive buffer for git outputs and filesystem scans
            const { stdout, stderr } = await execAsync(command, { cwd, maxBuffer: 1024 * 1024 * 10 }); 
            
            const execution_time_ms = Math.round(performance.now() - startTime);

            return {
                exit_code: 0,
                stdout: stdout.trim(),
                stderr: stderr.trim(),
                execution_time_ms
            };
        } catch (error: any) {
            const execution_time_ms = Math.round(performance.now() - startTime);
            return {
                exit_code: error.code || 1,
                stdout: error.stdout ? error.stdout.trim() : "",
                stderr: error.stderr ? error.stderr.trim() : error.message || "Unknown Contextual Error",
                execution_time_ms
            };
        }
    } finally {
        // Obliterate the PoT temp script traces instantly to prevent filesystem bloat
        await unlink(tempFile).catch(() => {});
    }
}
