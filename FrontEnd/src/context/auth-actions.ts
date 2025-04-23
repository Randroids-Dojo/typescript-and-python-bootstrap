import { authClient } from '@/lib/auth';

export const authActions = {
  // Function to handle login
  handleLogin: async (email: string, password: string) => {
    try {
      return await authClient.signIn.email({
        email,
        password,
        callbackURL: '/dashboard'
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Function to handle registration
  handleRegister: async (email: string, password: string, name: string) => {
    try {
      return await authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: '/dashboard'
      });
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // Function to handle logout
  handleLogout: async () => {
    try {
      return await authClient.signOut({});
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

  // Function to get all sessions
  getSessions: async () => {
    try {
      return await authClient.getSessions();
    } catch (error) {
      console.error('Error getting sessions:', error);
      throw error;
    }
  },

  // Function to revoke a session
  revokeSession: async (sessionId: string) => {
    try {
      return await authClient.revokeSession(sessionId);
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  }
};