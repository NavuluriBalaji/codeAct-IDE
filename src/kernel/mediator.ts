import { GoogleGenerativeAI } from '@google/generative-ai';
import { MEDIATOR_PROMPT } from '../prompts/mediator_prompt.js';

export class MediatorAgent {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) throw new Error("GEMINI_API_KEY not set");
        this.genAI = new GoogleGenerativeAI(key);
    }

    public async parseQuery(query: string): Promise<string> {
        // We use gemini-1.5-flash for the fastest possible token extraction
        const model = this.genAI.getGenerativeModel({ 
            model: 'gemini-2.5-flash-lite',
            systemInstruction: MEDIATOR_PROMPT
        });

        const userMessage = `Write the parsing script for this exact query: "${query}"`;

        const result = await model.generateContent({
             contents: [{ role: 'user', parts: [{ text: userMessage }] }],
             generationConfig: {
                 temperature: 0.1,
                 maxOutputTokens: 1500
             }
        });
        
        const textContent = result.response.text();

        const match = textContent.match(/```(?:python)?\n([\s\S]*?)```/);
        if (!match) {
            throw new Error(`Failed to generate Mediator script. Raw output:\n${textContent}`);
        }

        return match[1].trim();
    }
}
