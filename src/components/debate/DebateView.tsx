'use client';

import { useState } from 'react';
import { DebateState } from '@/lib/types/debate';
import { getPersonaConfig } from '@/lib/personas';
import { canAddCurveball, isDebateComplete, getCurrentTurnNumber } from '@/lib/debate/utils';
import { useToast } from '@/components/ui/Toast';
import { ErrorFactory, AIServiceError, NetworkError } from '@/lib/errors/types';
import { useErrorLogger, useApiLogger, useUserInteractionTracker, useComponentMonitor } from '@/lib/monitoring/hooks';
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
    const [serviceUnavailable, setServiceUnavailable] = useState(false);
    const { showError, showSuccess } = useToast();

    // Monitoring hooks
    const { logError, logInfo, logUserAction } = useErrorLogger('DebateView');
    const { logApiCall } = useApiLogger();
    const { trackClick } = useUserInteractionTracker('DebateView');
    useComponentMonitor('DebateView');

    const persona1Config = getPersonaConfig(debate.participants[0].personaType);
    const persona2Config = getPersonaConfig(debate.participants[1].personaType);

    const handleNextMessage = async (curveballText?: string) => {
        setIsGenerating(true);

        logInfo('Starting debate message generation', {
            debateId: debate.id,
            hasCurveball: !!curveballText,
            currentTurn: debate.currentTurn,
            messageCount: debate.messages.length
        });

        try {
            const response = await logApiCall(
                'POST',
                '/api/debate/message',
                () => fetch('/api/debate/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        debateId: debate.id,
                        curveball: curveballText?.trim() || undefined,
                    }),
                }),
                {
                    debateId: debate.id,
                    hasCurveball: !!curveballText,
                    currentTurn: debate.currentTurn
                }
            );

            if (!response.ok) {
                // Handle different error scenarios
                if (response.status === 429) {
                    const rateLimitError = ErrorFactory.tooManyRequests();
                    logError(rateLimitError, 'rate_limit_exceeded');
                    showError(rateLimitError, () => handleNextMessage(curveballText));
                    return;
                }

                if (response.status >= 500) {
                    // Server errors - AI service might be down
                    setServiceUnavailable(true);
                    const serviceError = new AIServiceError(
                        `AI service unavailable (HTTP ${response.status})`,
                        true
                    );
                    logError(serviceError, 'ai_service_unavailable');
                    showError(
                        serviceError,
                        () => {
                            setServiceUnavailable(false);
                            handleNextMessage(curveballText);
                        }
                    );
                    return;
                }

                // Other client errors
                const errorData = await response.json().catch(() => ({}));
                const clientError = new Error(errorData.error || 'Failed to generate message');
                logError(clientError, 'api_client_error', { status: response.status });
                throw clientError;
            }

            const data = await response.json();
            onUpdateDebate(data.debate);

            logInfo('Debate message generated successfully', {
                debateId: debate.id,
                newMessageCount: data.debate.messages.length,
                hasCurveball: !!curveballText
            });

            if (curveballText) {
                setCurveball('');
                logUserAction('curveball_applied', { curveballText });
                showSuccess('Curveball Applied!', 'The debate just got more interesting.');
            }

            // Reset service unavailable flag on success
            if (serviceUnavailable) {
                setServiceUnavailable(false);
                logInfo('AI service restored after previous unavailability');
                showSuccess('Service Restored', 'AI responses are working normally again.');
            }

        } catch (error) {
            if (error instanceof Error && error.message.includes('fetch')) {
                // Network error - user might be offline
                const networkError = new NetworkError('Unable to reach our servers');
                logError(networkError, 'network_connection_failed', { originalError: error.message });
                showError(networkError, () => handleNextMessage(curveballText));
            } else {
                // Unknown error
                const unexpectedError = ErrorFactory.unexpectedError(error as Error);
                logError(unexpectedError, 'unexpected_message_generation_error');
                showError(unexpectedError, () => handleNextMessage(curveballText));
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleVote = (winnerId: 'persona1' | 'persona2') => {
        setWinner(winnerId);
        const winnerName = winnerId === 'persona1' ? persona1Config.name : persona2Config.name;

        logUserAction('debate_vote_cast', {
            winnerId,
            winnerName,
            debateId: debate.id,
            topic: debate.topic
        });

        logInfo('User voted in debate', {
            debateId: debate.id,
            winnerId,
            winnerName,
            totalMessages: debate.messages.length
        });

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
                        onClick={() => {
                            trackClick('new_debate_header');
                            onNewDebate();
                        }}
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
                            onClick={() => {
                                trackClick('continue_debate');
                                handleNextMessage();
                            }}
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
                                onClick={() => {
                                    trackClick('vote_persona1', { personaName: persona1Config.name });
                                    handleVote('persona1');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                {persona1Config.name}
                            </button>
                            <button
                                onClick={() => {
                                    trackClick('vote_persona2', { personaName: persona2Config.name });
                                    handleVote('persona2');
                                }}
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
                                onClick={() => {
                                    trackClick('new_debate_after_voting');
                                    onNewDebate();
                                }}
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