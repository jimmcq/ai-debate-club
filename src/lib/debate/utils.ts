import { DebateState, DebatePhase, DebateParticipant, PersonaType } from '@/lib/types/debate';
import { v4 as uuidv4 } from 'uuid';

export const DEBATE_TOPICS = [
    'Remote work is better than office work',
    'Artificial intelligence will create more jobs than it destroys',
    'Social media has done more harm than good',
    'Electric vehicles should replace gas cars by 2030',
    'Video games are a legitimate form of art',
    'Space exploration is worth the investment',
    'Cryptocurrency will replace traditional currency',
    'Online education is as effective as in-person learning',
    'Universal basic income would solve poverty',
    'Genetic engineering should be used to enhance humans'
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
        phase: 'opening'
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
    // Convert message count to turn number (1-4)
    // Messages 1-2 = Turn 1, Messages 3-4 = Turn 2, etc.
    return Math.ceil(messageCount / 2);
};

export const getMessageLabel = (turn: number): string => {
    // Just show the logical turn number
    const logicalTurn = Math.ceil(turn / 2);
    return `Turn ${logicalTurn}`;
};