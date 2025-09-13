'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { ErrorSeverity, AppError } from '@/lib/errors/types';

/**
 * Toast types and configurations
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message: string;
    duration?: number;
    retryable?: boolean;
    onRetry?: () => void;
}

/**
 * Toast configuration mapping from error severity
 */
const SEVERITY_TO_TOAST_TYPE: Record<ErrorSeverity, ToastType> = {
    [ErrorSeverity.LOW]: 'info',
    [ErrorSeverity.MEDIUM]: 'warning',
    [ErrorSeverity.HIGH]: 'error',
    [ErrorSeverity.CRITICAL]: 'error'
};

/**
 * Toast styling configurations
 */
const TOAST_STYLES: Record<ToastType, {
    container: string;
    icon: string;
    iconBg: string;
    title: string;
}> = {
    success: {
        container: 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800',
        icon: '✅',
        iconBg: 'bg-green-100 dark:bg-green-800',
        title: 'text-green-800 dark:text-green-200'
    },
    error: {
        container: 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800',
        icon: '❌',
        iconBg: 'bg-red-100 dark:bg-red-800',
        title: 'text-red-800 dark:text-red-200'
    },
    warning: {
        container: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800',
        icon: '⚠️',
        iconBg: 'bg-yellow-100 dark:bg-yellow-800',
        title: 'text-yellow-800 dark:text-yellow-200'
    },
    info: {
        container: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800',
        icon: 'ℹ️',
        iconBg: 'bg-blue-100 dark:bg-blue-800',
        title: 'text-blue-800 dark:text-blue-200'
    }
};

/**
 * Individual Toast Component
 */
const ToastComponent: React.FC<{
    toast: Toast;
    onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const style = TOAST_STYLES[toast.type];

    const handleDismiss = useCallback(() => {
        setIsExiting(true);
        setTimeout(() => {
            onDismiss(toast.id);
        }, 300);
    }, [toast.id, onDismiss]);

    useEffect(() => {
        // Animate in
        setTimeout(() => setIsVisible(true), 10);

        // Auto dismiss
        if (toast.duration !== 0) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, toast.duration || 5000);

            return () => clearTimeout(timer);
        }
    }, [toast.duration, handleDismiss]);

    return (
        <div
            className={`
                transform transition-all duration-300 ease-in-out
                ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                max-w-md w-full border rounded-lg shadow-lg p-4 pointer-events-auto
                ${style.container}
            `}
        >
            <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.iconBg}`}>
                    <span className="text-sm">{style.icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold ${style.title}`}>
                        {toast.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {toast.message}
                    </p>

                    {toast.retryable && toast.onRetry && (
                        <button
                            onClick={toast.onRetry}
                            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Try Again
                        </button>
                    )}
                </div>

                <button
                    onClick={handleDismiss}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                    <span className="sr-only">Dismiss</span>
                    <span className="text-lg">×</span>
                </button>
            </div>
        </div>
    );
};

/**
 * Toast Context
 */
interface ToastContextType {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => string;
    removeToast: (id: string) => void;
    showError: (error: AppError, onRetry?: () => void) => void;
    showSuccess: (title: string, message: string) => void;
    showWarning: (title: string, message: string) => void;
    showInfo: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newToast = { ...toast, id };

        setToasts(prev => [...prev, newToast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const showError = useCallback((error: AppError, onRetry?: () => void) => {
        const toastType = SEVERITY_TO_TOAST_TYPE[error.severity];

        addToast({
            type: toastType,
            title: error.name.replace('Error', ' Error'),
            message: error.userMessage,
            duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 6000,
            retryable: error.retryable && !!onRetry,
            onRetry
        });
    }, [addToast]);

    const showSuccess = useCallback((title: string, message: string) => {
        addToast({ type: 'success', title, message, duration: 4000 });
    }, [addToast]);

    const showWarning = useCallback((title: string, message: string) => {
        addToast({ type: 'warning', title, message, duration: 5000 });
    }, [addToast]);

    const showInfo = useCallback((title: string, message: string) => {
        addToast({ type: 'info', title, message, duration: 4000 });
    }, [addToast]);

    return (
        <ToastContext.Provider value={{
            toasts,
            addToast,
            removeToast,
            showError,
            showSuccess,
            showWarning,
            showInfo
        }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <ToastComponent
                        key={toast.id}
                        toast={toast}
                        onDismiss={removeToast}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};