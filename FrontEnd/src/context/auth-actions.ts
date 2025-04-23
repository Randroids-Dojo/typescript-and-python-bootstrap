import { authClient } from '@/lib/auth';

export const authActions = {
  // Function to handle login
  handleLogin: async (email: string, password: string) => {
    try {
      return await authClient.login(email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Function to handle registration
  handleRegister: async (email: string, password: string, name: string) => {
    try {
      return await authClient.register({ email, password, name });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Function to handle logout
  handleLogout: async () => {
    try {
      return await authClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Function to get user profile
  getUserProfile: async () => {
    try {
      return await authClient.getUser();
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  // Function to get all sessions - mocked for now
  getSessions: async () => {
    try {
      // Mock session data
      return [
        {
          id: '1',
          userId: '1',
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          device: 'Current Device',
          lastActive: new Date().toISOString(),
          ip: '127.0.0.1'
        }
      ];
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  },

  // Function to revoke a session - mocked for now
  revokeSession: async (sessionId: string) => {
    try {
      console.log(`Mock revoking session ${sessionId}`);
      return true;
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  }
};