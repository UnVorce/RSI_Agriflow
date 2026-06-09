import { beforeAll, afterAll, afterEach } from 'vitest';
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test', override: true });

// Global test setup
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
  
  // Setup test database, Redis, etc.
  // Add any global test setup here
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  
  // Cleanup test database, Redis, etc.
  // Add any global cleanup here
});

// Reset between tests
afterEach(() => {
  // Reset any mocks or spies
});
