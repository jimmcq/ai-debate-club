/**
 * React hooks for error monitoring and performance tracking
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AppError } from '@/lib/errors/types';
import { logger } from './logger';

/**
 * Hook for tracking and logging errors with automatic context
 */
export function useErrorLogger(componentName: string) {
    const logError = useCallback(
        (error: AppError | Error, action?: string, context?: Record<string, unknown>) => {
            const message = `Error in ${componentName}${action ? ` during ${action}` : ''}`;

            logger.error(message, error, {
                component: componentName,
                action,
                ...context,
            });
        },
        [componentName]
    );

    const logWarning = useCallback(
        (message: string, context?: Record<string, unknown>) => {
            logger.warn(`Warning in ${componentName}: ${message}`, {
                component: componentName,
                ...context,
            });
        },
        [componentName]
    );

    const logInfo = useCallback(
        (message: string, context?: Record<string, unknown>) => {
            logger.info(`${componentName}: ${message}`, {
                component: componentName,
                ...context,
            });
        },
        [componentName]
    );

    const logUserAction = useCallback(
        (action: string, context?: Record<string, unknown>) => {
            logger.userAction(action, {
                component: componentName,
                ...context,
            });
        },
        [componentName]
    );

    return {
        logError,
        logWarning,
        logInfo,
        logUserAction,
    };
}

/**
 * Hook for tracking API call performance and logging
 */
export function useApiLogger() {
    const logApiCall = useCallback(
        async <T>(
            method: string,
            url: string,
            apiCall: () => Promise<T>,
            context?: Record<string, unknown>
        ): Promise<T> => {
            const startTime = performance.now();
            let status = 0;
            let error: Error | undefined;

            try {
                const result = await apiCall();
                status = 200; // Assume success if no error thrown

                const duration = Math.round(performance.now() - startTime);
                logger.apiRequest(method, url, duration, status);

                return result;
            } catch (err) {
                error = err as Error;

                // Try to extract status from error message or assume 500
                status = extractStatusFromError(err) || 500;

                const duration = Math.round(performance.now() - startTime);
                logger.apiRequest(method, url, duration, status, error);

                // Log additional context for failed requests
                logger.error(`API call failed: ${method} ${url}`, error as AppError | Error, {
                    api: { method, url, status, duration },
                    ...context,
                });

                throw err;
            }
        },
        []
    );

    return { logApiCall };
}

/**
 * Extract HTTP status from error (works with fetch errors and our custom errors)
 */
function extractStatusFromError(error: unknown): number | null {
    if (typeof error === 'object' && error !== null) {
        const err = error as Record<string, unknown>;

        // Try different common patterns
        if (typeof err.status === 'number') return err.status;
        const response = err.response as Record<string, unknown> | undefined;
        if (response && typeof response.status === 'number') return response.status;
        if (typeof err.statusCode === 'number') return err.statusCode;

        // Parse from error message patterns like "HTTP 429" or "Status: 500"
        const message = (err.message as string) || '';
        const httpMatch = message.match(/HTTP\s+(\d{3})/i);
        const statusMatch = message.match(/status:?\s+(\d{3})/i);

        if (httpMatch) return parseInt(httpMatch[1], 10);
        if (statusMatch) return parseInt(statusMatch[1], 10);
    }

    return null;
}

/**
 * Hook for performance monitoring with automatic logging
 */
export function usePerformanceMonitor(operationName: string) {
    const startTime = useRef<number | null>(null);

    const start = useCallback(() => {
        startTime.current = performance.now();
    }, []);

    const end = useCallback(
        (context?: Record<string, unknown>) => {
            if (startTime.current !== null) {
                const duration = Math.round(performance.now() - startTime.current);

                logger.info(`Performance: ${operationName} completed in ${duration}ms`, {
                    operation: operationName,
                    duration,
                    ...context,
                });

                // Log slow operations as warnings
                if (duration > 1000) {
                    // More than 1 second
                    logger.warn(`Slow operation: ${operationName} took ${duration}ms`, {
                        operation: operationName,
                        duration,
                        ...context,
                    });
                }

                startTime.current = null;
                return duration;
            }
            return 0;
        },
        [operationName]
    );

    const measure = useCallback(
        async <T>(operation: () => Promise<T>, context?: Record<string, unknown>): Promise<T> => {
            start();
            try {
                const result = await operation();
                end(context);
                return result;
            } catch (error) {
                const duration = end(context);
                logger.error(
                    `Operation ${operationName} failed after ${duration}ms`,
                    error as Error,
                    {
                        operation: operationName,
                        duration,
                        ...context,
                    }
                );
                throw error;
            }
        },
        [operationName, start, end]
    );

    return { start, end, measure };
}

/**
 * Hook for component lifecycle monitoring
 */
export function useComponentMonitor(componentName: string) {
    const renderCount = useRef(0);
    const mountTime = useRef<number | null>(null);

    // Track component mounts and unmounts
    useEffect(() => {
        mountTime.current = performance.now();

        logger.debug(`Component ${componentName} mounted`, {
            component: componentName,
            mountTime: mountTime.current,
        });

        // Capture ref values in effect scope to avoid stale closure warning
        const currentMountTime = mountTime.current;
        const currentRenderCount = renderCount.current;

        return () => {
            const unmountTime = performance.now();
            const lifespan = currentMountTime ? unmountTime - currentMountTime : 0;

            logger.debug(`Component ${componentName} unmounted after ${Math.round(lifespan)}ms`, {
                component: componentName,
                lifespan: Math.round(lifespan),
                renderCount: currentRenderCount,
            });
        };
    }, [componentName]);

    // Track renders
    useEffect(() => {
        renderCount.current++;

        // Log excessive re-renders
        if (renderCount.current > 50) {
            logger.warn(`Component ${componentName} has rendered ${renderCount.current} times`, {
                component: componentName,
                renderCount: renderCount.current,
            });
        }
    });

    return {
        renderCount: renderCount.current,
    };
}

/**
 * Hook for user interaction tracking
 */
export function useUserInteractionTracker(componentName: string) {
    const trackClick = useCallback(
        (element: string, context?: Record<string, unknown>) => {
            logger.userAction(`click_${element}`, {
                component: componentName,
                element,
                ...context,
            });
        },
        [componentName]
    );

    const trackFormSubmit = useCallback(
        (formName: string, context?: Record<string, unknown>) => {
            logger.userAction(`submit_${formName}`, {
                component: componentName,
                form: formName,
                ...context,
            });
        },
        [componentName]
    );

    const trackInputChange = useCallback(
        (fieldName: string, context?: Record<string, unknown>) => {
            // Only track significant input changes to avoid spam
            logger.debug(`Input change in ${componentName}: ${fieldName}`, {
                component: componentName,
                field: fieldName,
                ...context,
            });
        },
        [componentName]
    );

    const trackNavigation = useCallback(
        (from: string, to: string, context?: Record<string, unknown>) => {
            logger.userAction(`navigate_${from}_to_${to}`, {
                component: componentName,
                from,
                to,
                ...context,
            });
        },
        [componentName]
    );

    return {
        trackClick,
        trackFormSubmit,
        trackInputChange,
        trackNavigation,
    };
}

/**
 * Hook for automatic error boundary integration
 */
export function useErrorBoundaryLogger(componentName: string) {
    const logBoundaryError = useCallback(
        (error: Error, errorInfo: { componentStack: string }) => {
            logger.fatal(`Error boundary caught error in ${componentName}`, error, {
                component: componentName,
                errorBoundary: true,
                componentStack: errorInfo.componentStack,
            });
        },
        [componentName]
    );

    return { logBoundaryError };
}
