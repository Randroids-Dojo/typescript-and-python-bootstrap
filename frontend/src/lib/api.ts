import axios from 'axios'
import { authClient } from './auth-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:80/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const session = await authClient.getSession()
  if (session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`
  }
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