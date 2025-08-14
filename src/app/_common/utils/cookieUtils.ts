/**
 * 쿠키 관련 유틸리티 함수들
 */
import { devLog } from '@/app/_common/utils/logger';

interface CookieOptions {
    expires?: string;
    path?: string;
    secure?: boolean;
    sameSite?: 'Lax' | 'Strict' | 'None';
    [key: string]: any; // For other potential options
}

/**
 * 쿠키 설정
 * @param name - 쿠키 이름
 * @param value - 쿠키 값
 * @param days - 만료일 (일 단위, 기본값: 7일)
 * @param options - 추가 옵션
 */
export const setCookie = (
    name: string,
    value: string,
    days: number = 7,
    options: CookieOptions = {},
): void => {
    try {
        const expires = new Date();
        expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

        const defaultOptions: CookieOptions = {
            expires: expires.toUTCString(),
            path: '/',
            secure: process.env.NODE_ENV === 'production' && window.location.protocol === 'https:',
            sameSite: 'Lax',
        };

        const cookieOptions: CookieOptions = { ...defaultOptions, ...options };

        let cookieString = `${name}=${encodeURIComponent(value)}`;

        Object.entries(cookieOptions).forEach(([key, val]) => {
            if (val === true) {
                cookieString += `; ${key}`;
            } else if (val !== false && val !== null && val !== undefined) {
                cookieString += `; ${key}=${val}`;
            }
        });

        document.cookie = cookieString;
        devLog.log(`Cookie set: ${name}`);
    } catch (error) {
        console.error('Failed to set cookie:', error);
    }
};

/**
 * 쿠키 가져오기
 * @param name - 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
export const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
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
 * @param name - 삭제할 쿠키 이름
 * @param path - 쿠키 경로 (기본값: '/')
 */
export const deleteCookie = (name: string, path: string = '/'): void => {
    try {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
        devLog.log(`Cookie deleted: ${name}`);
    } catch (error) {
        console.error('Failed to delete cookie:', error);
    }
};

/**
 * 모든 인증 관련 쿠키 삭제
 */
export const clearAuthCookies = (): void => {
    const authCookieNames = ['access_token', 'refresh_token', 'user_id', 'username'];
    authCookieNames.forEach(cookieName => {
        deleteCookie(cookieName);
    });
};

/**
 * 쿠키 존재 여부 확인
 * @param name - 확인할 쿠키 이름
 * @returns 쿠키 존재 여부
 */
export const hasCookie = (name: string): boolean => {
    return getCookie(name) !== null;
};

/**
 * 인증 관련 쿠키 모두 존재하는지 확인
 * @returns 모든 인증 쿠키 존재 여부
 */
export const hasAllAuthCookies = (): boolean => {
    const requiredCookies = ['access_token', 'refresh_token', 'user_id', 'username'];
    return requiredCookies.every(cookieName => hasCookie(cookieName));
};

/**
 * 인증 관련 쿠키 설정
 * @param key - 키 이름
 * @param value - 값
 */
export const setCookieAuth = (key: string, value: string): void => {
    try {
        const days = key.includes('token') ? 7 : 30;
        const secureOptions: CookieOptions = {
            secure: process.env.NODE_ENV === 'production' && window.location.protocol === 'https:',
            sameSite: 'Lax',
            path: '/',
        };
        setCookie(key, value, days, secureOptions);
    } catch (error) {
        console.error(`Failed to set auth cookie for ${key}:`, error);
    }
};

/**
 * 인증 관련 쿠키 제거
 * @param key - 제거할 키 이름
 */
export const removeAuthCookie = (key: string): void => {
    try {
        deleteCookie(key);
    } catch (error) {
        console.error(`Failed to remove ${key} from cookie:`, error);
    }
};

/**
 * 인증 관련 쿠키 가져오기
 * @param key - 가져올 키 이름
 * @returns 값 또는 null
 */
export const getAuthCookie = (key: string): string | null => {
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
export const clearAllAuth = (): void => {
    const authKeys = ['access_token', 'refresh_token', 'user_id', 'username'];
    authKeys.forEach(key => {
        removeAuthCookie(key);
    });
};
