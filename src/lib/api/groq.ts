import { GroqMessage, GroqRequest, GroqResponse } from '@/lib/types/debate';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqAPIError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = 'GroqAPIError';
    }
}

export const callGroq = async (messages: GroqMessage[]): Promise<string> => {
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

    if (!apiKey) {
        throw new GroqAPIError('GROQ_API_KEY environment variable is not set');
    }

    const requestBody: GroqRequest = {
        model,
        messages,
        max_tokens: 220, // Hard limit as per TDD
        temperature: 0.7
    };

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new GroqAPIError(
                `Groq API error: ${response.status} ${response.statusText} - ${errorText}`,
                response.status
            );
        }

        const data: GroqResponse = await response.json();
        
        if (!data.choices || data.choices.length === 0) {
            throw new GroqAPIError('No response from Groq API');
        }

        return data.choices[0].message.content;
    } catch (error) {
        if (error instanceof GroqAPIError) {
            throw error;
        }
        throw new GroqAPIError(`Failed to call Groq API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const buildPrompt = (
    systemPrompt: string,
    topic: string,
    turn: number,
    phase: string,
    opponentMessage?: string,
    curveball?: string
): GroqMessage[] => {
    const contextFrame = `
CURRENT SITUATION:
- Topic: "${topic}"
- Turn: ${turn} of 10
- Phase: ${phase}
${curveball ? `\nSPECIAL INSTRUCTION: ${curveball}` : ''}
${opponentMessage ? `\nYour opponent just said: "${opponentMessage}"` : ''}

Respond with a compelling argument that maintains your persona.`;

    return [
        {
            role: 'system',
            content: systemPrompt
        },
        {
            role: 'user',
            content: contextFrame
        }
    ];
};