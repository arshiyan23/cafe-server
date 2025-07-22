# Testing Documentation

This project uses Jest and Supertest for comprehensive testing of the API endpoints.

## Test Structure

```
tests/
├── setup.ts              # Test configuration and global mocks
├── homeController.test.ts # Tests for home endpoint
├── s3Controller.test.ts   # Tests for S3 operations
├── integration.test.ts    # End-to-end API tests
└── utils.test.ts         # Utility and configuration tests
```

## Test Types

### 1. Unit Tests
- **S3 Controller Tests**: Test individual controller functions with mocked AWS SDK
- **Home Controller Tests**: Test basic endpoint functionality
- **Utils Tests**: Test configuration and utility functions

### 2. Integration Tests
- **API Integration**: Test complete request/response cycles
- **Error Handling**: Test error scenarios and edge cases
- **CORS**: Test cross-origin request handling

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests for CI/CD (no watch, with coverage)
npm run test:ci
```

## Test Coverage

The tests cover:

- ✅ **Upload URL Generation**
  - Valid requests with fileName and fileType
  - Missing required parameters
  - AWS SDK error handling

- ✅ **Download URL Generation**
  - Valid file key requests
  - Special characters in file names
  - AWS SDK error handling

- ✅ **File Deletion**
  - Successful deletion
  - Deletion error handling

- ✅ **Integration Testing**
  - CORS functionality
  - JSON parsing
  - Error responses
  - 404 handling

- ✅ **Configuration Testing**
  - Environment variable handling
  - AWS client initialization

## Mock Strategy

The tests use Jest mocks for:

1. **AWS SDK**: All S3 operations are mocked to avoid real AWS calls
2. **Environment Variables**: Test-specific environment configuration
3. **External Dependencies**: Controlled testing environment

## Test Environment

- **Environment File**: `.env.test` contains test-specific configuration
- **Isolated**: Tests don't affect real AWS resources
- **Fast**: All external calls are mocked for quick execution

## Sample Test Output

```bash
 PASS  tests/homeController.test.ts
 PASS  tests/s3Controller.test.ts
 PASS  tests/integration.test.ts
 PASS  tests/utils.test.ts

Test Suites: 4 passed, 4 total
Tests:       15 passed, 15 total
Snapshots:   0 total
Time:        2.5 s
```

## Coverage Report

After running `npm run test:coverage`, you'll get:

- **HTML Report**: `coverage/lcov-report/index.html`
- **Console Output**: Summary of coverage percentages
- **LCOV File**: `coverage/lcov.info` for CI tools

## Writing New Tests

### Example Test Structure

```typescript
import request from 'supertest';
import app from '../src/app';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  describe('Endpoint Description', () => {
    it('should handle success case', async () => {
      const response = await request(app)
        .post('/endpoint')
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ expected: 'result' });
    });

    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

## Best Practices

1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow the AAA pattern
3. **Mock External Dependencies**: Keep tests isolated
4. **Test Edge Cases**: Include error scenarios
5. **Cleanup**: Reset mocks between tests
