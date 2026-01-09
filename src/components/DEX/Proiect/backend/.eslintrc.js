/**
 * 🔍 ESLint Configuration
 * 
 * ESLint configuration pentru code quality și consistency
 */

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'standard'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  rules: {
    // Code style
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // Best practices
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'warn',
    
    // Error prevention
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-case': 'error',
    
    // Code quality
    'complexity': ['warn', 15],
    'max-depth': ['warn', 4],
    'max-lines-per-function': ['warn', 100],
    'max-params': ['warn', 5],
    
    // Style consistency
    'comma-dangle': ['error', 'never'],
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    
    // Node.js specific
    'no-process-exit': 'warn',
    'no-path-concat': 'error',
    
    // Async/await
    'no-async-promise-executor': 'error',
    'await-promise': 'off', // Disabled pentru că necesită TypeScript
    
    // Security (dacă ai eslint-plugin-security)
    // 'security/detect-object-injection': 'warn',
    // 'security/detect-non-literal-fs-filename': 'warn'
  },
  ignorePatterns: [
    'node_modules/',
    'coverage/',
    'dist/',
    'build/',
    '*.min.js',
    'tests/',
    'migrations/',
    'scripts/'
  ]
};

