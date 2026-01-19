# Testing

## Framework

- **Test Runner:** Vitest 1.1.0
- **Coverage Reporters:** text, json, html
- **Environment:** Node.js with globals

## Test Structure

```
backend/tests/
├── setup.ts                      # Global mocks
├── unit/
│   └── services/
│       ├── context-builder.test.ts
│       ├── function-dispatcher.test.ts
│       ├── intent-classifier.test.ts
│       ├── queue-processor.test.ts
│       └── webhook-handler.test.ts
├── integration/
│   └── webhooks.test.ts
└── fixtures/
    ├── retell-events.ts
    └── types.ts
```

## Mocked Services (setup.ts)

- Supabase client
- Axios HTTP client
- Nodemailer
- Twilio
- Anthropic Claude

## Test Patterns

```typescript
describe('ServiceName', () => {
  beforeEach(() => {
    // Reset mocks
  });

  it('should handle specific case', async () => {
    // Arrange
    const input = mockData;

    // Act
    const result = await service.method(input);

    // Assert
    expect(result.success).toBe(true);
  });
});
```

## Coverage

**Covered:**
- Unit tests for core services (webhook handler, function dispatcher, intent classifier)
- Integration tests for webhook processing pipeline

**Excluded from coverage:**
- Schema files
- Migration files

## Running Tests

```bash
cd backend
npm test           # Run all tests
npm run coverage   # Run with coverage report
```

## Test Gaps

- No e2e tests for critical flows
- No frontend test coverage
- No load/stress testing
