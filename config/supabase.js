const { createClient } = require('@supabase/supabase-js');

// Try to use Node.js 18's built-in fetch first, then fallback to axios
if (!global.fetch) {
  try {
    // Try to use undici fetch (built into Node.js 18)
    const { fetch: undiciFetch } = require('undici');
    global.fetch = undiciFetch;
    console.log("Using undici fetch polyfill");
  } catch (undiciError) {
    try {
      // Fallback to axios
      const axios = require('axios');
      console.log("Using axios fetch polyfill");
      
      global.fetch = async (url, options = {}) => {
        try {
          const response = await axios({
            method: options.method || 'GET',
            url: url,
            headers: options.headers || {},
            data: options.body,
            responseType: 'json',
            timeout: 30000
          });
          
          return {
            ok: response.status >= 200 && response.status < 300,
            status: response.status,
            statusText: response.statusText,
            json: async () => response.data,
            text: async () => JSON.stringify(response.data),
            headers: new Map(Object.entries(response.headers))
          };
        } catch (error) {
          throw new Error(`fetch failed: ${error.message}`);
        }
      };
    } catch (axiosError) {
      console.error("Failed to load both undici and axios:", axiosError);
      throw new Error("No fetch polyfill available");
    }
  }
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file.');
}

console.log("Initializing Supabase client with URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

module.exports = supabase; 