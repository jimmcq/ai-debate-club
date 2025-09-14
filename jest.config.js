// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    // Test environment
    testEnvironment: 'jsdom',

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // Module name mappings (for path aliases)
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Test patterns
    testMatch: [
        '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
        '<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/app/layout.tsx',
        '!src/app/page.tsx',
        '!src/app/globals.css',
        '!src/**/*.stories.{ts,tsx}',
    ],

    coverageThreshold: {
        global: {
            branches: 15,
            functions: 15,
            lines: 15,
            statements: 15,
        },
    },

    // Test environment options
    testEnvironmentOptions: {
        url: 'http://localhost:3000',
    },

    // Transform patterns
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
    },

    // Transform ES modules from node_modules
    transformIgnorePatterns: ['node_modules/(?!(uuid)/)'],

    // Module file extensions
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

    // Ignore patterns
    testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

    // Clear mocks between tests
    clearMocks: true,

    // Verbose output
    verbose: true,

    // Collect coverage from these files
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
