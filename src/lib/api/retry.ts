/**
 * Retry configuration options
 */
export interface RetryOptions {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffFactor: number;
    retryCondition?: (error: unknown) => boolean;
    onRetry?: (error: unknown, attemptNumber: number) => void;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffFactor: 2,
    retryCondition: (error: unknown) => {
        // Retry on network errors, 5xx errors, and timeouts
        if (error instanceof Error) {
            return error.message.includes('fetch') ||
                   error.message.includes('network') ||
                   error.message.includes('timeout');
        }
        if (typeof error === 'object' && error !== null && 'status' in error) {
            const status = (error as { status: number }).status;
            return status >= 500 || status === 408 || status === 429;
        }
        return false;
    }
};

/**
 * Sleep utility for delays
 */
const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
    attemptNumber: number,
    options: RetryOptions
): number {
    const exponentialDelay = options.initialDelay * Math.pow(options.backoffFactor, attemptNumber - 1);
    const cappedDelay = Math.min(exponentialDelay, options.maxDelay);

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * 0.1 * Math.random();
    return cappedDelay + jitter;
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: unknown;

    for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Don't retry on the last attempt
            if (attempt > config.maxRetries) {
                break;
            }

            // Check if we should retry this error
            if (!config.retryCondition!(error)) {
                throw error;
            }

            // Calculate delay and wait
            const delay = calculateDelay(attempt, config);

            // Call retry callback if provided
            config.onRetry?.(error, attempt);

            console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Enhanced fetch with retry logic and timeout
 */
export async function fetchWithRetry(
    url: string,
    options: RequestInit & { timeout?: number } = {},
    retryOptions: Partial<RetryOptions> = {}
): Promise<Response> {
    const { timeout = 10000, ...fetchOptions } = options;

    return withRetry(async () => {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...fetchOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Throw error for HTTP error status codes
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`, {
                    cause: { status: response.status, statusText: response.statusText }
                });
            }

            return response;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`, { cause: error });
            }

            throw error;
        }
    }, {
        ...retryOptions,
        onRetry: (error, attemptNumber) => {
            console.warn(`API request failed (attempt ${attemptNumber}):`, {
                url,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });
            retryOptions.onRetry?.(error, attemptNumber);
        }
    });
}

/**
 * Circuit breaker states
 */
export enum CircuitState {
    CLOSED = 'closed',
    OPEN = 'open',
    HALF_OPEN = 'half-open'
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
}

/**
 * Circuit breaker health information
 */
export interface CircuitBreakerHealth {
    state: CircuitState;
    failureCount: number;
    lastFailureTime: Date | null;
    nextAttemptTime: Date | null;
}

/**
 * Circuit breaker pattern for failing services
 */
export class CircuitBreaker {
    private failures = 0;
    private lastFailureTime = 0;
    private state: CircuitState = CircuitState.CLOSED;
    private config: CircuitBreakerConfig;

    constructor(config: Partial<CircuitBreakerConfig> = {}) {
        this.config = {
            failureThreshold: 5,
            recoveryTimeout: 60000, // 1 minute
            monitoringPeriod: 10000, // 10 seconds
            ...config
        };
    }

    async execute<T>(operation: () => Promise<T>): Promise<T> {
        if (this.state === CircuitState.OPEN) {
            if (Date.now() - this.lastFailureTime > this.config.recoveryTimeout) {
                this.state = CircuitState.HALF_OPEN;
            } else {
                throw new Error('Circuit breaker is open');
            }
        }

        try {
            const result = await operation();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    private onSuccess(): void {
        this.failures = 0;
        this.state = CircuitState.CLOSED;
    }

    private onFailure(): void {
        this.failures++;
        this.lastFailureTime = Date.now();

        if (this.failures >= this.config.failureThreshold) {
            this.state = CircuitState.OPEN;
        }
    }

    getState(): CircuitState {
        return this.state;
    }

    getHealth(): CircuitBreakerHealth {
        return {
            state: this.state,
            failureCount: this.failures,
            lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime) : null,
            nextAttemptTime: this.state === CircuitState.OPEN
                ? new Date(this.lastFailureTime + this.config.recoveryTimeout)
                : null
        };
    }

    reset(): void {
        this.failures = 0;
        this.lastFailureTime = 0;
        this.state = CircuitState.CLOSED;
    }
}