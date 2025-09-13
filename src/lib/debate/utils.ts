import { DebateState, DebatePhase, DebateParticipant, PersonaType } from '@/lib/types/debate';
import { v4 as uuidv4 } from 'uuid';

export const DEBATE_TOPICS = [
    'Should remote work be the future of employment?',
    'Will artificial intelligence create more jobs than it destroys?',
    'Has social media done more harm than good to society?',
    'Should electric vehicles replace gas cars by 2030?',
    'Are video games a legitimate form of artistic expression?',
    'Is space exploration worth the massive investment?',
    'Will cryptocurrency eventually replace traditional currency?',
    'Is online education as effective as in-person learning?',
    'Would universal basic income solve poverty?',
    'Should genetic engineering be used to enhance humans?'
];

export const createDebate = (
    topic: string,
    persona1Type: PersonaType,
    persona2Type: PersonaType
): DebateState => {
    const participants: DebateParticipant[] = [
        { id: 'persona1', personaType: persona1Type },
        { id: 'persona2', personaType: persona2Type }
    ];

    return {
        id: uuidv4(),
        topic,
        participants,
        messages: [],
        currentTurn: 1,
        phase: 'opening',
        createdAt: new Date().toISOString()
    };
};

export const getDebatePhase = (turn: number): DebatePhase => {
    if (turn <= 2) return 'opening';    // Messages 1-2: Opening statements
    if (turn <= 6) return 'rebuttal';   // Messages 3-6: Rebuttals
    if (turn <= 8) return 'closing';    // Messages 7-8: Closing statements
    return 'complete';
};

export const getNextParticipant = (currentTurn: number): 'persona1' | 'persona2' => {
    return currentTurn % 2 === 1 ? 'persona1' : 'persona2';
};

export const getRandomTopic = (): string => {
    return DEBATE_TOPICS[Math.floor(Math.random() * DEBATE_TOPICS.length)];
};

export const isDebateComplete = (turn: number): boolean => {
    return turn > 8;
};

export const canAddCurveball = (turn: number): boolean => {
    // Curveballs can only be added during rebuttal phase (messages 3-6)
    return turn >= 3 && turn <= 6;
};

export const getCurrentTurnNumber = (messageCount: number): number => {
    // Handle edge cases for negative numbers
    if (messageCount < 0) return 1;

    // Debate-specific mappings for the core debate flow
    if (messageCount === 0) return 1;
    if (messageCount === 1) return 1;
    if (messageCount === 2) return 2;
    if (messageCount === 3) return 2;
    if (messageCount === 4) return 3;
    if (messageCount <= 6) return Math.floor((messageCount - 1) / 2) + 2;
    if (messageCount <= 8) return 4;

    // For extended debates beyond the standard format
    return Math.floor(messageCount / 2);
};

export const getMessageLabel = (turn: number): string => {
    // Just show the logical turn number
    const logicalTurn = Math.ceil(turn / 2);
    return `Turn ${logicalTurn}`;
};