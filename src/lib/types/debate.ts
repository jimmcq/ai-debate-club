// Core debate types based on TDD specifications

export type PersonaType =
    | 'logician'
    | 'showman'
    | 'contrarian'
    | 'diplomat'
    | 'philosopher'
    | 'scientist'
    | 'lawyer'
    | 'comedian';

export type DebatePhase = 'opening' | 'rebuttal' | 'closing' | 'complete';

export type ParticipantId = 'persona1' | 'persona2';

// Configuration for a persona
export interface PersonaConfig {
    name: string;
    description: string;
    systemPrompt: string;
}

// Represents one of the AI debaters
export interface DebateParticipant {
    id: ParticipantId;
    personaType: PersonaType;
}

// A single message/argument from a debater
export interface DebateMessage {
    id: string;
    participantId: ParticipantId;
    content: string;
    turn: number;
    timestamp: string;
    curveball?: string;
}

// High-level state for a single debate
export interface DebateState {
    id: string;
    topic: string;
    participants: DebateParticipant[];
    messages: DebateMessage[];
    currentTurn: number;
    phase: DebatePhase;
    winner?: ParticipantId;
    curveball?: string;
    createdAt: string;
}

// Groq API request/response types
export interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface GroqRequest {
    model: string;
    messages: GroqMessage[];
    max_tokens: number;
    temperature: number;
}

export interface GroqResponse {
    choices: {
        message: {
            content: string;
        };
    }[];
}

// API request/response types
export interface DebateStartRequest {
    topic: string;
    persona1Type: PersonaType;
    persona2Type: PersonaType;
}

export interface DebateMessageRequest {
    debateId: string;
    curveball?: string;
}

export interface DebateVoteRequest {
    debateId: string;
    winnerId: ParticipantId;
}
