/**
 * Unit tests for debate utility functions
 * These tests ensure core debate logic works correctly
 */

import {
    getDebatePhase,
    isDebateComplete,
    getCurrentTurnNumber,
    canAddCurveball,
    getRandomTopic,
} from '@/lib/debate/utils';

describe('debate utils', () => {
    describe('getDebatePhase', () => {
        it('returns "opening" for turns 1-2', () => {
            expect(getDebatePhase(1)).toBe('opening');
            expect(getDebatePhase(2)).toBe('opening');
        });

        it('returns "rebuttal" for turns 3-6', () => {
            expect(getDebatePhase(3)).toBe('rebuttal');
            expect(getDebatePhase(4)).toBe('rebuttal');
            expect(getDebatePhase(5)).toBe('rebuttal');
            expect(getDebatePhase(6)).toBe('rebuttal');
        });

        it('returns "closing" for turns 7-8', () => {
            expect(getDebatePhase(7)).toBe('closing');
            expect(getDebatePhase(8)).toBe('closing');
        });

        it('returns "complete" for turns > 8', () => {
            expect(getDebatePhase(9)).toBe('complete');
            expect(getDebatePhase(10)).toBe('complete');
            expect(getDebatePhase(100)).toBe('complete');
        });

        it('handles edge case of turn 0', () => {
            expect(getDebatePhase(0)).toBe('opening');
        });

        it('handles negative turns gracefully', () => {
            expect(getDebatePhase(-1)).toBe('opening');
        });
    });

    describe('isDebateComplete', () => {
        it('returns false for incomplete debates', () => {
            expect(isDebateComplete(1)).toBe(false);
            expect(isDebateComplete(4)).toBe(false);
            expect(isDebateComplete(8)).toBe(false);
        });

        it('returns true for complete debates', () => {
            expect(isDebateComplete(9)).toBe(true);
            expect(isDebateComplete(10)).toBe(true);
        });

        it('handles edge cases', () => {
            expect(isDebateComplete(0)).toBe(false);
            expect(isDebateComplete(-1)).toBe(false);
        });
    });

    describe('getCurrentTurnNumber', () => {
        it('calculates turn number from message count correctly', () => {
            expect(getCurrentTurnNumber(0)).toBe(1);
            expect(getCurrentTurnNumber(1)).toBe(1);
            expect(getCurrentTurnNumber(2)).toBe(2);
            expect(getCurrentTurnNumber(3)).toBe(2);
            expect(getCurrentTurnNumber(4)).toBe(3);
            expect(getCurrentTurnNumber(8)).toBe(4);
        });

        it('handles high message counts', () => {
            expect(getCurrentTurnNumber(10)).toBe(5);
            expect(getCurrentTurnNumber(100)).toBe(50);
        });

        it('handles edge case of negative message count', () => {
            expect(getCurrentTurnNumber(-1)).toBe(1);
            expect(getCurrentTurnNumber(-10)).toBe(1);
        });
    });

    describe('canAddCurveball', () => {
        it('allows curveballs during rebuttal phase', () => {
            expect(canAddCurveball(3)).toBe(true);
            expect(canAddCurveball(4)).toBe(true);
            expect(canAddCurveball(5)).toBe(true);
            expect(canAddCurveball(6)).toBe(true);
        });

        it('prevents curveballs during opening phase', () => {
            expect(canAddCurveball(1)).toBe(false);
            expect(canAddCurveball(2)).toBe(false);
        });

        it('prevents curveballs during closing phase', () => {
            expect(canAddCurveball(7)).toBe(false);
            expect(canAddCurveball(8)).toBe(false);
        });

        it('prevents curveballs after debate completion', () => {
            expect(canAddCurveball(9)).toBe(false);
            expect(canAddCurveball(10)).toBe(false);
        });

        it('handles edge cases', () => {
            expect(canAddCurveball(0)).toBe(false);
            expect(canAddCurveball(-1)).toBe(false);
        });
    });

    describe('getRandomTopic', () => {
        it('returns a valid topic string', () => {
            const topic = getRandomTopic();
            expect(typeof topic).toBe('string');
            expect(topic.length).toBeGreaterThan(0);
        });

        it('returns different topics on multiple calls', () => {
            const topic1 = getRandomTopic();
            const topic2 = getRandomTopic();
            const topic3 = getRandomTopic();

            // Note: This test could theoretically fail if the same topic is randomly selected
            // but the probability is low with a good set of topics
            const topics = new Set([topic1, topic2, topic3]);
            expect(topics.size).toBeGreaterThan(1);
        });

        it('returns topics within reasonable length limits', () => {
            for (let i = 0; i < 10; i++) {
                const topic = getRandomTopic();
                expect(topic.length).toBeGreaterThanOrEqual(10);
                expect(topic.length).toBeLessThanOrEqual(200);
            }
        });

        it('returns properly formatted topics (ends with question mark)', () => {
            for (let i = 0; i < 5; i++) {
                const topic = getRandomTopic();
                expect(topic).toMatch(/\?$/);
            }
        });
    });

    describe('integration scenarios', () => {
        it('maintains consistency between phase and completion status', () => {
            for (let turn = 1; turn <= 10; turn++) {
                const phase = getDebatePhase(turn);
                const isComplete = isDebateComplete(turn);

                if (phase === 'complete') {
                    expect(isComplete).toBe(true);
                } else {
                    expect(isComplete).toBe(false);
                }
            }
        });

        it('ensures curveball availability aligns with phases', () => {
            for (let turn = 1; turn <= 10; turn++) {
                const phase = getDebatePhase(turn);
                const canCurveball = canAddCurveball(turn);

                if (phase === 'rebuttal') {
                    expect(canCurveball).toBe(true);
                } else {
                    expect(canCurveball).toBe(false);
                }
            }
        });

        it('validates turn number calculation consistency', () => {
            // Test that message count and turn number relationship is consistent
            expect(getCurrentTurnNumber(0)).toBe(1); // No messages = turn 1
            expect(getCurrentTurnNumber(2)).toBe(2); // 2 messages = turn 2 (both participants spoke once)
            expect(getCurrentTurnNumber(4)).toBe(3); // 4 messages = turn 3
            expect(getCurrentTurnNumber(6)).toBe(4); // 6 messages = turn 4
            expect(getCurrentTurnNumber(8)).toBe(4); // 8 messages = still turn 4 (debate should be complete)
        });
    });
});
