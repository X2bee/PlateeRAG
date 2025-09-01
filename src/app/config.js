/**
 * Application configuration settings
 */

const host_url = process.env.NEXT_PUBLIC_BACKEND_HOST || 'http://localhost';
const port = process.env.NEXT_PUBLIC_BACKEND_PORT || null;
const metrics = process.env.NEXT_PUBLIC_METRICS_HOST || '';

// 허용된 origin URL들을 설정
const allowedOrigins = process.env.NEXT_PUBLIC_ALLOWED_ORIGINS 
    ? process.env.NEXT_PUBLIC_ALLOWED_ORIGINS.split(',').map(url => url.trim())
    : ['http://localhost:3000','https://code-assistant.x2bee.com']; // 기본값

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
    THINK_DISPLAY_MODE: process.env.NEXT_PUBLIC_THINK_DISPLAY_MODE || 'hide',
    SHOW_THINK_BLOCK:
        process.env.NEXT_PUBLIC_SHOW_THINK_BLOCK === 'true' || false,
    SHOW_TOOL_OUTPUT_BLOCK:
        process.env.NEXT_PUBLIC_SHOW_TOOL_OUTPUT_BLOCK === 'true' || false,
    // 허용된 origins 추가
    ALLOWED_ORIGINS: allowedOrigins
};

// Export individual configs for convenience
export const { BASE_URL: API_BASE_URL } = API_CONFIG;
export const METRICS_URL = metrics;
export const ALLOWED_ORIGINS = allowedOrigins;