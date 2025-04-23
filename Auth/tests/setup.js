// Jest setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.MOCK_REDIS = 'true';
process.env.REDIS_URL = 'redis://localhost:6379/0';
process.env.PORT = '4000';
process.env.JWT_ACCESS_EXPIRATION = '15m';
process.env.JWT_REFRESH_EXPIRATION = '7d';
process.env.BETTER_AUTH_SECRET = 'test-better-auth-secret';
process.env.BETTER_AUTH_URL = 'http://localhost:4000';

// Handle Redis connection closing for tests
jest.mock('../src/utils/redis', () => {
  // Import the mock implementation 
  const redisMock = require('./mocks/redis');
  return redisMock;
});

// Skip the afterAll for now since it's causing issues
// We'll rely on jest's built-in cleanup mechanisms instead
// const { afterAll } = require('@jest/globals');

// afterAll(async () => {
//   // Add any cleanup for open handles here
//   // Wait a bit to ensure processes finish
//   await new Promise(resolve => setTimeout(resolve, 100));
// });