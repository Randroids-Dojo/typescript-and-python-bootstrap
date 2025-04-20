import { createAuthClient } from "better-auth/client";

// Add logging to debug authentication issues
const authUrl = import.meta.env.VITE_AUTH_URL || "http://localhost:4000/api/auth";
console.log('Creating auth client with URL:', authUrl);

let authClient: any;

try {
  authClient = createAuthClient({
    baseURL: authUrl,
  });
  console.log('Auth client created successfully');
} catch (error) {
  console.error('Error creating auth client:', error);
  // Create a dummy client that won't cause errors but won't authenticate
  authClient = {
    getSession: () => Promise.resolve(null),
    signIn: () => Promise.resolve(null),
    signOut: () => Promise.resolve(),
    // Add other required methods with dummy implementations
  } as any;
}

export { authClient };