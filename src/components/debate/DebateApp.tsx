'use client';

import { useState } from 'react';
import { DebateState, PersonaType } from '@/lib/types/debate';
import { getRandomTopic } from '@/lib/debate/utils';
import PersonaSelector from './PersonaSelector';
import TopicInput from './TopicInput';
import DebateView from './DebateView';

export default function DebateApp() {
    const [currentDebate, setCurrentDebate] = useState<DebateState | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [topic, setTopic] = useState('');
    const [persona1, setPersona1] = useState<PersonaType>('logician');
    const [persona2, setPersona2] = useState<PersonaType>('showman');

    const handleStartDebate = async () => {
        if (!topic.trim()) return;
        
        setIsStarting(true);
        try {
            const response = await fetch('/api/debate/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    topic: topic.trim(),
                    persona1Type: persona1,
                    persona2Type: persona2,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to start debate');
            }

            const debate: DebateState = await response.json();
            setCurrentDebate(debate);
        } catch (error) {
            console.error('Error starting debate:', error);
            alert('Failed to start debate. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    const handleRandomTopic = () => {
        setTopic(getRandomTopic());
    };

    const handleNewDebate = () => {
        setCurrentDebate(null);
        setTopic('');
    };

    if (currentDebate) {
        return (
            <DebateView 
                debate={currentDebate} 
                onUpdateDebate={setCurrentDebate}
                onNewDebate={handleNewDebate}
            />
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