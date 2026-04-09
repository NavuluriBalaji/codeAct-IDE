import { createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface CodeAnnotation {
    summary: string;
}

export interface CodeAction {
    intent: string;
    script: string;
    language: string;
    reliability_score: number;
}

export class SemanticMemory {
    private cachePath: string;
    private memory: Record<string, CodeAnnotation> = {};
    private scripts: CodeAction[] = [];

    constructor(workspacePath: string) {
        this.cachePath = join(workspacePath, '.codeact', 'memory.json');
    }

    private async ensureDir() {
        try {
            await mkdir(join(this.cachePath, '..'), { recursive: true });
        } catch {}
    }

    public static computeHash(content: string): string {
        return createHash('sha256').update(content).digest('hex');
    }

    public async load() {
        try {
            const data = await readFile(this.cachePath, 'utf8');
            const parsed = JSON.parse(data);
            this.memory = parsed.memory || {};
            this.scripts = parsed.scripts || [];
        } catch {
            this.memory = {};
            this.scripts = [];
        }
    }

    public async save() {
        await this.ensureDir();
        await writeFile(this.cachePath, JSON.stringify({ memory: this.memory, scripts: this.scripts }, null, 2));
    }

    public getMatchingScript(intent: string): string | null {
        const found = this.scripts.find(s => intent.toLowerCase().includes(s.intent.toLowerCase()) || s.intent.toLowerCase().includes(intent.toLowerCase()));
        return found ? found.script : null;
    }

    public addScript(action: CodeAction) {
        if (!this.scripts.find(s => s.script === action.script)) {
            this.scripts.push(action);
        }
    }

    public get(filePath: string, currentContent: string): CodeAnnotation | null {
        const hash = SemanticMemory.computeHash(currentContent);
        const cached = this.memory[filePath];
        // Note: For GLOBAL_KNOWLEDGE we use different logic, but for files we check hash
        return cached;
    }

    public set(key: string, content: string, annotation: CodeAnnotation) {
        this.memory[key] = annotation;
    }

    public getAllScripts(): string {
        return this.scripts.map(s => `[INTENT: ${s.intent}]\nSCRIPT:\n${s.script}`).join('\n\n');
    }
}
