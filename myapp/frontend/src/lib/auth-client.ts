// Import axios
import axios from 'axios';

// Configure axios to include cookies
axios.defaults.withCredentials = true;

// This is a mock implementation to make the template work
// Replace with actual BetterAuth when implemented
export const authClient = {
  signIn: {
    email: async () => ({ user: null }),
    social: async () => ({ user: null })
  },
  signUp: {
    email: async () => ({ user: null })
  },
  signOut: async () => {},
  verifyEmail: async () => {},
  resetPassword: async () => {},
  forgotPassword: async () => {},
  useSession: () => {
    return {
      data: null,
      isLoading: false,
      error: null,
      refetch: () => {}
    };
  },
  useSignOut: () => {
    return {
      signOut: async () => {},
      isPending: false,
      error: null
    };
  }
};

// No need for environment variables in mock