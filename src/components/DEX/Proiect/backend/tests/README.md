# 🧪 Tests Directory

Test files pentru BitSwapDEX AI Trading Backend.

## 📁 Structure

```
tests/
├── setup.js              # Jest setup file
├── routes/               # Route tests
│   ├── ai-trading.test.js
│   ├── strategies.test.js
│   ├── signals.test.js
│   ├── execution.test.js
│   └── performance.test.js
├── services/             # Service tests
│   └── ai-trading/
│       ├── AITradingService.test.js
│       ├── MarketDataService.test.js
│       ├── ContractService.test.js
│       └── PerformanceService.test.js
├── middleware/           # Middleware tests
│   ├── auth.test.js
│   ├── rateLimit.test.js
│   └── validation.test.js
├── utils/                # Utility tests
│   ├── logger.test.js
│   ├── encryption.test.js
│   └── web3.test.js
└── models/               # Model tests
    ├── Trade.test.js
    ├── Signal.test.js
    └── Strategy.test.js
```

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- routes/ai-trading.test.js
```

## 📝 Test Examples

### Route Test Example

```javascript
const request = require('supertest');
const app = require('../../server');

describe('POST /api/ai-trading/start', () => {
  it('should start AI Trading Bot', async () => {
    const response = await request(app)
      .post('/api/ai-trading/start')
      .set('Authorization', 'Bearer test-token')
      .send({
        userId: 'test-user-id',
        config: { /* ... */ }
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Service Test Example

```javascript
const AITradingService = require('../../services/ai-trading/AITradingService');

describe('AITradingService', () => {
  it('should start bot', async () => {
    const result = await AITradingService.start('test-user-id', { /* ... */ });
    expect(result.botId).toBeDefined();
  });
});
```

## 🔧 Test Configuration

Test configuration este în `jest.config.js` în root-ul backend-ului.

---

**Last Updated:** 2026-01-09  
**Status:** 🟡 Test Structure Ready - Implement Tests When Needed

