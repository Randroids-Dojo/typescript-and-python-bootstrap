import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:80/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  // Better Auth handles cookies automatically with withCredentials
  // The auth.session cookie will be sent automatically
  // No need to manually add Authorization header
  return config
})

// API methods
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { display_name?: string; bio?: string }) => 
    api.put('/user/profile', data),
}

export const counterApi = {
  getCounter: () => api.get('/counter'),
  incrementCounter: () => api.post('/counter/increment'),
}