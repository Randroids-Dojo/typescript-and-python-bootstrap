import { betterAuth } from 'better-auth/client';

// Interface definitions for BetterAuth client
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
  device: string;
  lastActive: string;
  ip: string;
}

// Initialize the real BetterAuth client
const authInstance = betterAuth({
  baseUrl: import.meta.env.VITE_AUTH_URL || 'http://localhost:4000/api'
});

export const authClient = authInstance.createClient();
export default authClient;