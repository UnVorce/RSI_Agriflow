# Testing Guide - AgriFlow Backend

Panduan lengkap untuk menjalankan dan memahami test suite AgriFlow Backend.

## 📋 Test Coverage

### Modules Tested
- ✅ **Authentication** - Login, registration, password utilities
- ✅ **Stock** - Stock management, history, validation
- ✅ **Shipment** - Shipment creation, receiving, mismatch detection
- ✅ **Redemption** - Farmer validation, quota management, redemption flow
- ✅ **Dashboard** - Role-specific dashboards
- ✅ **Monitoring** - Monitoring data, anomaly detection
- ✅ **Notification** - Notification management

### Business Rules Tested
- ✅ **BR-01:** Farmer validation (16-digit ID, ownership)
- ✅ **BR-02:** Stock validation (shipment, redemption)
- ✅ **BR-03:** Quota validation
- ✅ **BR-04:** Shipment mismatch detection
- ✅ **BR-05:** Atomic transactions

## 🚀 Running Tests

### Prerequisites
```bash
# Ensure services are running
docker-compose up -d

# Ensure database is migrated
npm run prisma:migrate

# Ensure database is seeded
npm run prisma:seed
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Specific Test File
```bash
# Stock tests
npx vitest run tests/stock.test.ts

# Shipment tests
npx vitest run tests/shipment.test.ts

# Redemption tests
npx vitest run tests/redemption.test.ts

# Auth tests
npx vitest run tests/auth.test.ts
```

### Run Tests with Coverage
```bash
npx vitest run --coverage
```

## 📝 Test Files Overview

### 1. Stock Tests (`tests/stock.test.ts`)

**Test Categories:**
- Stock validation (BR-02)
- Add stock operations
- Update stock operations
- Stock history tracking
- Activity logging
- Negative stock rejection
- Date filtering

**Key Test Cases:**
```typescript
✓ should add stock successfully
✓ should get stock for user
✓ should update stock (adjustment)
✓ should track stock history
✓ should filter stock by fertilizer
✓ should reject negative stock
✓ should create history entry on stock change
✓ should filter history by date range
✓ should log stock addition
✓ should log stock update
```

### 2. Shipment Tests (`tests/shipment.test.ts`)

**Test Categories:**
- Stock validation on shipment (BR-02)
- Shipment receiving (BR-04)
- Atomic transactions (BR-05)
- Mismatch detection
- Notification generation
- Stock reduction/increase

**Key Test Cases:**
```typescript
✓ should create shipment when stock is sufficient
✓ should reject shipment when stock is insufficient
✓ should reduce distributor stock after shipment
✓ should receive shipment with matching quantity
✓ should detect mismatch and create notification
✓ should increase retailer stock after receiving
✓ should reject receiving by wrong retailer
✓ should rollback on failure during shipment creation
✓ should retrieve shipment history
✓ should filter history by status
```

### 3. Redemption Tests (`tests/redemption.test.ts`)

**Test Categories:**
- Farmer validation (BR-01)
- Stock validation on redemption (BR-02)
- Quota validation (BR-03)
- Atomic transactions (BR-05)
- Ownership validation
- Registration period check

**Key Test Cases:**
```typescript
✓ should validate farmer with 16-digit ID
✓ should reject farmer ID with wrong length
✓ should reject non-existent farmer
✓ should reject farmer not belonging to retailer
✓ should check registration period
✓ should redeem when stock is sufficient
✓ should reject when stock is insufficient
✓ should reduce retailer stock after redemption
✓ should reject when quota is insufficient
✓ should reduce quota after redemption
✓ should not allow negative quota
✓ should rollback on failure
✓ should retrieve redemption history
✓ should filter history by date
✓ should log redemption activity
```

### 4. Auth Tests (`tests/auth.test.ts`)

**Test Categories:**
- Password hashing
- Password comparison
- User registration flow
- Login flow

**Key Test Cases:**
```typescript
✓ should hash password correctly
✓ should compare passwords correctly
✓ should reject weak passwords
```

### 5. Dashboard Tests (`tests/dashboard.test.ts`)

**Test Categories:**
- Role-specific dashboards
- Data aggregation
- Statistics calculation

### 6. Monitoring Tests (`tests/monitoring.test.ts`)

**Test Categories:**
- Monitoring data retrieval
- Anomaly detection
- Province filtering
- Date filtering

### 7. Notification Tests (`tests/notification.test.ts`)

**Test Categories:**
- Notification retrieval
- Mark as read
- Delete notification
- Complaint submission

## 🧪 Test Structure

### Typical Test Structure
```typescript
describe('Module Name Tests', () => {
  // Setup
  beforeAll(async () => {
    // Create test data
  });

  // Cleanup
  afterAll(async () => {
    // Delete test data
  });

  describe('Feature Category', () => {
    it('should do something', async () => {
      // Arrange
      const input = { ... };

      // Act
      const result = await service.method(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.property).toBe(expectedValue);
    });
  });
});
```

## 📊 Test Data Management

### Test Data Creation
Tests create their own test data in `beforeAll()`:
- Test users (Distributor, Retailer, Government)
- Test fertilizers
- Test farmers
- Test stock
- Test quotas

### Test Data Cleanup
Tests clean up their data in `afterAll()`:
- Delete in reverse order of dependencies
- Ensure no orphaned records
- Maintain database integrity

### Test Isolation
- Each test file uses unique email addresses
- Timestamp-based unique identifiers
- No shared state between tests
- Independent test execution

## 🔍 Debugging Tests

### View Test Output
```bash
# Verbose output
npx vitest run --reporter=verbose

# Show console logs
npx vitest run --reporter=verbose --no-silent
```

### Debug Specific Test
```typescript
// Add .only to run single test
it.only('should do something', async () => {
  // Test code
});

// Add .skip to skip test
it.skip('should do something', async () => {
  // Test code
});
```

### Check Database State
```bash
# Open Prisma Studio
npm run prisma:studio

# Check test data
# Look for emails like: test-stock-*, test-dist-*, test-retail-*
```

## ⚠️ Common Issues

### Issue: Tests Fail with "Connection Refused"
**Solution:**
```bash
# Ensure Docker services are running
docker-compose up -d

# Check service status
docker ps
```

### Issue: Tests Fail with "Table Not Found"
**Solution:**
```bash
# Run migrations
npm run prisma:migrate

# Regenerate Prisma client
npm run prisma:generate
```

### Issue: Tests Fail with "Foreign Key Constraint"
**Solution:**
```bash
# Seed database with reference data
npm run prisma:seed
```

### Issue: Tests Timeout
**Solution:**
- Increase timeout in vitest.config.ts
- Check database connection
- Ensure Redis is running

## 📈 Test Metrics

### Current Coverage
- **Modules Tested:** 7/7 (100%)
- **Business Rules:** 5/5 (100%)
- **Test Files:** 7
- **Test Cases:** 100+
- **Test Types:** Integration tests

### Test Execution Time
- **Stock Tests:** ~2-3 seconds
- **Shipment Tests:** ~3-4 seconds
- **Redemption Tests:** ~3-4 seconds
- **Auth Tests:** ~1 second
- **Total Suite:** ~15-20 seconds

## 🎯 Best Practices

### Writing Tests
1. **Arrange-Act-Assert** pattern
2. **Descriptive test names** (should...)
3. **One assertion per test** (when possible)
4. **Clean up test data** (afterAll)
5. **Use meaningful test data**

### Test Organization
1. **Group related tests** (describe blocks)
2. **Test business rules explicitly**
3. **Test error cases**
4. **Test edge cases**
5. **Test atomic transactions**

### Test Maintenance
1. **Keep tests independent**
2. **Avoid test interdependencies**
3. **Update tests with code changes**
4. **Document complex test scenarios**
5. **Review test failures promptly**

## 🚀 Continuous Integration

### CI/CD Pipeline
```yaml
# Example GitHub Actions workflow
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Start services
        run: docker-compose up -d
      - name: Run migrations
        run: npm run prisma:migrate
      - name: Run tests
        run: npm test
```

## 📚 Additional Resources

- **Vitest Documentation:** https://vitest.dev/
- **Prisma Testing Guide:** https://www.prisma.io/docs/guides/testing
- **Testing Best Practices:** https://testingjavascript.com/

## 🆘 Getting Help

If tests fail:
1. Check error messages carefully
2. Verify services are running (`docker ps`)
3. Check database migrations (`npm run prisma:migrate`)
4. Review test data setup
5. Check logs in `logs/` directory
6. Consult this guide

---

**Happy Testing! 🧪**

*Remember: Good tests are the foundation of reliable software.*
