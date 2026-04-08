import { describe, it, expect, beforeAll } from 'vitest';
import { runInWasm, initPyodide } from '../src/sandbox/pyodide.js';
import { CodeActState } from '../src/types.js';
import { buildSystemPrompt } from '../src/prompts/system_prompt.js';

describe('CodeACT Kernel - Pyodide WASM Execution Proof', () => {

    beforeAll(async () => {
        // Cold start warmup
        await initPyodide();
    });

    it('should correctly execute a standard simple generated PoT script', async () => {
        // Simulating the script that Claude would generate to find mutated variables
        const simulatedClaudeScript = `
# TIER: WASM
import ast

source_code = """
def test_func():
    x = 10
    y = 20
    x += 5
    return x + y
"""

class MutationVisitor(ast.NodeVisitor):
    def __init__(self):
        self.mutated = set()
    
    def visit_Assign(self, node):
        for target in node.targets:
            if isinstance(target, ast.Name):
                self.mutated.add(target.id)
        self.generic_visit(node)
        
    def visit_AugAssign(self, node):
        if isinstance(node.target, ast.Name):
            self.mutated.add(node.target.id)
        self.generic_visit(node)

tree = ast.parse(source_code)
visitor = MutationVisitor()
visitor.visit(tree)

output_to_user(f"Mutated variables: {', '.join(sorted(visitor.mutated))}", "text")
`;
        
        const result = await runInWasm(simulatedClaudeScript);
        
        expect(result.exit_code).toBe(0);
        expect(result.stderr).toBe("");
        // Our expected stdout from the output_to_user binding
        expect(result.stdout).toBe("Mutated variables: x, y");
        // Verify we hit the latency targets promised in docs (warm typically < 100ms)
        expect(result.execution_time_ms).toBeLessThan(800); 
    });

    it('should gracefully handle Python exceptions in PoT', async () => {
        const errorScript = `
# TIER: WASM
x = 1 / 0
output_to_user("unreachable", "text")
`;
        const result = await runInWasm(errorScript);
        
        expect(result.exit_code).toBe(1);
        expect(result.stderr).toContain("ZeroDivisionError");
    });
    
    it('properly structures the system prompt constraints', () => {
        const prompt = buildSystemPrompt(CodeActState.TRACE_EXECUTION);
        expect(prompt).toContain('You DO NOT output English prose');
        expect(prompt).toContain("format_ must be 'text', 'diff', or 'code'");
        expect(prompt).toContain(CodeActState.TRACE_EXECUTION);
    });
});
