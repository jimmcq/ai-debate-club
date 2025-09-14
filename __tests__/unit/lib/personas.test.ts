/**
 * Unit tests for persona configurations
 * Tests ensure all personas are properly defined with required properties
 */

import {
    getPersonaConfig,
    getAllPersonaTypes,
    getRandomPersonaType,
    getPersonaEntries,
    PersonaType,
} from '@/lib/personas';

describe('personas', () => {
    const validPersonaTypes: PersonaType[] = [
        'logician',
        'showman',
        'contrarian',
        'diplomat',
        'philosopher',
        'scientist',
        'lawyer',
        'comedian',
    ];

    describe('getPersonaConfig', () => {
        validPersonaTypes.forEach(personaType => {
            describe(`${personaType} persona`, () => {
                it('returns valid configuration', () => {
                    const config = getPersonaConfig(personaType);

                    expect(config).toBeDefined();
                    expect(typeof config.name).toBe('string');
                    expect(config.name.length).toBeGreaterThan(0);
                    expect(typeof config.description).toBe('string');
                    expect(config.description.length).toBeGreaterThan(0);
                    expect(typeof config.systemPrompt).toBe('string');
                    expect(config.systemPrompt.length).toBeGreaterThan(0);
                    expect(typeof config.style).toBe('string');
                    expect(config.style.length).toBeGreaterThan(0);
                });

                it('has descriptive name and description', () => {
                    const config = getPersonaConfig(personaType);

                    // Names should be title case and descriptive
                    expect(config.name).toMatch(/^[A-Z]/);
                    expect(config.name.length).toBeGreaterThan(3);

                    // Descriptions should be complete sentences
                    expect(config.description).toMatch(/[.!?]$/);
                    expect(config.description.length).toBeGreaterThan(20);
                });

                it('has comprehensive system prompt', () => {
                    const config = getPersonaConfig(personaType);

                    // System prompts should contain role instructions
                    expect(config.systemPrompt.toLowerCase()).toMatch(/(you are|your role|as a)/i);
                    expect(config.systemPrompt.length).toBeGreaterThan(50);

                    // Should mention debate context
                    expect(config.systemPrompt.toLowerCase()).toMatch(
                        /(debate|argument|position)/i
                    );
                });

                it('has appropriate style characteristics', () => {
                    const config = getPersonaConfig(personaType);

                    // Style should describe communication approach
                    expect(config.style.length).toBeGreaterThan(10);
                    expect(config.style).toMatch(/[.!?]$/);
                });
            });
        });

        it('throws error for invalid persona type', () => {
            expect(() => {
                getPersonaConfig('invalid' as PersonaType);
            }).toThrow('Unknown persona type');
        });

        it('throws error for undefined persona type', () => {
            expect(() => {
                getPersonaConfig(undefined as unknown as PersonaType);
            }).toThrow();
        });

        it('throws error for null persona type', () => {
            expect(() => {
                getPersonaConfig(null as unknown as PersonaType);
            }).toThrow();
        });
    });

    describe('persona uniqueness', () => {
        it('all personas have unique names', () => {
            const names = validPersonaTypes.map(type => getPersonaConfig(type).name);
            const uniqueNames = new Set(names);

            expect(uniqueNames.size).toBe(names.length);
        });

        it('all personas have unique descriptions', () => {
            const descriptions = validPersonaTypes.map(type => getPersonaConfig(type).description);
            const uniqueDescriptions = new Set(descriptions);

            expect(uniqueDescriptions.size).toBe(descriptions.length);
        });

        it('all personas have distinct system prompts', () => {
            const prompts = validPersonaTypes.map(type => getPersonaConfig(type).systemPrompt);
            const uniquePrompts = new Set(prompts);

            expect(uniquePrompts.size).toBe(prompts.length);
        });
    });

    describe('persona characteristics', () => {
        it('logician persona emphasizes logic and reasoning', () => {
            const config = getPersonaConfig('logician');

            expect(config.name.toLowerCase()).toContain('logic');
            expect(config.systemPrompt.toLowerCase()).toMatch(/(logic|reason|rational|evidence)/i);
        });

        it('showman persona emphasizes performance and engagement', () => {
            const config = getPersonaConfig('showman');

            expect(config.systemPrompt.toLowerCase()).toMatch(
                /(dramatic|engaging|performance|charisma)/i
            );
        });

        it('contrarian persona emphasizes opposing views', () => {
            const config = getPersonaConfig('contrarian');

            expect(config.systemPrompt.toLowerCase()).toMatch(
                /(contrary|oppose|alternative|challenge)/i
            );
        });

        it('diplomat persona emphasizes balance and nuance', () => {
            const config = getPersonaConfig('diplomat');

            expect(config.systemPrompt.toLowerCase()).toMatch(
                /(balanced|nuanced|diplomatic|moderate)/i
            );
        });

        it('philosopher persona emphasizes deep thinking', () => {
            const config = getPersonaConfig('philosopher');

            expect(config.systemPrompt.toLowerCase()).toMatch(
                /(philosophical|profound|deeper|meaning)/i
            );
        });

        it('scientist persona emphasizes evidence and methodology', () => {
            const config = getPersonaConfig('scientist');

            expect(config.systemPrompt.toLowerCase()).toMatch(
                /(evidence|data|research|scientific)/i
            );
        });

        it('lawyer persona emphasizes legal reasoning', () => {
            const config = getPersonaConfig('lawyer');

            expect(config.systemPrompt.toLowerCase()).toMatch(/(legal|precedent|argument|case)/i);
        });

        it('comedian persona emphasizes humor', () => {
            const config = getPersonaConfig('comedian');

            expect(config.systemPrompt.toLowerCase()).toMatch(/(humor|funny|comedic|witty)/i);
        });
    });

    describe('persona quality standards', () => {
        validPersonaTypes.forEach(personaType => {
            it(`${personaType} persona meets quality standards`, () => {
                const config = getPersonaConfig(personaType);

                // Name quality
                expect(config.name.length).toBeLessThan(50); // Not too long
                expect(config.name).not.toMatch(/^\s|\s$/); // No leading/trailing spaces
                expect(config.name).toMatch(/^[A-Za-z\s]+$/); // Only letters and spaces

                // Description quality
                expect(config.description.length).toBeLessThan(200); // Reasonable length
                expect(config.description.split('.').length).toBeGreaterThan(1); // Multiple sentences

                // System prompt quality
                expect(config.systemPrompt.length).toBeGreaterThan(100); // Comprehensive
                expect(config.systemPrompt.length).toBeLessThan(1000); // Not excessive

                // Style quality
                expect(config.style.length).toBeLessThan(100); // Concise
            });
        });
    });

    describe('persona configuration consistency', () => {
        it('maintains consistent structure across all personas', () => {
            const configs = validPersonaTypes.map(getPersonaConfig);

            configs.forEach(config => {
                expect(config).toHaveProperty('name');
                expect(config).toHaveProperty('description');
                expect(config).toHaveProperty('systemPrompt');
                expect(config).toHaveProperty('style');

                // Ensure no extra properties
                const keys = Object.keys(config).sort();
                expect(keys).toEqual(['description', 'name', 'style', 'systemPrompt']);
            });
        });

        it('has consistent naming patterns', () => {
            const configs = validPersonaTypes.map(getPersonaConfig);

            configs.forEach(config => {
                // Names should start with "The" followed by the persona type
                expect(config.name).toMatch(/^The\s+\w+/);
            });
        });
    });

    describe('getAllPersonaTypes', () => {
        it('returns all persona types', () => {
            const types = getAllPersonaTypes();

            expect(types).toContain('logician');
            expect(types).toContain('showman');
            expect(types).toContain('contrarian');
            expect(types).toContain('diplomat');
            expect(types).toContain('philosopher');
            expect(types).toContain('scientist');
            expect(types).toContain('lawyer');
            expect(types).toContain('comedian');
            expect(types).toHaveLength(8);
        });

        it('returns types as strings', () => {
            const types = getAllPersonaTypes();
            types.forEach(type => {
                expect(typeof type).toBe('string');
            });
        });
    });

    describe('getRandomPersonaType', () => {
        it('returns a valid persona type', () => {
            const randomType = getRandomPersonaType();
            const allTypes = getAllPersonaTypes();

            expect(allTypes).toContain(randomType);
        });

        it('returns different types over multiple calls', () => {
            const types = new Set();
            for (let i = 0; i < 20; i++) {
                types.add(getRandomPersonaType());
            }

            // Should get at least 2 different types in 20 calls
            expect(types.size).toBeGreaterThanOrEqual(2);
        });
    });

    describe('getPersonaEntries', () => {
        it('returns all persona entries as key-value tuples', () => {
            const entries = getPersonaEntries();

            expect(entries).toHaveLength(8); // Should have 8 persona types

            entries.forEach(([personaType, config]) => {
                expect(typeof personaType).toBe('string');
                expect(validPersonaTypes).toContain(personaType);
                expect(config).toHaveProperty('name');
                expect(config).toHaveProperty('description');
                expect(config).toHaveProperty('systemPrompt');
                expect(config).toHaveProperty('style');
            });
        });

        it('returns entries that match individual persona configs', () => {
            const entries = getPersonaEntries();

            entries.forEach(([personaType, config]) => {
                const individualConfig = getPersonaConfig(personaType);
                expect(config).toEqual(individualConfig);
            });
        });

        it('provides data structure suitable for UI rendering', () => {
            const entries = getPersonaEntries();

            // Verify structure suitable for mapping in React components
            const uiData = entries.map(([key, persona]) => ({
                id: key,
                displayName: persona.name,
                description: persona.description,
            }));

            expect(uiData).toHaveLength(8);
            uiData.forEach(item => {
                expect(item.id).toBeTruthy();
                expect(item.displayName).toContain('The ');
                expect(item.description).toBeTruthy();
            });
        });
    });
});
