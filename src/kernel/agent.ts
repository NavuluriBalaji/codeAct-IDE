import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildSystemPrompt } from '../prompts/system_prompt.js';
import { CodeActState } from '../types.js';

export class AgentKernel {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY not set");
        this.genAI = new GoogleGenerativeAI(key);
    }

    public async generateThoughtScript(
        state: CodeActState,
        query: string,
        context?: string,
        onToken?: (text: string) => void
    ): Promise<string> {
        const systemPrompt = buildSystemPrompt(state);
        const userMessage = context 
            ? `CONTEXT:\n${context}\n\nUSER QUERY:\n${query}`
            : `USER QUERY:\n${query}`;

        // Falling back to gemini-2.5-flash as 3.1-pro-preview has billing limits on this tied project
        const model = this.genAI.getGenerativeModel({ 
            model: 'gemini-flash-lite-latest',
            systemInstruction: systemPrompt
        });

        const result = await model.generateContentStream({
             contents: [{ role: 'user', parts: [{ text: userMessage }] }],
             generationConfig: {
                 temperature: 0.1,
                 maxOutputTokens: 4000
             }
        });
        
        let fullText = "";
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullText += chunkText;
            if (onToken) onToken(chunkText);
        }

        // Extract exactly what is inside the ```python ... ``` block
        const match = fullText.match(/```(?:python)?\n([\s\S]*?)```/);
        if (!match) {
            throw new Error(`Failed to generate a valid Python block. Raw output:\n${fullText}`);
        }

        return match[1].trim();
    }
}
