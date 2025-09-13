'use client';

import { useState } from 'react';
import { DebateState, PersonaType } from '@/lib/types/debate';
import { getRandomTopic } from '@/lib/debate/utils';
import { useToast } from '@/components/ui/Toast';
import { ErrorFactory, ValidationError, NetworkError } from '@/lib/errors/types';
import { useErrorLogger, useApiLogger, useUserInteractionTracker, useComponentMonitor } from '@/lib/monitoring/hooks';
import PersonaSelector from './PersonaSelector';
import TopicInput from './TopicInput';
import DebateView from './DebateView';
import DebateErrorBoundary from './DebateErrorBoundary';

export default function DebateApp() {
    const [currentDebate, setCurrentDebate] = useState<DebateState | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [topic, setTopic] = useState('');
    const [persona1, setPersona1] = useState<PersonaType>('logician');
    const [persona2, setPersona2] = useState<PersonaType>('showman');
    const { showError, showSuccess } = useToast();

    // Monitoring hooks
    const { logError, logInfo } = useErrorLogger('DebateApp');
    const { logApiCall } = useApiLogger();
    const { trackClick, trackFormSubmit } = useUserInteractionTracker('DebateApp');
    useComponentMonitor('DebateApp');

    const handleStartDebate = async () => {
        // Validate input
        if (!topic.trim()) {
            const invalidTopicError = ErrorFactory.invalidTopic(topic);
            logError(invalidTopicError, 'empty_topic_validation');
            showError(invalidTopicError);
            return;
        }

        if (topic.trim().length < 10) {
            const validationError = new ValidationError('topic', 'Topic must be at least 10 characters long');
            logError(validationError, 'topic_too_short_validation');
            showError(validationError);
            return;
        }

        if (topic.trim().length > 200) {
            const validationError = new ValidationError('topic', 'Topic must be less than 200 characters');
            logError(validationError, 'topic_too_long_validation');
            showError(validationError);
            return;
        }

        trackFormSubmit('debate_start', {
            topic: topic.trim(),
            persona1,
            persona2,
            topicLength: topic.trim().length
        });

        logInfo('Starting new debate', {
            topic: topic.trim(),
            persona1,
            persona2,
            topicLength: topic.trim().length
        });

        setIsStarting(true);
        try {
            const response = await logApiCall(
                'POST',
                '/api/debate/start',
                () => fetch('/api/debate/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        topic: topic.trim(),
                        persona1Type: persona1,
                        persona2Type: persona2,
                    }),
                }),
                {
                    topic: topic.trim(),
                    persona1,
                    persona2
                }
            );

            if (!response.ok) {
                if (response.status >= 500) {
                    const networkError = new NetworkError(`Server error: ${response.status}`);
                    logError(networkError, 'debate_start_server_error');
                    throw networkError;
                } else if (response.status === 429) {
                    const rateLimitError = ErrorFactory.tooManyRequests();
                    logError(rateLimitError, 'debate_start_rate_limit');
                    throw rateLimitError;
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    const validationError = new ValidationError('debate setup', errorData.error || 'Invalid debate configuration');
                    logError(validationError, 'debate_start_validation_error');
                    throw validationError;
                }
            }

            const debate: DebateState = await response.json();
            setCurrentDebate(debate);

            logInfo('Debate started successfully', {
                debateId: debate.id,
                topic: debate.topic,
                persona1Type: debate.participants[0].personaType,
                persona2Type: debate.participants[1].personaType
            });

            showSuccess('Debate Started!', 'Your AI debate is ready to begin.');

        } catch (error) {
            if (error instanceof ValidationError || error instanceof NetworkError) {
                showError(error, () => handleStartDebate());
            } else {
                const unexpectedError = ErrorFactory.unexpectedError(error as Error);
                logError(unexpectedError, 'unexpected_debate_start_error');
                showError(unexpectedError, () => handleStartDebate());
            }
        } finally {
            setIsStarting(false);
        }
    };

    const handleRandomTopic = () => {
        const randomTopic = getRandomTopic();
        setTopic(randomTopic);

        trackClick('random_topic_generator', { generatedTopic: randomTopic });
        logInfo('User generated random topic', { topic: randomTopic });
    };

    const handleNewDebate = () => {
        setCurrentDebate(null);
        setTopic('');
    };

    if (currentDebate) {
        return (
            <DebateErrorBoundary>
                <DebateView
                    debate={currentDebate}
                    onUpdateDebate={setCurrentDebate}
                    onNewDebate={handleNewDebate}
                />
            </DebateErrorBoundary>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                    AI Debate Club
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                    Watch AI personalities engage in structured debates on topics you choose
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
                <TopicInput
                    topic={topic}
                    onTopicChange={setTopic}
                    onRandomTopic={handleRandomTopic}
                />

                <div className="grid md:grid-cols-2 gap-6">
                    <PersonaSelector
                        title="First Debater"
                        selectedPersona={persona1}
                        onPersonaChange={setPersona1}
                        excludePersona={persona2}
                    />
                    <PersonaSelector
                        title="Second Debater"
                        selectedPersona={persona2}
                        onPersonaChange={setPersona2}
                        excludePersona={persona1}
                    />
                </div>

                <div className="text-center">
                    <button
                        onClick={handleStartDebate}
                        disabled={!topic.trim() || isStarting}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                    >
                        {isStarting ? 'Starting Debate...' : 'Start Debate'}
                    </button>
                </div>
            </div>
        </div>
    );
}