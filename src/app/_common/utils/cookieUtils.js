/**
 * 쿠키 관련 유틸리티 함수들
 */

import { devLog } from '@/app/_common/utils/logger';

/**
 * 쿠키 설정
 * @param {string} name - 쿠키 이름
 * @param {string} value - 쿠키 값
 * @param {number} days - 만료일 (일 단위, 기본값: 7일)
 * @param {Object} options - 추가 옵션
 */
export const setCookie = (name, value, days = 7, options = {}) => {
    try {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));

        const defaultOptions = {
            expires: expires.toUTCString(),
            path: '/',
            // 개발 환경에서는 secure를 false로, 프로덕션에서는 https 여부에 따라
            secure: process.env.NODE_ENV === 'production' && window.location.protocol === 'https:',
            // sameSite를 Lax로 변경하여 호환성 개선
            sameSite: 'Lax'
        };

        const cookieOptions = { ...defaultOptions, ...options };

        let cookieString = `${name}=${encodeURIComponent(value)}`;

        Object.entries(cookieOptions).forEach(([key, val]) => {
            if (val === true) {
                cookieString += `; ${key}`;
            } else if (val !== false && val !== null && val !== undefined) {
                cookieString += `; ${key}=${val}`;
            }
        });

        document.cookie = cookieString;
        console.log(`Cookie set: ${name}`);
    } catch (error) {
        console.error('Failed to set cookie:', error);
    }
};

/**
 * 쿠키 가져오기
 * @param {string} name - 쿠키 이름
 * @returns {string|null} 쿠키 값 또는 null
 */
export const getCookie = (name) => {
    try {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');

        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return decodeURIComponent(c.substring(nameEQ.length, c.length));
            }
        }
        return null;
    } catch (error) {
        console.error('Failed to get cookie:', error);
        return null;
    }
};

/**
 * 쿠키 삭제
 * @param {string} name - 삭제할 쿠키 이름
 * @param {string} path - 쿠키 경로 (기본값: '/')
 */
export const deleteCookie = (name, path = '/') => {
    try {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        console.log(`Cookie deleted: ${name}`);
    } catch (error) {
        console.error('Failed to delete cookie:', error);
    }
};

/**
 * 모든 인증 관련 쿠키 삭제
 */
export const clearAuthCookies = () => {
    const authCookieNames = ['access_token', 'refresh_token', 'user_id', 'username'];
    authCookieNames.forEach(cookieName => {
        deleteCookie(cookieName);
    });
};

/**
 * 쿠키 존재 여부 확인
 * @param {string} name - 확인할 쿠키 이름
 * @returns {boolean} 쿠키 존재 여부
 */
export const hasCookie = (name) => {
    return getCookie(name) !== null;
};

/**
 * 인증 관련 쿠키 모두 존재하는지 확인
 * @returns {boolean} 모든 인증 쿠키 존재 여부
 */
export const hasAllAuthCookies = () => {
    const requiredCookies = ['access_token', 'refresh_token', 'user_id', 'username'];
    return requiredCookies.every(cookieName => hasCookie(cookieName));
};

/**
 * localStorage와 쿠키 동기화 -> 쿠키만 사용으로 변경
 * @param {string} key - 키 이름
 * @param {string} value - 값
 */
export const setCookieAuth = (key, value) => {
    try {
        // 토큰은 7일, 사용자 정보는 30일
        const days = key.includes('token') ? 7 : 30;

        // 보안 강화된 쿠키 옵션 (개발 환경 고려)
        const secureOptions = {
            secure: process.env.NODE_ENV === 'production' && window.location.protocol === 'https:',
            sameSite: 'Lax',
            path: '/'
        };

        setCookie(key, value, days, secureOptions);
    } catch (error) {
        console.error(`Failed to set auth cookie for ${key}:`, error);
    }
};

/**
 * 쿠키에서 값 제거 (localStorage 제거 기능 삭제)
 * @param {string} key - 제거할 키 이름
 */
export const removeAuthCookie = (key) => {
    try {
        deleteCookie(key);
    } catch (error) {
        console.error(`Failed to remove ${key} from cookie:`, error);
    }
};

/**
 * @param {string} key - 가져올 키 이름
 * @returns {string|null} 값 또는 null
 */
export const getAuthCookie = (key) => {
    try {
        return getCookie(key);
    } catch (error) {
        console.error(`Failed to get ${key} from cookie:`, error);
        return null;
    }
};

/**
 * 모든 인증 관련 정보 정리 (쿠키만)
 */
export const clearAllAuth = () => {
    const authKeys = ['access_token', 'refresh_token', 'user_id', 'username'];
    authKeys.forEach(key => {
        removeAuthCookie(key);
    });
};
