'use client';

import { useState } from 'react';

interface CurveballInputProps {
    curveball: string;
    onCurveballChange: (curveball: string) => void;
    onSubmitCurveball: (curveball: string) => void;
    isGenerating: boolean;
}

const CURVEBALL_SUGGESTIONS = [
    'Switch sides and argue for the opposite position',
    'Argue as if you are speaking in the 1950s',
    'Present your argument using only questions',
    'Make your case using sports metaphors',
    'Argue from the perspective of a future historian',
    'Use only economic arguments',
    'Present your case as if talking to a child',
    'Argue using only scientific evidence',
    'Make your point through a personal story',
    'Present the counterargument to your own position',
];

export default function CurveballInput({
    curveball,
    onCurveballChange,
    onSubmitCurveball,
    isGenerating,
}: CurveballInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSuggestionClick = (suggestion: string) => {
        onCurveballChange(suggestion);
        setShowSuggestions(false);
    };

    return (
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Moderator Curveball
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                Add a dynamic challenge to test the debaters&apos; adaptability (optional)
            </p>

            <div className="space-y-2">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={curveball}
                        onChange={e => onCurveballChange(e.target.value)}
                        placeholder="Enter a challenge or constraint for the next argument..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        maxLength={200}
                    />
                    <button
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-colors duration-200 whitespace-nowrap"
                    >
                        💡 Ideas
                    </button>
                </div>

                {showSuggestions && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                            Curveball Suggestions:
                        </h5>
                        <div className="grid gap-2">
                            {CURVEBALL_SUGGESTIONS.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="text-left text-sm bg-white dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-3 py-2 rounded border border-gray-200 dark:border-gray-500 transition-colors duration-200"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {curveball && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => onSubmitCurveball(curveball)}
                            disabled={isGenerating}
                            className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200"
                        >
                            {isGenerating ? 'Applying...' : 'Apply Curveball'}
                        </button>
                        <button
                            onClick={() => onCurveballChange('')}
                            className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            Clear
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
