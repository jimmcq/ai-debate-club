'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logger } from '@/lib/monitoring/logger';

interface DebateErrorBoundaryProps {
    children: ReactNode;
    onError?: (error: Error) => void;
}

export default function DebateErrorBoundary({ children, onError }: DebateErrorBoundaryProps) {
    const handleError = (error: Error) => {
        // Log debate-specific error context
        logger.error('Debate component error', error, {
            component: 'DebateErrorBoundary',
            debateSystem: true
        });

        onError?.(error);
    };

    const DebateFallback = (
        <div className="flex flex-col items-center justify-center min-h-[600px] p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-center space-y-6">
                <div className="text-8xl">🎭</div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Debate Interrupted
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-lg">
                    We encountered an issue with the debate system. Don&apos;t worry - your progress is safe.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        What you can do:
                    </h3>
                    <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                        <li>• Try refreshing the page</li>
                        <li>• Start a new debate</li>
                        <li>• Check your internet connection</li>
                        <li>• Contact support if the issue persists</li>
                    </ul>
                </div>
                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-semibold"
                    >
                        Refresh Debate
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 font-semibold"
                    >
                        Start Over
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <ErrorBoundary fallback={DebateFallback} onError={handleError}>
            {children}
        </ErrorBoundary>
    );
}

// Specialized error boundary for individual debate components
export function DebateComponentBoundary({
    children,
    componentName
}: {
    children: ReactNode;
    componentName: string;
}) {
    const ComponentFallback = (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-3">
                <div className="text-yellow-600 dark:text-yellow-400">⚠️</div>
                <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                        Component Error
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        The {componentName} component encountered an issue. The rest of the debate continues normally.
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <ErrorBoundary fallback={ComponentFallback}>
            {children}
        </ErrorBoundary>
    );
}