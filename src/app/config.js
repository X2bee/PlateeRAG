/**
 * Application configuration settings
 */

const host_url = process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost'
const port = process.env.NEXT_PUBLIC_BACKEND_PORT || '8000'

console.log(`Backend server running at ${host_url}:${port}`);
// API Configuration
export const API_CONFIG = {
    BASE_URL: `${host_url}:${port}`,
    // Add other API related configs here if needed in the future
    TIMEOUT: 30000, // 30 seconds
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
    },
};

// You can add other configuration categories here
export const APP_CONFIG = {
    DEFAULT_THEME: 'light',
    DEBUG_MODE: process.env.NODE_ENV === 'development',
};

// Export individual configs for convenience
export const { BASE_URL: API_BASE_URL } = API_CONFIG;
