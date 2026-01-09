/**
 * 🧪 Jest Setup File
 * 
 * Setup file pentru tests - rulează înainte de fiecare test suite
 */

// Set environment variables pentru tests
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging în tests
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';

// Mock console methods pentru cleaner test output (opțional)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn()
// };

// Global test timeout (5 seconds)
jest.setTimeout(5000);

// Global test setup (dacă ai nevoie)
// beforeEach(() => {
//   // Setup code here
// });

// Global test teardown (dacă ai nevoie)
// afterEach(() => {
//   // Cleanup code here
// });

