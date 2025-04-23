import { betterAuth } from "better-auth";
import { BETTER_AUTH_SECRET, BETTER_AUTH_URL } from "./config";
import Redis from 'ioredis';
import { createRedisClient } from './utils/redis';

// Define RedisClientType as Redis instance type
type RedisClientType = Redis;

// Create Auth instance with proper configuration
export const auth = betterAuth({
  // Basic configuration
  secret: BETTER_AUTH_SECRET,
  baseUrl: BETTER_AUTH_URL,
  
  emailAndPassword: {    
    enabled: true
    // BetterAuth doesn't support passwordRequirements in its type
    // but we'll keep the validation logic in our service
  },
  // Session config - keep minimal to avoid type errors
  session: {
    // Use allowed properties only
    cookie: {
      name: 'auth_session'
    },
    // We'll handle token expiration in our own code
    freshAge: 15 * 60 // 15 minutes in seconds
  }
  // Optional: Add social login providers when needed
  // socialProviders: {
  //   github: { 
  //     clientId: process.env.GITHUB_CLIENT_ID!, 
  //     clientSecret: process.env.GITHUB_CLIENT_SECRET!
  //   }
  // }
});

// Add the initialize method to the auth object
let redisClient: RedisClientType | null = null;

// Extend the auth object with custom methods
const extendedAuth = {
  ...auth,
  // Add initialize method that was missing
  initialize: async (): Promise<void> => {
    // Initialize Redis connection for token storage
    redisClient = await createRedisClient();
    
    // Setup database connections and other necessary initialization
    console.log('BetterAuth service initialized successfully');
    
    return Promise.resolve();
  },
  // Method to get Redis client
  getRedisClient: (): RedisClientType | null => {
    return redisClient;
  }
};

export default extendedAuth;