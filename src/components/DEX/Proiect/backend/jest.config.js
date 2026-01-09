/**
 * 🧪 Jest Configuration
 * 
 * Jest configuration pentru backend tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Directories to search for tests
  roots: ['<rootDir>/tests', '<rootDir>'],

  // Coverage configuration
  collectCoverage: false, // Set to true pentru coverage reports
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**',
    '!**/jest.config.js',
    '!**/server.js',
    '!**/migrations/**',
    '!**/scripts/**'
  ],

  // Coverage thresholds (opțional)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Transform configuration (optional - remove if not using Babel)
  // Jest works with modern Node.js without Babel for most cases
  // transform: {
  //   '^.+\\.js$': 'babel-jest'
  // },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/',
    '/build/'
  ],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Test timeout (5 seconds)
  testTimeout: 5000,

  // Global setup (opțional - dacă ai nevoie de setup global)
  // globalSetup: '<rootDir>/tests/globalSetup.js',
  
  // Global teardown (opțional - dacă ai nevoie de cleanup global)
  // globalTeardown: '<rootDir>/tests/globalTeardown.js'
};

