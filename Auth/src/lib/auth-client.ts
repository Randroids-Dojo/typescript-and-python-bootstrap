import auth from '../auth';

// Create a client for frontend use
// BetterAuth doesn't have createClient method in its type definition
// We'll create our own client interface that matches what we need
export const authClient = {
  login: async (email: string, password: string) => {
    // This would normally use auth's client methods
    // For now, we'll just make a direct call to the API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },
  logout: async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });
    return response.json();
  },
  register: async (userData: any) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  },
  refreshToken: async () => {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST'
    });
    return response.json();
  },
  getUser: async () => {
    const response = await fetch('/api/auth/me');
    return response.json();
  }
};

export default authClient;