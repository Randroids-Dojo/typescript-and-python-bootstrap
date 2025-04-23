import Redis from 'ioredis';
import { REDIS_URL } from '../config';

// Create Redis client
const redisClient = new Redis(REDIS_URL);

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

export default redisClient;