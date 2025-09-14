import { NextRequest, NextResponse } from 'next/server';
import { DebateMessageRequest, DebateMessage } from '@/lib/types/debate';
import { callGroq, buildPrompt } from '@/lib/api/groq';
import { getPersonaConfig } from '@/lib/personas';
import { getDebatePhase, getNextParticipant, isDebateComplete } from '@/lib/debate/utils';
import { debateStorage } from '@/lib/api/storage';

export async function POST(request: NextRequest) {
    try {
        const body: DebateMessageRequest = await request.json();
        const { debateId, curveball } = body;

        // Get debate from storage
        const debate = debateStorage.get(debateId);
        if (!debate) {
            return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
        }

        // Check if debate is complete
        if (isDebateComplete(debate.currentTurn)) {
            return NextResponse.json({ error: 'Debate is already complete' }, { status: 400 });
        }

        // Determine current participant
        const currentParticipantId = getNextParticipant(debate.currentTurn);
        const currentParticipant = debate.participants.find(p => p.id === currentParticipantId);

        if (!currentParticipant) {
            return NextResponse.json({ error: 'Invalid participant' }, { status: 400 });
        }

        // Get persona configuration
        const personaConfig = getPersonaConfig(currentParticipant.personaType);

        // Get opponent's last message (if any)
        const opponentMessages = debate.messages.filter(
            m => m.participantId !== currentParticipantId
        );
        const lastOpponentMessage = opponentMessages[opponentMessages.length - 1];

        // Build prompt
        const phase = getDebatePhase(debate.currentTurn);
        const messages = buildPrompt(
            personaConfig.systemPrompt,
            debate.topic,
            debate.currentTurn,
            phase,
            lastOpponentMessage?.content,
            curveball
        );

        // Call Groq API
        const response = await callGroq(messages);

        // Create new message
        const newMessage: DebateMessage = {
            id: `msg-${Date.now()}`,
            participantId: currentParticipantId,
            content: response,
            turn: debate.currentTurn,
            timestamp: new Date().toISOString(),
        };

        // Update debate state
        debate.messages.push(newMessage);
        debate.currentTurn += 1;
        debate.phase = getDebatePhase(debate.currentTurn);

        if (curveball) {
            debate.curveball = curveball;
        }

        // Save updated debate
        debateStorage.set(debateId, debate);

        return NextResponse.json({
            message: newMessage,
            debate: debate,
        });
    } catch (error) {
        console.error('Error generating message:', error);
        return NextResponse.json({ error: 'Failed to generate message' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const debateId = searchParams.get('id');

    if (!debateId) {
        return NextResponse.json({ error: 'Debate ID is required' }, { status: 400 });
    }

    const debate = debateStorage.get(debateId);
    if (!debate) {
        return NextResponse.json({ error: 'Debate not found' }, { status: 404 });
    }

    return NextResponse.json(debate);
}
