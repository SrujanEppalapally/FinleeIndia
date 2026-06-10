import axios from 'axios';

// In-memory JWT storage — never persisted to localStorage/cookies.
// Set by auth.login(), cleared by auth.logout().
let _token: string | null = null;

export function setToken(token: string | null): void {
  _token = token;
}

export function getToken(): string | null {
  return _token;
}

// Vite uses VITE_ prefix; the README documents this divergence from CRA's REACT_APP_.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request when present
apiClient.interceptors.request.use((config) => {
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});

// Redirect to /login on 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
