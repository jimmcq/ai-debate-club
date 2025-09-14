/**
 * Mock Service Worker (MSW) server for testing API interactions
 * Provides realistic API mocking for integration tests
 */

import { setupServer } from 'msw/node';
import { debateHandlers } from './handlers/debate';
import { errorHandlers } from './handlers/errors';

export const server = setupServer(...debateHandlers, ...errorHandlers);
