/**
 * Application configuration settings
 */
import { devLog } from '@/app/_common/utils/logger';

// Hardcoded for K8s deployment - use proxy (relative URLs)
const BASE_URL = '';
const metrics = '';

// 허용된 origin URL들을 설정
const allowedOrigins = ['http://localhost:3000', 'https://code-assistant.x2bee.com'];

devLog.log(`Backend server running at ${BASE_URL}`);

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
    LANGUAGE: process.env.NEXT_PUBLIC_LANGUAGE || 'ko',
    DEBUG_MODE: process.env.NODE_ENV === 'development',
    THINK_DISPLAY_MODE: process.env.NEXT_PUBLIC_THINK_DISPLAY_MODE || 'hide',
    SHOW_THINK_BLOCK:
        process.env.NEXT_PUBLIC_SHOW_THINK_BLOCK === 'true' || false,
    SHOW_TOOL_OUTPUT_BLOCK:
        process.env.NEXT_PUBLIC_SHOW_TOOL_OUTPUT_BLOCK === 'true' || false,
    SHOW_FEEDBACK_LOOP:
        process.env.NEXT_PUBLIC_SHOW_FEEDBACK_LOOP === 'true' || false,
    SHOW_TODO_DETAILS:
        process.env.NEXT_PUBLIC_SHOW_TODO_DETAILS === 'true' || true,
    // 허용된 origins 추가
    ALLOWED_ORIGINS: allowedOrigins
};

// Export individual configs for convenience
export const { BASE_URL: API_BASE_URL } = API_CONFIG;
export const METRICS_URL = metrics;
export const ALLOWED_ORIGINS = allowedOrigins;
