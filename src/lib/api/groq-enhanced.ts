import { GroqMessage, GroqRequest, GroqResponse } from '@/lib/types/debate';
import { fetchWithRetry, CircuitBreaker, RetryOptions } from './retry';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Enhanced Groq API error with additional context
 */
export class GroqAPIError extends Error {
    constructor(
        message: string,
        public status?: number,
        public retryable: boolean = false,
        public context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'GroqAPIError';
    }
}

/**
 * Circuit breaker for Groq API
 */
const groqCircuitBreaker = new CircuitBreaker(); // Use default configuration

/**
 * Groq API client configuration
 */
interface GroqClientConfig {
    timeout: number;
    retryOptions: Partial<RetryOptions>;
}

const DEFAULT_CONFIG: GroqClientConfig = {
    timeout: 30000, // 30 seconds for AI responses
    retryOptions: {
        maxRetries: 2, // Conservative for AI API calls
        initialDelay: 2000,
        maxDelay: 8000,
        retryCondition: error => {
            if (error instanceof GroqAPIError) {
                return error.retryable;
            }
            return true; // Retry unknown errors
        },
    },
};

/**
 * Enhanced Groq API client with resilience patterns
 */
export class GroqClient {
    private config: GroqClientConfig;
    private apiKey: string;
    private model: string;

    constructor(config: Partial<GroqClientConfig> = {}) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new GroqAPIError('GROQ_API_KEY environment variable is not set');
        }

        this.apiKey = apiKey;
        this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    async generateResponse(
        messages: GroqMessage[],
        options: Partial<GroqRequest> = {}
    ): Promise<string> {
        const requestBody: GroqRequest = {
            model: this.model,
            messages,
            max_tokens: 220, // Hard limit as per TDD
            temperature: 0.7,
            ...options,
        };

        try {
            return await groqCircuitBreaker.execute(async () => {
                const response = await fetchWithRetry(
                    GROQ_API_URL,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${this.apiKey}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(requestBody),
                        timeout: this.config.timeout,
                    },
                    this.config.retryOptions
                );

                const data: GroqResponse = await response.json();

                if (!data.choices || data.choices.length === 0) {
                    throw new GroqAPIError(
                        'No response from Groq API',
                        undefined,
                        true, // Retryable
                        { requestBody }
                    );
                }

                return data.choices[0].message.content;
            });
        } catch (error) {
            // Enhanced error handling with context
            if (error instanceof GroqAPIError) {
                throw error;
            }

            if (error instanceof Error) {
                // Categorize errors for better handling
                if (error.message.includes('timeout')) {
                    throw new GroqAPIError(
                        'Request timed out - AI response took too long',
                        408,
                        true,
                        { originalError: error.message, requestBody }
                    );
                }

                if (error.message.includes('HTTP 429')) {
                    throw new GroqAPIError(
                        'API rate limit exceeded - please try again in a moment',
                        429,
                        true,
                        { originalError: error.message }
                    );
                }

                if (
                    error.message.includes('HTTP 500') ||
                    error.message.includes('HTTP 502') ||
                    error.message.includes('HTTP 503')
                ) {
                    throw new GroqAPIError(
                        'AI service is temporarily unavailable',
                        parseInt(error.message.match(/HTTP (\d+)/)?.[1] || '500'),
                        true,
                        { originalError: error.message }
                    );
                }

                if (error.message.includes('Circuit breaker is open')) {
                    throw new GroqAPIError(
                        'AI service is currently unavailable due to repeated failures',
                        503,
                        false,
                        { circuitBreakerState: groqCircuitBreaker.getState() }
                    );
                }
            }

            throw new GroqAPIError(
                `Failed to generate AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
                undefined,
                false,
                { originalError: error }
            );
        }
    }

    /**
     * Health check for the Groq API
     */
    async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
        try {
            await this.generateResponse([
                { role: 'user', content: 'Test message for health check' },
            ]);
            return { status: 'healthy' };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus(): { state: string; canExecute: boolean } {
        const state = groqCircuitBreaker.getState();
        return {
            state,
            canExecute: state !== 'open',
        };
    }

    /**
     * Reset circuit breaker (for admin/debug purposes)
     */
    resetCircuitBreaker(): void {
        groqCircuitBreaker.reset();
    }
}

// Singleton instance for the application
export const groqClient = new GroqClient();

// Legacy function wrapper for backward compatibility
export const callGroq = (messages: GroqMessage[]): Promise<string> => {
    return groqClient.generateResponse(messages);
};
