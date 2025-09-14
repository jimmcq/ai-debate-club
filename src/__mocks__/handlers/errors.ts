/**
 * MSW handlers for testing error scenarios
 * Provides realistic error responses for testing error handling
 */

import { http, HttpResponse } from 'msw';

export const errorHandlers = [
    // Rate limiting scenario
    http.post('/api/debate/start-rate-limited', () => {
        return HttpResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': '60' } }
        );
    }),

    // Server error scenario
    http.post('/api/debate/start-server-error', () => {
        return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
    }),

    // Network timeout scenario
    http.post('/api/debate/start-timeout', () => {
        return new Promise((resolve, reject) => {
            // Simulate timeout after 30 seconds
            setTimeout(() => {
                reject(new Error('Network timeout'));
            }, 30000);
        });
    }),

    // AI service unavailable
    http.post('/api/debate/message-ai-down', () => {
        return HttpResponse.json({ error: 'AI service temporarily unavailable' }, { status: 503 });
    }),

    // Invalid debate ID
    http.post('/api/debate/message-invalid-id', () => {
        return HttpResponse.json({ error: 'Invalid debate ID' }, { status: 400 });
    }),

    // Malformed request
    http.post('/api/debate/start-malformed', () => {
        return HttpResponse.json({ error: 'Malformed request body' }, { status: 422 });
    }),
];
