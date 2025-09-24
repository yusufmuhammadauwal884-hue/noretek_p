// lib/config.js

export const getApiBaseUrl = () => {
  // If we're in the browser, use the current protocol
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:' 
      ? 'https://47.107.69.132:9400'
      : 'http://47.107.69.132:9400';
  }
  
  // For server-side rendering, use environment variable or default to HTTP
  return process.env.NODE_ENV === 'production' 
    ? 'https://47.107.69.132:9400'
    : 'http://47.107.69.132:9400';
};

export const API_BASE_URL = getApiBaseUrl();