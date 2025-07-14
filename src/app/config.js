/**
 * Application configuration settings
 */

// API Configuration
export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000',
    // Add other API related configs here if needed in the future
    TIMEOUT: 30000, // 30 seconds
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
    }
};

// You can add other configuration categories here
export const APP_CONFIG = {
    DEFAULT_THEME: 'light',
    DEBUG_MODE: process.env.NODE_ENV === 'development',
};

// Export individual configs for convenience
export const { BASE_URL: API_BASE_URL } = API_CONFIG;
