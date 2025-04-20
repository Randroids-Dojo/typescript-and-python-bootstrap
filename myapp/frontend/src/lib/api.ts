import axios from "axios";

// Configure axios
axios.defaults.withCredentials = true;  // include auth cookies in requests

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

export const api = {
  getHello: async () => {
    const response = await axios.get(`${API_URL}/api/hello`);
    return response.data;
  },
  
  getUser: async () => {
    const response = await axios.get(`${API_URL}/api/user`);
    return response.data;
  }
};