import axios from 'axios';

// Create a pre-configured axios instance for API calls
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  withCredentials: true, // Always send cookies with requests
});

export default api;