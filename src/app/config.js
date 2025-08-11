/**
 * Application configuration settings
 */

const host_url = process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost'
const port = process.env.NEXT_PUBLIC_BACKEND_PORT || null

const metrics = process.env.NEXT_PUBLIC_METRICS_HOST || ''

let BASE_URL = '';

if (!port) {
    BASE_URL = host_url;
} else {
    BASE_URL = `${host_url}:${port}`;
}

console.log(`Backend server running at ${BASE_URL}`);
// API Configuration
export const API_CONFIG = {
    BASE_URL: BASE_URL,
    TIMEOUT: 30000, // 30 seconds
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
    },
};

export const APP_CONFIG = {
    DEFAULT_THEME: 'light',
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    SHOW_THINK_BLOCK: process.env.NEXT_PUBLIC_SHOW_THINK_BLOCK === 'true' || false,
};

// Export individual configs for convenience
export const { BASE_URL: API_BASE_URL } = API_CONFIG;

export const METRICS_URL = metrics;
