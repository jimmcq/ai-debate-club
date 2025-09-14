/**
 * MSW handlers for debate API endpoints
 * Provides realistic mock responses for testing debate functionality
 */

import { http, HttpResponse } from 'msw';
import { DebateState, PersonaType } from '@/lib/types/debate';

// Mock debate data generator
export const createMockDebate = (overrides: Partial<DebateState> = {}): DebateState => ({
    id: 'test-debate-123',
    topic: 'Should AI systems be required to explain their decisions?',
    participants: [
        {
            id: 'persona1',
            personaType: 'logician' as PersonaType,
        },
        {
            id: 'persona2',
            personaType: 'showman' as PersonaType,
        },
    ],
    messages: [],
    currentTurn: 1,
    phase: 'opening',
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const debateHandlers = [
    // POST /api/debate/start - Start a new debate
    http.post('/api/debate/start', async ({ request }) => {
        const body = (await request.json()) as {
            topic: string;
            persona1Type: PersonaType;
            persona2Type: PersonaType;
        };

        // Validate request
        if (!body.topic || body.topic.length < 10) {
            return HttpResponse.json(
                { error: 'Topic must be at least 10 characters long' },
                { status: 400 }
            );
        }

        if (body.topic.length > 200) {
            return HttpResponse.json(
                { error: 'Topic must be less than 200 characters' },
                { status: 400 }
            );
        }

        if (body.persona1Type === body.persona2Type) {
            return HttpResponse.json({ error: 'Personas must be different' }, { status: 400 });
        }

        const debate = createMockDebate({
            topic: body.topic,
            participants: [
                { id: 'persona1', personaType: body.persona1Type },
                { id: 'persona2', personaType: body.persona2Type },
            ],
        });

        return HttpResponse.json(debate);
    }),

    // POST /api/debate/message - Generate next message
    http.post('/api/debate/message', async ({ request }) => {
        const body = (await request.json()) as {
            debateId: string;
            curveball?: string;
        };

        if (!body.debateId) {
            return HttpResponse.json({ error: 'Debate ID is required' }, { status: 400 });
        }

        // Simulate AI response generation
        const mockMessage = {
            id: `msg-${Date.now()}`,
            participantId: Math.random() > 0.5 ? 'persona1' : 'persona2',
            content: 'This is a mock AI response for testing purposes.',
            timestamp: new Date().toISOString(),
            curveball: body.curveball,
        };

        const updatedDebate = createMockDebate({
            messages: [mockMessage],
            currentTurn: 2,
            phase: 'rebuttal',
        });

        return HttpResponse.json({
            debate: updatedDebate,
            message: mockMessage,
        });
    }),

    // GET /api/debate/:id - Get debate by ID
    http.get('/api/debate/:id', ({ params }) => {
        const { id } = params;

        if (!id) {
            return HttpResponse.json({ error: 'Debate ID is required' }, { status: 400 });
        }

        if (id === 'not-found') {
            return HttpResponse.json({ error: 'Debate not found' }, { status: 404 });
        }

        const debate = createMockDebate({
            id: id as string,
        });

        return HttpResponse.json(debate);
    }),
];
