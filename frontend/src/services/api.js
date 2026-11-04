import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach stored token to headers if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mycourse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Capture 401s and clean up session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if server invalidates session
      if (localStorage.getItem('mycourse_token')) {
        localStorage.removeItem('mycourse_token');
        localStorage.removeItem('mycourse_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;

