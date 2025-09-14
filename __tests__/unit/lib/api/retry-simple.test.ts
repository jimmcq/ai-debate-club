/**
 * Simplified unit tests for retry logic
 * Focuses on core functionality without timer complexity
 */

import { withRetry, DEFAULT_RETRY_OPTIONS, CircuitBreaker, CircuitState } from '@/lib/api/retry';

describe('retry logic (simplified)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('withRetry basic functionality', () => {
        it('succeeds immediately when operation succeeds', async () => {
            const mockOperation = jest.fn().mockResolvedValue('success');

            const result = await withRetry(mockOperation);

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(1);
        });

        it('retries on failure and eventually succeeds', async () => {
            const mockOperation = jest
                .fn()
                .mockRejectedValueOnce(new Error('First failure'))
                .mockRejectedValueOnce(new Error('Second failure'))
                .mockResolvedValue('success');

            const onRetry = jest.fn();

            const result = await withRetry(mockOperation, {
                onRetry,
                initialDelay: 1,
                maxDelay: 1,
                retryCondition: () => true, // Retry all errors for this test
            });

            expect(result).toBe('success');
            expect(mockOperation).toHaveBeenCalledTimes(3);
            expect(onRetry).toHaveBeenCalledTimes(2);
        });

        it('respects maximum retry attempts', async () => {
            const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));

            await expect(
                withRetry(mockOperation, {
                    maxRetries: 2,
                    initialDelay: 1,
                    maxDelay: 1,
                    retryCondition: () => true, // Retry all errors for this test
                })
            ).rejects.toThrow('Always fails');

            expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });

        it('uses custom retry condition', async () => {
            const networkError = new Error('Network error');
            const validationError = new Error('Validation error');

            const mockOperation = jest
                .fn()
                .mockRejectedValueOnce(networkError)
                .mockRejectedValueOnce(validationError);

            const retryCondition = jest.fn((error: unknown) => {
                return error instanceof Error && error.message.includes('Network');
            });

            await expect(
                withRetry(mockOperation, {
                    maxRetries: 3,
                    retryCondition,
                    initialDelay: 1,
                    maxDelay: 1,
                })
            ).rejects.toThrow('Validation error');

            expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry for network error
            expect(retryCondition).toHaveBeenCalledWith(networkError);
            expect(retryCondition).toHaveBeenCalledWith(validationError);
        });

        it('calls onRetry callback with correct parameters', async () => {
            const mockOperation = jest.fn().mockRejectedValue(new Error('Test error'));
            const onRetry = jest.fn();

            await expect(
                withRetry(mockOperation, {
                    maxRetries: 2,
                    onRetry,
                    initialDelay: 1,
                    maxDelay: 1,
                    retryCondition: () => true, // Retry all errors for this test
                })
            ).rejects.toThrow('Test error');

            expect(onRetry).toHaveBeenCalledTimes(2);
            expect(onRetry).toHaveBeenNthCalledWith(1, expect.any(Error), 1);
            expect(onRetry).toHaveBeenNthCalledWith(2, expect.any(Error), 2);
        });
    });

    describe('DEFAULT_RETRY_OPTIONS', () => {
        it('has reasonable default values', () => {
            expect(DEFAULT_RETRY_OPTIONS.maxRetries).toBe(3);
            expect(DEFAULT_RETRY_OPTIONS.initialDelay).toBe(1000);
            expect(DEFAULT_RETRY_OPTIONS.maxDelay).toBe(10000);
            expect(DEFAULT_RETRY_OPTIONS.backoffFactor).toBe(2);
        });

        it('default retry condition handles common error scenarios', () => {
            const { retryCondition } = DEFAULT_RETRY_OPTIONS;

            // Network errors should be retryable
            expect(retryCondition?.(new Error('fetch failed'))).toBe(true);
            expect(retryCondition?.(new Error('network timeout'))).toBe(true);

            // HTTP errors should be conditionally retryable
            expect(retryCondition?.({ status: 500 })).toBe(true); // Server error
            expect(retryCondition?.({ status: 502 })).toBe(true); // Bad gateway
            expect(retryCondition?.({ status: 408 })).toBe(true); // Timeout
            expect(retryCondition?.({ status: 429 })).toBe(true); // Rate limit

            // Client errors should not be retryable
            expect(retryCondition?.({ status: 400 })).toBe(false); // Bad request
            expect(retryCondition?.({ status: 404 })).toBe(false); // Not found

            // Non-error objects should not be retryable
            expect(retryCondition?.('string error')).toBe(false);
            expect(retryCondition?.(null)).toBe(false);
            expect(retryCondition?.(undefined)).toBe(false);
        });
    });

    describe('CircuitBreaker', () => {
        let circuitBreaker: CircuitBreaker;

        beforeEach(() => {
            circuitBreaker = new CircuitBreaker({
                failureThreshold: 3,
                recoveryTimeout: 1000, // Short timeout for testing
                monitoringPeriod: 1000,
            });
        });

        it('starts in closed state', () => {
            expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
        });

        it('transitions to open state after failure threshold', async () => {
            const failingOperation = jest.fn().mockRejectedValue(new Error('Service down'));

            // Fail 3 times to reach threshold
            for (let i = 0; i < 3; i++) {
                await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
                    'Service down'
                );
            }

            expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
        });

        it('rejects immediately when circuit is open', async () => {
            const failingOperation = jest.fn().mockRejectedValue(new Error('Service down'));

            // Open the circuit
            for (let i = 0; i < 3; i++) {
                await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
                    'Service down'
                );
            }

            expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

            // Next call should be rejected immediately
            await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
                'Circuit breaker is open'
            );
            expect(failingOperation).toHaveBeenCalledTimes(3); // Not called again
        });

        it('resets failure count on successful operation', async () => {
            const operation = jest
                .fn()
                .mockRejectedValueOnce(new Error('Failure 1'))
                .mockRejectedValueOnce(new Error('Failure 2'))
                .mockResolvedValueOnce('success')
                .mockRejectedValueOnce(new Error('Failure 3'))
                .mockRejectedValueOnce(new Error('Failure 4'));

            // Two failures
            await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure 1');
            await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure 2');

            // Success resets count
            const result = await circuitBreaker.execute(operation);
            expect(result).toBe('success');

            // Two more failures shouldn't open circuit (count was reset)
            await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure 3');
            await expect(circuitBreaker.execute(operation)).rejects.toThrow('Failure 4');

            expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
        });

        it('provides health check information', () => {
            const health = circuitBreaker.getHealth();

            expect(health).toHaveProperty('state');
            expect(health).toHaveProperty('failureCount');
            expect(health).toHaveProperty('lastFailureTime');
            expect(health).toHaveProperty('nextAttemptTime');

            expect(health.state).toBe(CircuitState.CLOSED);
            expect(health.failureCount).toBe(0);
            expect(health.lastFailureTime).toBeNull();
            expect(health.nextAttemptTime).toBeNull();
        });
    });

    describe('integration scenarios', () => {
        it('combines retry logic with circuit breaker', async () => {
            const circuitBreaker = new CircuitBreaker({
                failureThreshold: 2,
                recoveryTimeout: 1000,
            });

            const failingOperation = jest.fn().mockRejectedValue(new Error('Service unavailable'));

            // First attempt with retry should fail multiple times and open circuit
            await expect(
                withRetry(() => circuitBreaker.execute(failingOperation), {
                    maxRetries: 1,
                    initialDelay: 1,
                    maxDelay: 1,
                    retryCondition: () => true, // Retry all errors for this test
                })
            ).rejects.toThrow('Service unavailable');

            // Circuit should be open after 2 failures
            expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

            // Subsequent immediate calls should be circuit broken
            await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow(
                'Circuit breaker is open'
            );
        });

        it('handles mixed success and failure patterns', async () => {
            let callCount = 0;
            const intermittentOperation = jest.fn(() => {
                callCount++;
                if (callCount % 3 === 0) {
                    return Promise.resolve(`success-${callCount}`);
                }
                return Promise.reject(new Error(`failure-${callCount}`));
            });

            // Should eventually succeed on third attempt
            const result = await withRetry(intermittentOperation, {
                maxRetries: 5,
                initialDelay: 1,
                maxDelay: 1,
                retryCondition: () => true, // Retry all errors for this test
            });

            expect(result).toBe('success-3');
            expect(intermittentOperation).toHaveBeenCalledTimes(3);
        });
    });
});
