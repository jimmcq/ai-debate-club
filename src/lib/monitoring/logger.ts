/**
 * Error logging and monitoring system
 * Provides structured logging with different severity levels and integrations
 */

import { AppError, ErrorCategory, ErrorSeverity } from '@/lib/errors/types';

/**
 * Log levels for different types of events
 */
export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
}

/**
 * Structured log entry format
 */
export interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    context?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
        category?: ErrorCategory;
        severity?: ErrorSeverity;
    };
    user?: {
        id?: string;
        sessionId: string;
    };
    performance?: {
        duration?: number;
        memory?: number;
    };
    metadata: {
        userAgent: string;
        url: string;
        referrer: string;
        sessionId: string;
    };
}

/**
 * Logger configuration
 */
interface LoggerConfig {
    enabled: boolean;
    level: LogLevel;
    endpoint?: string;
    apiKey?: string;
    bufferSize: number;
    flushInterval: number;
    enableConsole: boolean;
    enableRemote: boolean;
}

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
    enabled: process.env.NODE_ENV === 'production',
    level: process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG,
    endpoint: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT,
    apiKey: process.env.NEXT_PUBLIC_LOGGING_API_KEY,
    bufferSize: 100,
    flushInterval: 30000, // 30 seconds
    enableConsole: process.env.NODE_ENV === 'development',
    enableRemote: !!process.env.NEXT_PUBLIC_LOGGING_ENDPOINT,
};

/**
 * Logger class with buffering and remote logging capabilities
 */
class Logger {
    private config: LoggerConfig;
    private buffer: LogEntry[] = [];
    private flushTimer?: NodeJS.Timeout;
    private sessionId: string;

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.sessionId = this.generateSessionId();

        if (this.config.enabled && this.config.enableRemote) {
            this.startFlushTimer();
        }

        // Handle page unload to flush remaining logs
        if (typeof window !== 'undefined') {
            window.addEventListener('beforeunload', () => {
                this.flushSync();
            });

            // Handle visibility change for mobile apps
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    this.flushSync();
                }
            });
        }
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Start periodic buffer flushing
     */
    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    /**
     * Check if log level should be processed
     */
    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false;

        const levels = [
            LogLevel.DEBUG,
            LogLevel.INFO,
            LogLevel.WARN,
            LogLevel.ERROR,
            LogLevel.FATAL,
        ];
        const currentIndex = levels.indexOf(this.config.level);
        const messageIndex = levels.indexOf(level);

        return messageIndex >= currentIndex;
    }

    /**
     * Create metadata for log entry
     */
    private createMetadata(): LogEntry['metadata'] {
        if (typeof window === 'undefined') {
            return {
                userAgent: 'server',
                url: 'server',
                referrer: 'server',
                sessionId: this.sessionId,
            };
        }

        return {
            userAgent: navigator.userAgent,
            url: window.location.href,
            referrer: document.referrer,
            sessionId: this.sessionId,
        };
    }

    /**
     * Create structured log entry
     */
    private createLogEntry(
        level: LogLevel,
        message: string,
        context?: Record<string, unknown>,
        error?: AppError | Error
    ): LogEntry {
        const entry: LogEntry = {
            level,
            message,
            timestamp: new Date().toISOString(),
            context,
            metadata: this.createMetadata(),
        };

        // Add error details if provided
        if (error) {
            entry.error = {
                name: error.name,
                message: error.message,
                stack: error.stack,
            };

            if (error instanceof AppError) {
                entry.error.category = error.category;
                entry.error.severity = error.severity;
            }
        }

        // Add performance metrics if available
        if (typeof window !== 'undefined' && 'performance' in window) {
            try {
                const memory = (
                    performance as Performance & { memory?: { usedJSHeapSize: number } }
                ).memory;
                entry.performance = {
                    memory: memory?.usedJSHeapSize,
                };
            } catch {
                // Performance API might not be available
            }
        }

        return entry;
    }

    /**
     * Add log entry to buffer and console
     */
    private addToBuffer(entry: LogEntry): void {
        this.buffer.push(entry);

        // Console logging for development
        if (this.config.enableConsole) {
            const consoleMethod =
                entry.level === LogLevel.ERROR || entry.level === LogLevel.FATAL
                    ? console.error
                    : entry.level === LogLevel.WARN
                      ? console.warn
                      : console.log;

            consoleMethod(`[${entry.level.toUpperCase()}] ${entry.message}`, {
                context: entry.context,
                error: entry.error,
                metadata: entry.metadata,
            });
        }

        // Flush if buffer is full
        if (this.buffer.length >= this.config.bufferSize) {
            this.flush();
        }
    }

    /**
     * Flush logs to remote endpoint
     */
    private async flush(): Promise<void> {
        if (!this.config.enableRemote || !this.config.endpoint || this.buffer.length === 0) {
            return;
        }

        const logs = this.buffer.splice(0);

        try {
            const response = await fetch(this.config.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
                },
                body: JSON.stringify({ logs }),
            });

            if (!response.ok) {
                // Re-add logs to buffer if request failed
                this.buffer.unshift(...logs);
                console.warn('Failed to send logs to remote endpoint:', response.status);
            }
        } catch (error) {
            // Re-add logs to buffer if request failed
            this.buffer.unshift(...logs);
            console.warn('Failed to send logs to remote endpoint:', error);
        }
    }

    /**
     * Synchronously flush remaining logs (for page unload)
     */
    private flushSync(): void {
        if (!this.config.enableRemote || !this.config.endpoint || this.buffer.length === 0) {
            return;
        }

        const logs = this.buffer.splice(0);

        try {
            // Use sendBeacon for reliable delivery during page unload
            if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
                const blob = new Blob([JSON.stringify({ logs })], { type: 'application/json' });
                navigator.sendBeacon(this.config.endpoint, blob);
            }
        } catch (error) {
            console.warn('Failed to send logs via beacon:', error);
        }
    }

    /**
     * Public logging methods
     */
    debug(message: string, context?: Record<string, unknown>): void {
        if (!this.shouldLog(LogLevel.DEBUG)) return;
        this.addToBuffer(this.createLogEntry(LogLevel.DEBUG, message, context));
    }

    info(message: string, context?: Record<string, unknown>): void {
        if (!this.shouldLog(LogLevel.INFO)) return;
        this.addToBuffer(this.createLogEntry(LogLevel.INFO, message, context));
    }

    warn(message: string, context?: Record<string, unknown>, error?: Error): void {
        if (!this.shouldLog(LogLevel.WARN)) return;
        this.addToBuffer(this.createLogEntry(LogLevel.WARN, message, context, error));
    }

    error(message: string, error?: AppError | Error, context?: Record<string, unknown>): void {
        if (!this.shouldLog(LogLevel.ERROR)) return;
        this.addToBuffer(this.createLogEntry(LogLevel.ERROR, message, context, error));
    }

    fatal(message: string, error?: AppError | Error, context?: Record<string, unknown>): void {
        if (!this.shouldLog(LogLevel.FATAL)) return;
        this.addToBuffer(this.createLogEntry(LogLevel.FATAL, message, context, error));

        // Immediately flush fatal errors
        this.flush();
    }

    /**
     * Log API request with performance metrics
     */
    apiRequest(method: string, url: string, duration: number, status: number, error?: Error): void {
        const level =
            status >= 400 ? LogLevel.ERROR : status >= 300 ? LogLevel.WARN : LogLevel.INFO;
        const message = `API ${method} ${url} - ${status} (${duration}ms)`;

        const entry = this.createLogEntry(
            level,
            message,
            {
                api: { method, url, status, duration },
            },
            error
        );

        if (entry.performance) {
            entry.performance.duration = duration;
        }

        this.addToBuffer(entry);
    }

    /**
     * Log user interaction
     */
    userAction(action: string, context?: Record<string, unknown>): void {
        this.info(`User action: ${action}`, {
            ...context,
            userAction: action,
        });
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flushSync();
    }
}

// Export singleton instance
export const logger = new Logger();

// Export class for testing
export { Logger };
