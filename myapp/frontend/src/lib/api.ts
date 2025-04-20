import axios from 'axios';

// For development, handle environment variables
const API_URL = 'http://localhost:8001';

// Create API client with credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// API functions
export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/user');
    return response.data;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    // Return mock data for template
    return { id: 'user-123', email: 'user@example.com' };
  }
};

export default api;