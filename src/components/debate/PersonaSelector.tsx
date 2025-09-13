'use client';

import { PersonaType } from '@/lib/types/debate';
import { getPersonaEntries } from '@/lib/personas';

interface PersonaSelectorProps {
    title: string;
    selectedPersona: PersonaType;
    onPersonaChange: (persona: PersonaType) => void;
    excludePersona?: PersonaType;
}

export default function PersonaSelector({
    title,
    selectedPersona,
    onPersonaChange,
    excludePersona
}: PersonaSelectorProps) {
    const personaEntries = getPersonaEntries();

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
            </h3>
            <div className="space-y-3">
                {personaEntries.map(([personaKey, persona]) => {
                    
                    const isDisabled = excludePersona === personaKey;
                    const isSelected = selectedPersona === personaKey;

                    return (
                        <label
                            key={personaKey}
                            className={`block p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                isDisabled
                                    ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700'
                                    : isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                            }`}
                        >
                            <input
                                type="radio"
                                name={`persona-${title}`}
                                value={personaKey}
                                checked={isSelected}
                                onChange={(e) => onPersonaChange(e.target.value as PersonaType)}
                                disabled={isDisabled}
                                className="sr-only"
                            />
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                        {persona.name}
                                    </h4>
                                    {isSelected && (
                                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    {persona.description}
                                </p>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
}