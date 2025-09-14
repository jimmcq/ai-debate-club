/**
 * Integration tests for complete debate flow
 * Tests integration between debate utils, personas, and error handling
 */

import {
    createDebate,
    getDebatePhase,
    getCurrentTurnNumber,
    canAddCurveball,
    isDebateComplete,
    getNextParticipant,
} from '@/lib/debate/utils';
import { getPersonaConfig, getAllPersonaTypes } from '@/lib/personas';
import { DebateState, DebateMessage, PersonaType } from '@/lib/types/debate';
import { ValidationError, DebateError, ErrorFactory } from '@/lib/errors/types';
import { withRetry, DEFAULT_RETRY_OPTIONS } from '@/lib/api/retry';

// Simulate a complete debate message to test integration
function createDebateMessage(
    participantId: 'persona1' | 'persona2',
    content: string,
    turn: number,
    curveball?: string
): DebateMessage {
    return {
        id: `msg-${Date.now()}-${participantId}`,
        participantId,
        content,
        timestamp: new Date().toISOString(),
        turn,
        curveball,
    };
}

// Simulate adding a message to a debate state
function addMessageToDebate(debate: DebateState, message: DebateMessage): DebateState {
    const newMessages = [...debate.messages, message];
    const newTurnNumber = getCurrentTurnNumber(newMessages.length);
    const newPhase = getDebatePhase(message.turn);

    return {
        ...debate,
        messages: newMessages,
        currentTurn: newTurnNumber,
        phase: newPhase,
    };
}

describe('Complete Debate Flow Integration', () => {
    describe('End-to-End Debate Simulation', () => {
        it('executes a complete debate flow from creation to completion', () => {
            // Create initial debate
            const debate = createDebate(
                'Are video games a legitimate form of artistic expression?',
                'philosopher',
                'comedian'
            );

            expect(debate.phase).toBe('opening');
            expect(debate.currentTurn).toBe(1);

            let currentDebate = debate;
            const messageContents: string[] = [];

            // Simulate complete 8-message debate
            for (let turn = 1; turn <= 8; turn++) {
                const participantId = getNextParticipant(turn);
                const personaType = currentDebate.participants.find(
                    p => p.id === participantId
                )?.personaType;
                getPersonaConfig(personaType!); // Validate persona exists

                // Simulate message content based on persona and turn
                let content: string;
                if (personaType === 'philosopher') {
                    content = `From a philosophical perspective on turn ${turn}: Deep contemplation of the artistic nature of interactive media...`;
                } else {
                    content = `With comedic insight on turn ${turn}: Well, if Pong is art, then my microwave must be the Louvre!`;
                }

                const message = createDebateMessage(participantId, content, turn);
                currentDebate = addMessageToDebate(currentDebate, message);
                messageContents.push(content);

                // Verify phase transitions
                const expectedPhase = getDebatePhase(turn);
                expect(currentDebate.phase).toBe(expectedPhase);

                // Verify curveball availability
                if (canAddCurveball(turn)) {
                    expect(currentDebate.phase).toBe('rebuttal');
                    expect(turn).toBeGreaterThanOrEqual(3);
                    expect(turn).toBeLessThanOrEqual(6);
                }
            }

            // Verify final state
            expect(currentDebate.messages).toHaveLength(8);
            expect(currentDebate.phase).toBe('closing');
            expect(isDebateComplete(currentDebate.messages.length + 1)).toBe(true);
            expect(messageContents).toHaveLength(8);

            // Verify participant alternation
            currentDebate.messages.forEach((message, index) => {
                const expectedParticipant = index % 2 === 0 ? 'persona1' : 'persona2';
                expect(message.participantId).toBe(expectedParticipant);
            });
        });

        it('handles curveball integration during rebuttal phase', () => {
            const debate = createDebate(
                'Should AI systems be required to explain their decisions?',
                'scientist',
                'lawyer'
            );

            let currentDebate = debate;

            // Progress to rebuttal phase (after 2 messages)
            for (let turn = 1; turn <= 3; turn++) {
                const participantId = getNextParticipant(turn);
                const message = createDebateMessage(participantId, `Message ${turn} content`, turn);
                currentDebate = addMessageToDebate(currentDebate, message);
            }

            expect(currentDebate.phase).toBe('rebuttal');
            expect(canAddCurveball(3)).toBe(true);

            // Add curveball to next message
            const participantId = getNextParticipant(4);
            const messageWithCurveball = createDebateMessage(
                participantId,
                'Response incorporating the curveball perspective...',
                4,
                'What about the environmental impact of AI computation?'
            );

            currentDebate = addMessageToDebate(currentDebate, messageWithCurveball);

            // Verify curveball was added correctly
            const lastMessage = currentDebate.messages[currentDebate.messages.length - 1];
            expect(lastMessage.curveball).toBe(
                'What about the environmental impact of AI computation?'
            );
            expect(lastMessage.content).toContain('curveball perspective');
        });
    });

    describe('Error Handling Integration', () => {
        it('integrates error handling with debate validation', () => {
            // Test various error scenarios that would occur in real usage

            // Invalid persona type error
            expect(() => {
                getPersonaConfig('nonexistent' as PersonaType);
            }).toThrow('Unknown persona type: nonexistent');

            // Validation errors for debate creation
            const topicError = ErrorFactory.invalidTopic('');
            expect(topicError).toBeInstanceOf(ValidationError);
            expect(topicError.message).toContain('invalid');
            expect(topicError.severity).toBe('low'); // ValidationError has low severity by default

            // Debate state errors
            const debateError = ErrorFactory.debateNotFound('debate-123');
            expect(debateError).toBeInstanceOf(DebateError);
            expect(debateError.retryable).toBe(false);
            expect(debateError.context).toEqual({ debateId: 'debate-123' });
        });

        it('integrates retry logic with persona operations', async () => {
            let attemptCount = 0;

            // Simulate a flaky operation that might fail in a real AI service call
            const flakyPersonaOperation = async (): Promise<string> => {
                attemptCount++;

                if (attemptCount <= 2) {
                    throw ErrorFactory.aiResponseFailed(attemptCount, 3);
                }

                // Success on third attempt
                const config = getPersonaConfig('logician');
                return config.systemPrompt;
            };

            // Use retry logic with the operation
            const result = await withRetry(flakyPersonaOperation, {
                ...DEFAULT_RETRY_OPTIONS,
                maxRetries: 3,
                retryCondition: error => {
                    // Retry on AI service errors that are marked as retryable
                    if (error instanceof Error && error.message.includes('AI response failed')) {
                        // Check if it's a retryable AI service error
                        return (error as Error & { retryable?: boolean }).retryable !== false;
                    }
                    return false;
                },
            });

            expect(result).toContain('The Logician');
            expect(attemptCount).toBe(3); // Should have retried twice
        });
    });

    describe('Data Consistency and State Management', () => {
        it('maintains consistent state throughout debate progression', () => {
            const initialDebate = createDebate(
                'Will quantum computing revolutionize cybersecurity?',
                'scientist',
                'contrarian'
            );

            let currentDebate = initialDebate;
            const stateHistory: DebateState[] = [currentDebate];

            // Add messages and track state changes
            for (let turn = 1; turn <= 6; turn++) {
                const participantId = getNextParticipant(turn);
                const message = createDebateMessage(
                    participantId,
                    `Turn ${turn}: Detailed argument about quantum computing security implications...`,
                    turn
                );

                currentDebate = addMessageToDebate(currentDebate, message);
                stateHistory.push({ ...currentDebate });
            }

            // Verify state consistency
            stateHistory.forEach((state, index) => {
                expect(state.id).toBe(initialDebate.id); // ID never changes
                expect(state.topic).toBe(initialDebate.topic); // Topic never changes
                expect(state.participants).toEqual(initialDebate.participants); // Participants never change
                expect(state.messages).toHaveLength(index); // Message count increases

                if (index > 0) {
                    expect(state.currentTurn).toBeGreaterThanOrEqual(
                        stateHistory[index - 1].currentTurn
                    );
                }
            });

            // Verify phase progression logic
            const finalState = stateHistory[stateHistory.length - 1];
            expect(finalState.phase).toBe('rebuttal'); // 6 messages should be in rebuttal
            expect(finalState.messages).toHaveLength(6);
        });

        it('handles edge cases in state transitions', () => {
            createDebate('Edge case topic?', 'diplomat', 'showman');

            // Test empty state
            expect(getCurrentTurnNumber(0)).toBe(1);
            expect(getDebatePhase(0)).toBe('opening');
            expect(canAddCurveball(0)).toBe(false);

            // Test boundary conditions
            expect(getDebatePhase(2)).toBe('opening'); // Last opening turn
            expect(getDebatePhase(3)).toBe('rebuttal'); // First rebuttal turn
            expect(canAddCurveball(3)).toBe(true); // First curveball opportunity
            expect(canAddCurveball(6)).toBe(true); // Last curveball opportunity
            expect(canAddCurveball(7)).toBe(false); // No curveball in closing

            expect(getDebatePhase(8)).toBe('closing'); // Last closing turn
            expect(getDebatePhase(9)).toBe('complete'); // First complete turn
            expect(isDebateComplete(9)).toBe(true); // Debate is complete
        });
    });

    describe('Persona Configuration Integration', () => {
        it('integrates persona configurations with debate flow', () => {
            const allPersonas = getAllPersonaTypes();

            // Test creating debates with all persona combinations
            allPersonas.slice(0, 3).forEach(persona1 => {
                allPersonas.slice(-3).forEach(persona2 => {
                    const debate = createDebate(
                        `Test topic for ${persona1} vs ${persona2}?`,
                        persona1,
                        persona2
                    );

                    expect(debate.participants[0].personaType).toBe(persona1);
                    expect(debate.participants[1].personaType).toBe(persona2);

                    // Verify persona configs are accessible
                    const config1 = getPersonaConfig(persona1);
                    const config2 = getPersonaConfig(persona2);

                    expect(config1.name).toBeTruthy();
                    expect(config1.systemPrompt).toContain(config1.name);
                    expect(config2.name).toBeTruthy();
                    expect(config2.systemPrompt).toContain(config2.name);

                    // Verify personas have distinct characteristics
                    expect(config1.name).not.toBe(config2.name);
                    expect(config1.description).not.toBe(config2.description);
                });
            });
        });

        it('handles persona-specific message generation context', () => {
            createDebate('Is space exploration worth the investment?', 'philosopher', 'scientist');

            // Simulate how different personas would approach the topic
            const philosopherConfig = getPersonaConfig('philosopher');
            const scientistConfig = getPersonaConfig('scientist');

            // Verify persona-specific characteristics are available for message generation
            expect(philosopherConfig.systemPrompt).toContain('philosophical');
            expect(philosopherConfig.systemPrompt).toContain('fundamental questions');
            expect(philosopherConfig.style).toContain('Contemplative'); // Capital C in style

            expect(scientistConfig.systemPrompt).toContain('empirical evidence');
            expect(scientistConfig.systemPrompt).toContain('scientific methodology');
            expect(scientistConfig.style).toContain('evidence-driven');

            // Verify turn alternation works with persona context
            expect(getNextParticipant(1)).toBe('persona1'); // Philosopher starts
            expect(getNextParticipant(2)).toBe('persona2'); // Scientist responds
            expect(getNextParticipant(3)).toBe('persona1'); // Philosopher continues
        });
    });
});
