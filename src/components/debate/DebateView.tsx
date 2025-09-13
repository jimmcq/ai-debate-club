'use client';

import { useState } from 'react';
import { DebateState } from '@/lib/types/debate';
import { getPersonaConfig } from '@/lib/personas';
import { canAddCurveball, isDebateComplete, getCurrentTurnNumber } from '@/lib/debate/utils';
import MessageDisplay from './MessageDisplay';
import CurveballInput from './CurveballInput';

interface DebateViewProps {
    debate: DebateState;
    onUpdateDebate: (debate: DebateState) => void;
    onNewDebate: () => void;
}

export default function DebateView({
    debate,
    onUpdateDebate,
    onNewDebate
}: DebateViewProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [curveball, setCurveball] = useState('');
    const [winner, setWinner] = useState<'persona1' | 'persona2' | null>(null);

    const persona1Config = getPersonaConfig(debate.participants[0].personaType);
    const persona2Config = getPersonaConfig(debate.participants[1].personaType);

    const handleNextMessage = async (curveballText?: string) => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/debate/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    debateId: debate.id,
                    curveball: curveballText?.trim() || undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate message');
            }

            const data = await response.json();
            onUpdateDebate(data.debate);
            
            if (curveballText) {
                setCurveball('');
            }
        } catch (error) {
            console.error('Error generating message:', error);
            alert('Failed to generate message. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVote = (winnerId: 'persona1' | 'persona2') => {
        setWinner(winnerId);
        // In a real app, you might want to save this vote to the backend
    };

    const getPhaseDisplay = (phase: string) => {
        switch (phase) {
            case 'opening': return 'Opening Statements';
            case 'rebuttal': return 'Rebuttals';
            case 'closing': return 'Closing Arguments';
            case 'complete': return 'Debate Complete';
            default: return phase;
        }
    };

    const isComplete = isDebateComplete(debate.currentTurn);
    const canUseCurveball = canAddCurveball(debate.currentTurn);

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {debate.topic}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            Turn {getCurrentTurnNumber(debate.messages.length)}/4 • {getPhaseDisplay(debate.phase)}
                        </p>
                    </div>
                    <button
                        onClick={onNewDebate}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                    >
                        New Debate
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(getCurrentTurnNumber(debate.messages.length) / 4) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Debaters */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        {persona1Config.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {persona1Config.description}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4">
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                        {persona2Config.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        {persona2Config.description}
                    </p>
                </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
                {debate.messages.map((message, index) => (
                    <MessageDisplay
                        key={index}
                        message={message}
                        persona={message.participantId === 'persona1' ? persona1Config : persona2Config}
                        isLeft={message.participantId === 'persona1'}
                    />
                ))}
            </div>

            {/* Controls */}
            {!isComplete && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
                    {canUseCurveball && (
                        <CurveballInput
                            curveball={curveball}
                            onCurveballChange={setCurveball}
                            onSubmitCurveball={handleNextMessage}
                            isGenerating={isGenerating}
                        />
                    )}
                    
                    <div className="text-center">
                        <button
                            onClick={() => handleNextMessage()}
                            disabled={isGenerating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                        >
                            {isGenerating ? 'Generating...' : 'Continue Debate'}
                        </button>
                    </div>
                </div>
            )}

            {/* Voting */}
            {isComplete && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Debate Complete! Who won?
                    </h3>
                    {!winner ? (
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => handleVote('persona1')}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                {persona1Config.name}
                            </button>
                            <button
                                onClick={() => handleVote('persona2')}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                {persona2Config.name}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-lg text-gray-900 dark:text-white">
                                You voted for: <strong>
                                    {winner === 'persona1' ? persona1Config.name : persona2Config.name}
                                </strong>
                            </p>
                            <button
                                onClick={onNewDebate}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                            >
                                Start New Debate
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}