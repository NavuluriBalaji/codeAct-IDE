import { GoogleGenerativeAI } from '@google/generative-ai';
import { MEDIATOR_PROMPT } from '../prompts/mediator_prompt.js';

export class MediatorAgent {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY not set");
        this.genAI = new GoogleGenerativeAI(key);
    }

    public async parseQuery(query: string, onToken?: (text: string) => void): Promise<string> {
        // We use gemini-1.5-flash for the fastest possible token extraction
        const model = this.genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash-lite',
            systemInstruction: MEDIATOR_PROMPT
        });

        const userMessage = `Write the parsing script for this exact query: "${query}"`;

        const result = await model.generateContentStream({
             contents: [{ role: 'user', parts: [{ text: userMessage }] }],
             generationConfig: {
                 temperature: 0.1,
                 maxOutputTokens: 1500
             }
        });
        
        let textContent = "";
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            textContent += chunkText;
            if (onToken) onToken(chunkText);
        }

        const match = textContent.match(/```(?:python)?\n([\s\S]*?)```/);
        if (!match) {
            throw new Error(`Failed to generate Mediator script. Raw output:\n${textContent}`);
        }

        return match[1].trim();
    }
}
