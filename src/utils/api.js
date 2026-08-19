// frontend/src/utils/api.js

import { API_BASE_URL } from '../config';

// Default values (no env vars needed)
const DEFAULT_RETRY_COUNT = 5;
const DEFAULT_TIMEOUT = 60000; // 60 seconds
const DEFAULT_RETRY_DELAY = 2000;

/**
 * Fetch with retry logic and timeout handling
 * Handles Render.com cold start delays
 */
export async function fetchWithRetry(
  endpoint, 
  options = {}, 
  retryCount = DEFAULT_RETRY_COUNT,
  timeout = DEFAULT_TIMEOUT
) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      clearTimeout(timeoutId);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        throw new Error('Session expired - please login again');
      }
      
      // Handle other HTTP errors
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      // Don't retry on authentication errors
      if (error.message.includes('Session expired') || error.message.includes('Not authenticated')) {
        throw error;
      }
      
      // Don't retry on 404 - endpoint doesn't exist
      if (error.message.includes('404')) {
        throw new Error('Login endpoint not found. Please check the server configuration.');
      }
      
      // Last attempt - throw the error
      if (attempt === retryCount) {
        console.error(`❌ Request failed after ${retryCount} attempts:`, error.message);
        
        // Special message for timeout/cold start
        if (error.name === 'AbortError') {
          throw new Error('Server is waking up. Please wait a moment and try again.');
        }
        
        if (error.message.includes('ERR_CONNECTION_CLOSED')) {
          throw new Error('Connection to server lost. Please check your internet and try again.');
        }
        
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(DEFAULT_RETRY_DELAY * Math.pow(1.5, attempt - 1), 15000);
      
      console.log(`🔄 Retry ${attempt}/${retryCount} in ${delay}ms...`, error.message);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Authenticated fetch with automatic retry
 */
export async function fetchWithAuth(endpoint, options = {}, retryCount = 3) {
  const token = localStorage.getItem('accessToken');
  
  if (!token) {
    throw new Error('Not authenticated');
  }

  return fetchWithRetry(
    endpoint,
    {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    },
    retryCount,
    30000 // 30 second timeout for authenticated requests
  );
}

/**
 * Check if server is alive (for keep-alive pings)
 */
export async function checkServerHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch (error) {
    console.warn('⚠️ Health check failed:', error.message);
    return false;
  }
}

/**
 * Keep backend alive by pinging every 10 minutes
 */
export function startKeepAlive(interval = 10 * 60 * 1000) {
  let isRunning = true;
  
  const ping = async () => {
    if (!isRunning) return;
    
    const alive = await checkServerHealth();
    if (alive) {
      console.log('🔄 Keep-alive ping successful');
    } else {
      console.warn('⚠️ Keep-alive ping failed');
    }
  };
  
  // Ping immediately
  ping();
  
  // Then every interval
  const timer = setInterval(ping, interval);
  
  return () => {
    isRunning = false;
    clearInterval(timer);
  };
}

/**
 * Login with retry for cold start
 */
export async function loginWithRetry(email, password) {
  // FIXED: Added /api to the URL path
  const url = `${API_BASE_URL}/auth/login`;
  
  console.log('🔐 Login URL:', url);
  
  // Try multiple times with longer timeout for first request (cold start)
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const controller = new AbortController();
      // Longer timeout for first attempt (cold start)
      const timeout = attempt === 1 ? 60000 : 30000;
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      clearTimeout(timeoutId);
      
      console.log(`📡 Login response status: ${response.status}`);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || `Login failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store tokens
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return data;
      
    } catch (error) {
      console.error(`❌ Login attempt ${attempt} failed:`, error.message);
      
      // Don't retry on 404
      if (error.message.includes('404')) {
        throw new Error('Login endpoint not found (404). Please check: ' + url);
      }
      
      if (attempt === 5) {
        // Last attempt failed
        if (error.name === 'AbortError') {
          throw new Error('Login timeout: Server is taking too long to respond. Please try again.');
        }
        throw error;
      }
      
      // Wait with exponential backoff
      const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 10000);
      console.log(`🔄 Login retry ${attempt}/5 in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}