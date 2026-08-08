import axios from 'axios'; // Import HTTP client
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import local storage
import { API } from './config'; // Import API base URL from config

// Create a pre-configured axios instance with the backend base URL
const api = axios.create({
  baseURL: API, // Set base URL for all requests (e.g., http://192.168.123.163:3000)
  timeout: 15000, // Request timeout in milliseconds (15 seconds)
  headers: { 'Content-Type': 'application/json' }, // Default JSON content type
});

// Request interceptor: attaches customer_id from AsyncStorage to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    const customerId = await AsyncStorage.getItem('customerId'); // Get stored customer ID
    if (customerId) {
      // Append customer_id to query params for GET requests
      if (config.method === 'get') {
        config.params = { ...config.params, customer_id: customerId };
      }
      // Append customer_id to request body for POST/PUT requests
      if (config.method === 'post' || config.method === 'put') {
        config.data = { ...config.data, customer_id: parseInt(customerId) };
      }
    }
  } catch (e) { /* Silently skip if AsyncStorage fails */ }
  return config; // Return modified config
}, (error) => Promise.reject(error)); // Forward request errors

// Response interceptor: standardizes error handling
api.interceptors.response.use(
  (response) => response, // Pass through successful responses
  (error) => {
    // Handle specific HTTP error codes with user-friendly messages
    if (error.response) {
      const status = error.response.status; // Get HTTP status code
      if (status === 404) {
        console.warn('API 404:', error.response.config.url); // Log missing endpoints
      } else if (status === 500) {
        console.error('API 500:', error.response.config.url); // Log server errors
      }
    } else if (error.code === 'ERR_NETWORK') {
      // Network connectivity issue (server unreachable)
      console.error('Network error - server may be down');
    }
    return Promise.reject(error); // Re-throw error for caller to handle
  }
);

// ─── AUTHENTICATION API ─────────────────────────────────────

// Login with email and password
export const loginAPI = (email, password) =>
  api.post('/customer/login', { email, password });

// Register a new customer account
export const registerAPI = (name, email, phone, password) =>
  api.post('/customer/register', { name, email, phone, password });

// ─── TOKENS API ─────────────────────────────────────────────

// Fetch all tokens for the current customer (uses interceptor for customer_id)
export const getMyTokensAPI = () =>
  api.get('/customer/tokens');

// Request a new token at a specific counter
export const requestTokenAPI = (counter_id, token_type_id = 1) =>
  api.post('/request-token', { counter_id, token_type_id });

// Cancel a token by its ID (only pending/waiting tokens can be cancelled)
export const cancelTokenAPI = (tokenId) =>
  api.post(`/customer/tokens/${tokenId}/cancel`);

// Get the latest token status (queue position, etc.)
export const getTokenStatusAPI = (customerId) =>
  api.get(`/token-status/${customerId}`);

// ─── COUNTERS API ───────────────────────────────────────────

// Fetch all available counters from the backend
export const getCountersAPI = () =>
  api.get('/counters');

// ─── STAFF API ──────────────────────────────────────────────

// Staff login (hardcoded credentials)
export const staffLoginAPI = (email, password) =>
  api.post('/login', { email, password });

// ─── EXPORT THE RAW API INSTANCE ────────────────────────────

export default api; // Export axios instance for custom requests
