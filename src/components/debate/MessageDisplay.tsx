'use client';

import { DebateMessage, PersonaConfig } from '@/lib/types/debate';
import { getMessageLabel } from '@/lib/debate/utils';

interface MessageDisplayProps {
    message: DebateMessage;
    persona: PersonaConfig;
    isLeft: boolean;
}

export default function MessageDisplay({ message, persona, isLeft }: MessageDisplayProps) {
    return (
        <div className={`flex ${isLeft ? 'justify-start' : 'justify-end'} mb-4`}>
            <div className={`max-w-3xl ${isLeft ? 'mr-12' : 'ml-12'}`}>
                <div
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 ${
                        isLeft ? 'border-l-4 border-blue-500' : 'border-r-4 border-green-500'
                    }`}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-lg text-gray-900 dark:text-white">
                                {persona.name}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {getMessageLabel(message.turn)}
                            </span>
                        </div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                    </div>

                    <div className="prose dark:prose-invert max-w-none">
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {message.content}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
