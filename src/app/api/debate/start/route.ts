import { NextRequest, NextResponse } from 'next/server';
import { DebateStartRequest } from '@/lib/types/debate';
import { createDebate } from '@/lib/debate/utils';
import { debateStorage } from '@/lib/api/storage';

export async function POST(request: NextRequest) {
    try {
        const body: DebateStartRequest = await request.json();
        const { topic, persona1Type, persona2Type } = body;

        // Validate input
        if (!topic || topic.length < 10 || topic.length > 200) {
            return NextResponse.json(
                { error: 'Topic must be between 10 and 200 characters' },
                { status: 400 }
            );
        }

        if (!persona1Type || !persona2Type) {
            return NextResponse.json({ error: 'Both persona types are required' }, { status: 400 });
        }

        // Create new debate
        const debate = createDebate(topic, persona1Type, persona2Type);

        // Store debate
        debateStorage.set(debate.id, debate);

        return NextResponse.json(debate);
    } catch (error) {
        console.error('Error starting debate:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
