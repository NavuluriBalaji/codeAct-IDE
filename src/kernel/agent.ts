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

        const match = fullText.match(/```(?:python)?\n([\s\S]*?)```/);
        if (!match) {
            throw new Error(`Failed to generate a valid Python block. Raw output:\n${fullText}`);
        }

        return match[1].trim();
    }

    public async synthesizeResponse(
        query: string,
        observation: string
    ): Promise<string> {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });
        const prompt = `
            USER QUERY: ${query}
            OBSERVATION FROM SYSTEM:
            ${observation}

            INSTRUCTION: Your CodeACT PoT logic has finished executing. 
            The OBSERVATION above is the raw output from the Python script.
            Synthesize this into a concise, professional answer for the user. 
            Explain what you found and answer their question directly.
            Do NOT mention the Python script or technical execution details.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    }
}
