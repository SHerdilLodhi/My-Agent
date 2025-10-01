const axios = require('axios');

// Create a base axios instance with common configuration
const baseAxios = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Alira-Server/1.0'
  }
});

// Create Supabase-specific axios instance
const supabaseAxios = axios.create({
  baseURL: process.env.SUPABASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'apikey': process.env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
  }
});

// Request interceptor for logging
baseAxios.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for common error handling
baseAxios.interceptors.response.use(
  (response) => {
    console.log(`Response received: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// Supabase-specific response interceptor
supabaseAxios.interceptors.response.use(
  (response) => {
    console.log(`Supabase response: ${response.status} from ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Supabase error:', {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
      url: error.config?.url
    });
    return Promise.reject(error);
  }
);

// Helper functions for common HTTP methods
const httpClient = {
  // Base axios instance for general use
  base: baseAxios,
  
  // Helper methods for Supabase operations
  supabase: {
    // Get data from Supabase
    get: (endpoint, params = {}) => {
      return supabaseAxios.get(endpoint, { params });
    },
    
    // Post data to Supabase
    post: (endpoint, data = {}) => {
      return supabaseAxios.post(endpoint, data);
    },
    
    // Put data to Supabase
    put: (endpoint, data = {}) => {
      return supabaseAxios.put(endpoint, data);
    },
    
    // Delete data from Supabase
    delete: (endpoint) => {
      return supabaseAxios.delete(endpoint);
    },
    
    // Patch data to Supabase
    patch: (endpoint, data = {}) => {
      return supabaseAxios.patch(endpoint, data);
    }
  },
  
  // Helper methods for general HTTP operations
  http: {
    get: (url, config = {}) => baseAxios.get(url, config),
    post: (url, data = {}, config = {}) => baseAxios.post(url, data, config),
    put: (url, data = {}, config = {}) => baseAxios.put(url, data, config),
    delete: (url, config = {}) => baseAxios.delete(url, config),
    patch: (url, data = {}, config = {}) => baseAxios.patch(url, data, config)
  }
};

module.exports = httpClient; 