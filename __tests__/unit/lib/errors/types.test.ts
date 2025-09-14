/**
 * Unit tests for error types and error factory
 * Tests ensure proper error categorization, messaging, and factory functions
 */

import {
    AppError,
    ErrorCategory,
    ErrorSeverity,
    NetworkError,
    AIServiceError,
    ValidationError,
    DebateError,
    RateLimitError,
    SystemError,
    ErrorFactory,
} from '@/lib/errors/types';

describe('Error Types', () => {
    beforeEach(() => {
        // Reset any global state before each test
        jest.clearAllMocks();
    });

    describe('AppError', () => {
        it('creates error with all required properties', () => {
            const error = new AppError({
                category: ErrorCategory.NETWORK,
                severity: ErrorSeverity.HIGH,
                userMessage: 'User-friendly message',
                technicalMessage: 'Technical details',
                retryable: true,
                context: { url: 'https://api.example.com' },
            });

            expect(error.category).toBe(ErrorCategory.NETWORK);
            expect(error.severity).toBe(ErrorSeverity.HIGH);
            expect(error.userMessage).toBe('User-friendly message');
            expect(error.technicalMessage).toBe('Technical details');
            expect(error.retryable).toBe(true);
            expect(error.context).toEqual({ url: 'https://api.example.com' });
            expect(error.name).toBe('AppError');
            expect(error.timestamp).toBeInstanceOf(Date);
        });

        it('sets default values for optional properties', () => {
            const error = new AppError({
                category: ErrorCategory.SYSTEM,
                severity: ErrorSeverity.LOW,
                userMessage: 'User message',
                technicalMessage: 'Tech message',
            });

            expect(error.retryable).toBe(false);
            expect(error.context).toEqual({});
        });

        it('generates proper log object', () => {
            const error = new AppError({
                category: ErrorCategory.VALIDATION,
                severity: ErrorSeverity.MEDIUM,
                userMessage: 'Invalid input',
                technicalMessage: 'Field validation failed',
                context: { field: 'email' },
            });

            const logObject = error.toLogObject();

            expect(logObject.name).toBe('AppError');
            expect(logObject.category).toBe(ErrorCategory.VALIDATION);
            expect(logObject.severity).toBe(ErrorSeverity.MEDIUM);
            expect(logObject.userMessage).toBe('Invalid input');
            expect(logObject.technicalMessage).toBe('Field validation failed');
            expect(logObject.retryable).toBe(false);
            expect(logObject.context).toEqual({ field: 'email' });
            expect(logObject.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
            expect(logObject.stack).toBeDefined();
        });
    });

    describe('NetworkError', () => {
        it('creates network error with correct defaults', () => {
            const error = new NetworkError('Connection failed');

            expect(error.name).toBe('NetworkError');
            expect(error.category).toBe(ErrorCategory.NETWORK);
            expect(error.severity).toBe(ErrorSeverity.MEDIUM);
            expect(error.technicalMessage).toBe('Connection failed');
            expect(error.userMessage).toContain('trouble connecting');
            expect(error.retryable).toBe(true);
        });

        it('includes context information', () => {
            const context = { url: 'https://api.example.com', timeout: 5000 };
            const error = new NetworkError('Timeout', context);

            expect(error.context).toEqual(context);
        });
    });

    describe('AIServiceError', () => {
        it('creates retryable AI service error by default', () => {
            const error = new AIServiceError('AI service timeout');

            expect(error.name).toBe('AIServiceError');
            expect(error.category).toBe(ErrorCategory.AI_SERVICE);
            expect(error.severity).toBe(ErrorSeverity.MEDIUM);
            expect(error.retryable).toBe(true);
            expect(error.userMessage).toContain('taking longer than usual');
        });

        it('creates non-retryable AI service error when specified', () => {
            const error = new AIServiceError('Service permanently down', false);

            expect(error.retryable).toBe(false);
            expect(error.userMessage).toContain('temporarily unavailable');
        });

        it('includes context information', () => {
            const context = { modelName: 'gpt-4', attempt: 3 };
            const error = new AIServiceError('Model unavailable', true, context);

            expect(error.context).toEqual(context);
        });
    });

    describe('ValidationError', () => {
        it('creates validation error with field context', () => {
            const error = new ValidationError('email', 'Invalid email format');

            expect(error.name).toBe('ValidationError');
            expect(error.category).toBe(ErrorCategory.VALIDATION);
            expect(error.severity).toBe(ErrorSeverity.LOW);
            expect(error.retryable).toBe(false);
            expect(error.userMessage).toContain('email');
            expect(error.context.field).toBe('email');
        });

        it('includes additional context', () => {
            const context = { value: 'invalid-email', pattern: /^.+@.+\..+$/ };
            const error = new ValidationError('email', 'Pattern mismatch', context);

            expect(error.context.field).toBe('email');
            expect(error.context.value).toBe('invalid-email');
        });
    });

    describe('DebateError', () => {
        it('creates non-retryable debate error by default', () => {
            const error = new DebateError('Debate state corrupted');

            expect(error.name).toBe('DebateError');
            expect(error.category).toBe(ErrorCategory.DEBATE_LOGIC);
            expect(error.severity).toBe(ErrorSeverity.MEDIUM);
            expect(error.retryable).toBe(false);
            expect(error.userMessage).toContain('needs to be restarted');
        });

        it('creates retryable debate error when specified', () => {
            const error = new DebateError('Temporary issue', true);

            expect(error.retryable).toBe(true);
            expect(error.userMessage).toContain('try that again');
        });
    });

    describe('RateLimitError', () => {
        it('creates rate limit error with default retry time', () => {
            const error = new RateLimitError('Rate limit exceeded');

            expect(error.name).toBe('RateLimitError');
            expect(error.category).toBe(ErrorCategory.RATE_LIMIT);
            expect(error.severity).toBe(ErrorSeverity.MEDIUM);
            expect(error.retryable).toBe(true);
            expect(error.userMessage).toContain('1 minute');
        });

        it('calculates retry time from seconds', () => {
            const error = new RateLimitError('Rate limited', 120); // 2 minutes

            expect(error.userMessage).toContain('2 minutes');
            expect(error.context.retryAfter).toBe(120);
        });

        it('handles fractional minutes correctly', () => {
            const error = new RateLimitError('Rate limited', 90); // 1.5 minutes -> rounds to 2

            expect(error.userMessage).toContain('2 minutes');
        });
    });

    describe('SystemError', () => {
        it('creates system error with high severity', () => {
            const error = new SystemError('Unexpected system failure');

            expect(error.name).toBe('SystemError');
            expect(error.category).toBe(ErrorCategory.SYSTEM);
            expect(error.severity).toBe(ErrorSeverity.HIGH);
            expect(error.retryable).toBe(false);
            expect(error.userMessage).toContain('unexpected error');
            expect(error.userMessage).toContain('reported');
        });
    });

    describe('ErrorFactory', () => {
        describe('networkTimeout', () => {
            it('creates network timeout error with URL context', () => {
                const error = ErrorFactory.networkTimeout('https://api.example.com');

                expect(error).toBeInstanceOf(NetworkError);
                expect(error.technicalMessage).toContain('timed out');
                expect(error.context.url).toBe('https://api.example.com');
            });
        });

        describe('aiResponseFailed', () => {
            it('creates retryable AI error when attempts remaining', () => {
                const error = ErrorFactory.aiResponseFailed(2, 3);

                expect(error).toBeInstanceOf(AIServiceError);
                expect(error.retryable).toBe(true);
                expect(error.technicalMessage).toContain('2/3 attempts');
                expect(error.context.attempt).toBe(2);
                expect(error.context.maxAttempts).toBe(3);
            });

            it('creates non-retryable AI error when max attempts reached', () => {
                const error = ErrorFactory.aiResponseFailed(3, 3);

                expect(error).toBeInstanceOf(AIServiceError);
                expect(error.retryable).toBe(false);
            });
        });

        describe('invalidTopic', () => {
            it('creates validation error for invalid topic', () => {
                const error = ErrorFactory.invalidTopic('');

                expect(error).toBeInstanceOf(ValidationError);
                expect(error.technicalMessage).toContain('invalid');
                expect(error.context.topic).toBe('');
            });
        });

        describe('debateNotFound', () => {
            it('creates non-retryable debate error', () => {
                const error = ErrorFactory.debateNotFound('debate-123');

                expect(error).toBeInstanceOf(DebateError);
                expect(error.retryable).toBe(false);
                expect(error.technicalMessage).toContain('not found');
                expect(error.context.debateId).toBe('debate-123');
            });
        });

        describe('tooManyRequests', () => {
            it('creates rate limit error without retry time', () => {
                const error = ErrorFactory.tooManyRequests();

                expect(error).toBeInstanceOf(RateLimitError);
                expect(error.technicalMessage).toBe('Rate limit exceeded');
            });

            it('creates rate limit error with retry time', () => {
                const error = ErrorFactory.tooManyRequests(60);

                expect(error).toBeInstanceOf(RateLimitError);
                expect(error.context.retryAfter).toBe(60);
            });
        });

        describe('unexpectedError', () => {
            it('creates system error from original error', () => {
                const originalError = new Error('Something went wrong');
                originalError.stack = 'Error stack trace';

                const error = ErrorFactory.unexpectedError(originalError);

                expect(error).toBeInstanceOf(SystemError);
                expect(error.technicalMessage).toContain('Something went wrong');
                expect(error.context.originalError).toBe('Something went wrong');
                expect(error.context.stack).toBe('Error stack trace');
            });
        });
    });

    describe('Error inheritance and instanceof checks', () => {
        it('maintains proper inheritance chain', () => {
            const networkError = new NetworkError('Test');
            const aiError = new AIServiceError('Test');
            const validationError = new ValidationError('field', 'Test');

            expect(networkError).toBeInstanceOf(AppError);
            expect(networkError).toBeInstanceOf(Error);
            expect(aiError).toBeInstanceOf(AppError);
            expect(validationError).toBeInstanceOf(AppError);
        });

        it('allows proper type discrimination', () => {
            const errors: AppError[] = [
                new NetworkError('Network'),
                new AIServiceError('AI'),
                new ValidationError('field', 'Validation'),
            ];

            const networkErrors = errors.filter(e => e instanceof NetworkError);
            const aiErrors = errors.filter(e => e instanceof AIServiceError);
            const validationErrors = errors.filter(e => e instanceof ValidationError);

            expect(networkErrors).toHaveLength(1);
            expect(aiErrors).toHaveLength(1);
            expect(validationErrors).toHaveLength(1);
        });
    });
});
