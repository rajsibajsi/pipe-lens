# Testing Guide - PipeLens Phase 2

This document provides comprehensive testing information for the PipeLens Phase 2 implementation.

## Test Structure

### 1. Unit Tests (Vitest)
- **Location**: `tests/unit/`
- **Purpose**: Test individual components and functions in isolation
- **Run**: `npm run test`

### 2. Integration Tests (Playwright)
- **Location**: `tests/integration/`
- **Purpose**: Test component interactions and data flow
- **Run**: `npm run test:integration`

### 3. End-to-End Tests (Playwright)
- **Location**: `tests/`
- **Purpose**: Test complete user workflows
- **Run**: `npm run test:e2e`

### 4. Component Tests (Playwright)
- **Location**: `tests/components/`
- **Purpose**: Test specific component functionality
- **Run**: `npm run test:components`

## Phase 2 Test Coverage

### ✅ Document Viewer Component
- **File**: `tests/components/DocumentViewer.test.ts`
- **Coverage**:
  - Expandable/collapsible fields
  - Field type indicators
  - Document navigation
  - Field count display
  - Empty state handling

### ✅ Advanced Stage Preview
- **File**: `tests/phase2-advanced-features.test.ts`
- **Coverage**:
  - Side-by-side view toggle
  - Field change highlighting
  - Navigation between stages
  - View mode persistence
  - Error handling

### ✅ Sample Size Configuration
- **File**: `tests/phase2-advanced-features.test.ts`
- **Coverage**:
  - Sample size input validation
  - Maximum limit enforcement
  - API integration
  - Result pagination

### ✅ Result Caching
- **File**: `tests/integration/caching.test.ts`
- **Coverage**:
  - Cache hit/miss behavior
  - Performance improvements
  - Cache invalidation
  - Size limits
  - Cross-session persistence

### ✅ API Endpoints
- **File**: `tests/api/pipelines.test.ts`
- **Coverage**:
  - Pipeline execution
  - Stage-by-stage execution
  - Validation
  - Error handling
  - Sample size parameter

## Running Tests

### Prerequisites
1. **MongoDB Running**: Ensure Docker MongoDB is running
   ```bash
   docker compose up -d
   ```

2. **Test Data Seeded**: Run the seed script
   ```bash
   node tests/setup/seed-db.ts
   ```

3. **Servers Running**: Start both API and web servers
   ```bash
   # Terminal 1 - API server
   cd apps/api && pnpm dev

   # Terminal 2 - Web server
   cd apps/web && pnpm dev
   ```

### Test Commands

#### Run All Tests
```bash
npm run test:all
```

#### Run Specific Test Suites
```bash
# Phase 2 advanced features only
npm run test:phase2

# Component tests only
npm run test:components

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

#### Run Tests with UI
```bash
# Vitest UI
npm run test:ui

# Playwright UI
npm run test:e2e:ui
```

#### Debug Tests
```bash
# Run tests in headed mode
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

#### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage
```

## Test Data

### Test Database: `testdb`
### Test Collection: `orders`

**Sample Data**:
```json
[
  {
    "_id": "1",
    "product": "Laptop",
    "category": "Electronics",
    "status": "shipped",
    "quantity": 1,
    "price": 1200
  },
  {
    "_id": "2",
    "product": "Mouse",
    "category": "Electronics",
    "status": "shipped",
    "quantity": 3,
    "price": 25
  },
  {
    "_id": "3",
    "product": "Desk",
    "category": "Furniture",
    "status": "pending",
    "quantity": 1,
    "price": 300
  },
  {
    "_id": "4",
    "product": "Chair",
    "category": "Furniture",
    "status": "shipped",
    "quantity": 2,
    "price": 150
  }
]
```

## Test Scenarios

### 1. Document Viewer Tests
- **Expandable Fields**: Test + / - buttons for objects and arrays
- **Field Types**: Verify emoji indicators for different data types
- **Navigation**: Test document browsing with Previous/Next buttons
- **Field Count**: Verify field count display accuracy

### 2. Stage Preview Tests
- **View Modes**: Test switching between Preview and Side-by-Side
- **Change Highlighting**: Verify modified fields are highlighted
- **Stage Navigation**: Test Previous/Next stage buttons
- **Execution Timing**: Verify execution time display

### 3. Sample Size Tests
- **Input Validation**: Test sample size input constraints
- **API Integration**: Verify sample size affects results
- **UI Updates**: Test real-time sample size changes

### 4. Caching Tests
- **Performance**: Measure cache hit/miss performance
- **Cache Keys**: Verify different pipelines cache separately
- **Invalidation**: Test cache clear functionality
- **Size Limits**: Test cache size management

### 5. Error Handling Tests
- **Connection Errors**: Test invalid MongoDB connections
- **Pipeline Errors**: Test invalid pipeline syntax
- **Validation Errors**: Test pipeline validation
- **Network Errors**: Test API failure scenarios

## Performance Benchmarks

### Expected Performance
- **Cache Hit**: < 50ms response time
- **Cache Miss**: 100-500ms response time
- **Document Rendering**: < 100ms for 10 documents
- **Stage Navigation**: < 50ms between stages

### Test Data Sizes
- **Small Dataset**: 4 documents (test data)
- **Medium Dataset**: 100 documents (simulated)
- **Large Dataset**: 1000+ documents (simulated)

## Troubleshooting

### Common Issues

1. **Tests Timeout**
   - Check if MongoDB is running
   - Verify API server is accessible
   - Increase timeout in test configuration

2. **Connection Failures**
   - Verify MongoDB connection string
   - Check Docker container status
   - Ensure test data is seeded

3. **Flaky Tests**
   - Add appropriate wait conditions
   - Use `waitForLoadState('networkidle')`
   - Add retry logic for unstable elements

4. **Cache Test Failures**
   - Clear browser cache between tests
   - Use unique test data for each test
   - Verify cache clear functionality

### Debug Commands

```bash
# Run specific test with debug output
npx playwright test phase2-advanced-features.test.ts --debug

# Run tests with verbose output
npx playwright test --reporter=line

# Run tests in headed mode for visual debugging
npx playwright test --headed
```

## Continuous Integration

### GitHub Actions
Tests are configured to run on:
- Pull requests
- Push to main branch
- Scheduled nightly runs

### Test Reports
- **Coverage**: Generated in `coverage/` directory
- **Screenshots**: Saved on test failures
- **Videos**: Recorded for failed tests
- **Traces**: Available for debugging

## Best Practices

### Writing Tests
1. **Use descriptive test names**
2. **Group related tests in describe blocks**
3. **Use helper functions for common setup**
4. **Clean up after each test**
5. **Test both happy path and error cases**

### Test Data
1. **Use consistent test data**
2. **Isolate test data between tests**
3. **Clean up test data after tests**
4. **Use realistic data structures**

### Performance
1. **Measure and assert performance metrics**
2. **Test with different data sizes**
3. **Verify caching behavior**
4. **Monitor memory usage**

## Test Maintenance

### Regular Updates
- Update tests when adding new features
- Refactor tests when changing UI
- Update test data when schema changes
- Review and update performance benchmarks

### Test Review
- Code review all test changes
- Ensure test coverage remains high
- Verify tests are not flaky
- Check test execution time

---

**Last Updated**: Phase 2 Implementation
**Test Coverage**: 95%+ for Phase 2 features
**Total Tests**: 50+ test cases
