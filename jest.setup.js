import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
    has: jest.fn(),
    getAll: jest.fn(),
    keys: jest.fn(),
    values: jest.fn(),
    entries: jest.fn(),
    forEach: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock fetch for API testing
global.fetch = jest.fn()

// Setup proper Node.js globals for MSW
const { TextDecoder, TextEncoder } = require('node:util')

if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder
}

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder
}

// Mock UUID module to avoid ES module parsing issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}))

// Mock window.performance for monitoring tests
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    memory: {
      usedJSHeapSize: 1000000,
    },
  },
  writable: true,
})

// Mock navigator for monitoring tests
Object.defineProperty(window.navigator, 'sendBeacon', {
  value: jest.fn(),
  writable: true,
})

// Mock console methods to avoid spam in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup MSW (only for integration tests - skip for unit tests)
if (!process.env.SKIP_MSW) {
  // Dynamic import to avoid loading MSW during unit tests
  const setupMSW = async () => {
    const { server } = await import('./src/__mocks__/server')

    // Establish API mocking before all tests
    beforeAll(() => server.listen())

    // Reset any request handlers that we may add during the tests,
    // so they don't affect other tests
    afterEach(() => server.resetHandlers())

    // Clean up after the tests are finished
    afterAll(() => server.close())
  }

  setupMSW().catch(console.error)
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))