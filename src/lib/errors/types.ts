/**
 * Application error categories for different handling strategies
 */
export enum ErrorCategory {
    NETWORK = 'network',
    VALIDATION = 'validation',
    AI_SERVICE = 'ai_service',
    DEBATE_LOGIC = 'debate_logic',
    USER_INPUT = 'user_input',
    SYSTEM = 'system',
    RATE_LIMIT = 'rate_limit',
}

/**
 * Error severity levels for UI treatment
 */
export enum ErrorSeverity {
    LOW = 'low', // Toast notification
    MEDIUM = 'medium', // Modal dialog
    HIGH = 'high', // Error boundary
    CRITICAL = 'critical', // Full page error
}

/**
 * Base application error with rich context
 */
export class AppError extends Error {
    public readonly category: ErrorCategory;
    public readonly severity: ErrorSeverity;
    public readonly userMessage: string;
    public readonly technicalMessage: string;
    public readonly retryable: boolean;
    public readonly context: Record<string, unknown>;
    public readonly timestamp: Date;

    constructor({
        category,
        severity,
        userMessage,
        technicalMessage,
        retryable = false,
        context = {},
        cause,
    }: {
        category: ErrorCategory;
        severity: ErrorSeverity;
        userMessage: string;
        technicalMessage: string;
        retryable?: boolean;
        context?: Record<string, unknown>;
        cause?: Error;
    }) {
        super(technicalMessage, { cause });

        this.category = category;
        this.severity = severity;
        this.userMessage = userMessage;
        this.technicalMessage = technicalMessage;
        this.retryable = retryable;
        this.context = context;
        this.timestamp = new Date();

        this.name = 'AppError';
    }

    /**
     * Create error for logging purposes
     */
    toLogObject() {
        return {
            name: this.name,
            category: this.category,
            severity: this.severity,
            userMessage: this.userMessage,
            technicalMessage: this.technicalMessage,
            retryable: this.retryable,
            context: this.context,
            timestamp: this.timestamp.toISOString(),
            stack: this.stack,
        };
    }
}

/**
 * Specific error types for different scenarios
 */

export class NetworkError extends AppError {
    constructor(technicalMessage: string, context: Record<string, unknown> = {}) {
        super({
            category: ErrorCategory.NETWORK,
            severity: ErrorSeverity.MEDIUM,
            userMessage:
                "We're having trouble connecting to our servers. Please check your internet connection and try again.",
            technicalMessage,
            retryable: true,
            context,
        });
        this.name = 'NetworkError';
    }
}

export class AIServiceError extends AppError {
    constructor(
        technicalMessage: string,
        retryable: boolean = true,
        context: Record<string, unknown> = {}
    ) {
        super({
            category: ErrorCategory.AI_SERVICE,
            severity: ErrorSeverity.MEDIUM,
            userMessage: retryable
                ? 'Our AI is taking longer than usual to respond. Please try again in a moment.'
                : "Our AI service is temporarily unavailable. We're working to fix this issue.",
            technicalMessage,
            retryable,
            context,
        });
        this.name = 'AIServiceError';
    }
}

export class ValidationError extends AppError {
    constructor(field: string, technicalMessage: string, context: Record<string, unknown> = {}) {
        super({
            category: ErrorCategory.VALIDATION,
            severity: ErrorSeverity.LOW,
            userMessage: `Please check your ${field} and try again.`,
            technicalMessage,
            retryable: false,
            context: { ...context, field },
        });
        this.name = 'ValidationError';
    }
}

export class DebateError extends AppError {
    constructor(
        technicalMessage: string,
        retryable: boolean = false,
        context: Record<string, unknown> = {}
    ) {
        super({
            category: ErrorCategory.DEBATE_LOGIC,
            severity: ErrorSeverity.MEDIUM,
            userMessage: retryable
                ? "Something went wrong with the debate. Let's try that again."
                : 'This debate encountered an issue and needs to be restarted.',
            technicalMessage,
            retryable,
            context,
        });
        this.name = 'DebateError';
    }
}

export class RateLimitError extends AppError {
    constructor(
        technicalMessage: string,
        retryAfter?: number,
        context: Record<string, unknown> = {}
    ) {
        const waitTime = retryAfter ? Math.ceil(retryAfter / 60) : 1;
        super({
            category: ErrorCategory.RATE_LIMIT,
            severity: ErrorSeverity.MEDIUM,
            userMessage: `You're sending requests too quickly. Please wait ${waitTime} minute${waitTime > 1 ? 's' : ''} before trying again.`,
            technicalMessage,
            retryable: true,
            context: { ...context, retryAfter },
        });
        this.name = 'RateLimitError';
    }
}

export class SystemError extends AppError {
    constructor(technicalMessage: string, context: Record<string, unknown> = {}) {
        super({
            category: ErrorCategory.SYSTEM,
            severity: ErrorSeverity.HIGH,
            userMessage:
                "We encountered an unexpected error. This has been reported and we're looking into it.",
            technicalMessage,
            retryable: false,
            context,
        });
        this.name = 'SystemError';
    }
}

/**
 * Error factory functions for common scenarios
 */
export const ErrorFactory = {
    networkTimeout: (url: string) => new NetworkError(`Request to ${url} timed out`, { url }),

    aiResponseFailed: (attempt: number, maxAttempts: number) =>
        new AIServiceError(
            `AI response failed after ${attempt}/${maxAttempts} attempts`,
            attempt < maxAttempts,
            { attempt, maxAttempts }
        ),

    invalidTopic: (topic: string) =>
        new ValidationError('topic', `Topic "${topic}" is invalid`, { topic }),

    debateNotFound: (debateId: string) =>
        new DebateError(`Debate ${debateId} not found`, false, { debateId }),

    tooManyRequests: (retryAfter?: number) => new RateLimitError('Rate limit exceeded', retryAfter),

    unexpectedError: (originalError: Error) =>
        new SystemError(`Unexpected error: ${originalError.message}`, {
            originalError: originalError.message,
            stack: originalError.stack,
        }),
};
