import Redis from 'ioredis';
import { REDIS_URL, NODE_ENV } from '../config';

// Define RedisClientType as Redis instance type
type RedisClientType = Redis;

/**
 * Create a Redis client with connection retry logic
 */
export const createRedisClient = async (): Promise<RedisClientType> => {
  // If in test environment and MOCK_REDIS is set, return a mock client
  if (NODE_ENV === 'test' && process.env.MOCK_REDIS === 'true') {
    console.log('Using mock Redis client for testing');
    
    // Return simple mock implementation
    const mockClient = {
      // Basic Redis operations used by our auth service
      get: async () => null,
      set: async () => 'OK',
      del: async () => 1,
      expire: async () => 1,
      quit: async () => 'OK',
      // Add other methods as needed
    } as unknown as RedisClientType;
    
    return mockClient;
  }
  
  // Create real Redis client for production/development
  const redisClient = new Redis(REDIS_URL, {
    retryStrategy: (times) => {
      // Exponential backoff for reconnection attempts
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: true,
  });
  
  // Set up event handlers
  redisClient.on('connect', () => {
    console.log('Connected to Redis');
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  
  redisClient.on('reconnecting', () => {
    console.log('Reconnecting to Redis...');
  });
  
  // Wait for connection to be ready
  try {
    await redisClient.ping();
    console.log('Redis connection verified');
    return redisClient;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // If we can't connect to Redis in production, we might want to exit
    // But for dev/test, we'll just return the client and let it retry
    if (NODE_ENV === 'production') {
      throw error;
    }
    return redisClient;
  }
};

// Create and export a default client (for backward compatibility)
// This should be lazy loaded in actual use cases
const redisClient = new Redis(REDIS_URL);

redisClient.on('connect', () => {
  console.log('Connected to Redis (default client)');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error (default client):', err);
});

export default redisClient;