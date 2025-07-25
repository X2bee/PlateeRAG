import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import {
    setCookieAuth,
    removeAuthCookie,
    getAuthCookie,
    clearAllAuth
} from '@/app/_common/utils/cookieUtils';
import { generateSha256Hash } from '@/app/_common/utils/generateSha1Hash';

/**
 * 회원가입 API
 * @param {Object} signupData - 회원가입 데이터
 * @param {string} signupData.username - 사용자명
 * @param {string} signupData.email - 이메일
 * @param {string} signupData.password - 비밀번호
 * @param {string} [signupData.full_name] - 전체 이름 (선택사항)
 * @returns {Promise<Object>} 회원가입 결과
 */
export const signup = async (signupData) => {
    try {
        // 패스워드를 SHA256으로 해시화
        const hashedSignupData = {
            ...signupData,
            password: generateSha256Hash(signupData.password)
        };

        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hashedSignupData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Signup successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to signup:', error);
        throw error;
    }
};

/**
 * 로그인 API
 * @param {Object} loginData - 로그인 데이터
 * @param {string} loginData.email - 이메일
 * @param {string} loginData.password - 비밀번호
 * @returns {Promise<Object>} 로그인 결과 (토큰 포함)
 */
export const login = async (loginData) => {
    try {
        // 패스워드를 SHA256으로 해시화
        const hashedLoginData = {
            ...loginData,
            password: generateSha256Hash(loginData.password)
        };

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(hashedLoginData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        // 토큰을 쿠키에만 저장 (localStorage 사용 안 함)
        if (result.access_token) {
            setCookieAuth('access_token', result.access_token);
        }
        if (result.refresh_token) {
            setCookieAuth('refresh_token', result.refresh_token);
        }
        if (result.user_id) {
            setCookieAuth('user_id', result.user_id.toString());
        }
        if (result.username) {
            setCookieAuth('username', result.username);
        }

        devLog.log('Login successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to login:', error);
        throw error;
    }
};

/**
 * 로그아웃 API
 * @param {string} [token] - 로그아웃할 토큰 (선택사항, 없으면 localStorage에서 가져옴)
 * @returns {Promise<Object>} 로그아웃 결과
 */
export const logout = async (token = null) => {
    try {
        const authToken = token || getAuthCookie('access_token');

        if (!authToken) {
            throw new Error('No token found');
        }

        // 먼저 토큰이 유효한지 확인
        const tokenValidation = await validateToken(authToken);

        if (!tokenValidation.valid) {
            // 토큰이 이미 유효하지 않으면 서버 요청 없이 쿠키 정리만 수행
            clearAllAuth();

            devLog.log('Token already invalid, cookie cleanup completed');
            return { message: 'Already logged out (token was invalid)' };
        }

        // 토큰이 유효하면 서버에 로그아웃 요청
        const response = await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: authToken }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        // 쿠키에서 모든 인증 관련 데이터 삭제
        clearAllAuth();

        devLog.log('Logout successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to logout:', error);
        // 로그아웃 실패해도 쿠키는 정리
        clearAllAuth();
        throw error;
    }
};

/**
 * 토큰 검증 API
 * @param {string} [token] - 검증할 토큰 (선택사항, 없으면 localStorage에서 가져옴)
 * @returns {Promise<Object>} 토큰 검증 결과
 */
export const validateToken = async (token = null) => {
    try {
        const authToken = token || getAuthCookie('access_token');

        if (!authToken) {
            return { valid: false };
        }

        const response = await fetch(
            `${API_BASE_URL}/auth/validate-token?token=${encodeURIComponent(authToken)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const result = await response.json();

        if (!response.ok) {
            devLog.warn('Token validation failed:', result);
            return { valid: false };
        }

        devLog.log('Token validation result:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to validate token:', error);
        return { valid: false };
    }
};

/**
 * 토큰 갱신 API
 * @param {string} [refreshToken] - 갱신 토큰 (선택사항, 없으면 localStorage에서 가져옴)
 * @returns {Promise<Object>} 새로운 액세스 토큰
 */
export const refreshToken = async (refreshToken = null) => {
    try {
        const refToken = refreshToken || getAuthCookie('refresh_token');

        if (!refToken) {
            throw new Error('No refresh token found');
        }

        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: refToken }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        // 새로운 액세스 토큰을 쿠키에만 저장
        if (result.access_token) {
            setCookieAuth('access_token', result.access_token);
        }

        devLog.log('Token refresh successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to refresh token:', error);
        throw error;
    }
};

/**
 * 현재 로그인한 사용자 정보 가져오기
 * @returns {Object|null} 사용자 정보 또는 null
 */
export const getCurrentUser = () => {
    try {
        const userId = getAuthCookie('user_id');
        const username = getAuthCookie('username');
        const accessToken = getAuthCookie('access_token');

        if (!userId || !username || !accessToken) {
            return null;
        }

        return {
            user_id: parseInt(userId),
            username: username,
            access_token: accessToken,
        };
    } catch (error) {
        devLog.error('Failed to get current user:', error);
        return null;
    }
};

/**
 * 사용자가 로그인되어 있는지 확인
 * @returns {boolean} 로그인 상태
 */
export const isLoggedIn = () => {
    const user = getCurrentUser();
    return user !== null;
};

/**
 * 인증된 요청을 위한 Authorization 헤더 생성
 * @returns {Object} Authorization 헤더 객체
 */
export const getAuthHeaders = () => {
    const token = getAuthCookie('access_token');
    if (!token) {
        return {};
    }

    return {
        'Authorization': `Bearer ${token}`,
    };
};

/**
 * 자동 토큰 갱신을 포함한 인증된 fetch 요청
 * @param {string} url - 요청 URL
 * @param {Object} options - fetch 옵션
 * @returns {Promise<Response>} fetch 응답
 */
export const authenticatedFetch = async (url, options = {}) => {
    try {
        // 기본 헤더에 인증 헤더 추가
        const headers = {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
            ...(options.headers || {}),
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        // 401 에러 (Unauthorized)이면 토큰 갱신 시도
        if (response.status === 401) {
            try {
                await refreshToken();

                // 갱신된 토큰으로 다시 요청
                const newHeaders = {
                    ...headers,
                    ...getAuthHeaders(),
                };

                return await fetch(url, {
                    ...options,
                    headers: newHeaders,
                });
            } catch (refreshError) {
                devLog.error('Token refresh failed, redirecting to login:', refreshError);
                // 토큰 갱신 실패시 로그아웃 처리
                await logout();
                throw new Error('Authentication expired. Please login again.');
            }
        }

        return response;
    } catch (error) {
        devLog.error('Authenticated fetch failed:', error);
        throw error;
    }
};

/**
 * 로그아웃하고 로그인 페이지로 리다이렉트
 */
export const logoutAndRedirect = async () => {
    try {
        await logout();
    } catch (error) {
        devLog.error('Logout failed during redirect:', error);
    }

    // 로그인 페이지로 리다이렉트 (Next.js 라우터 사용)
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};

/**
 * 8자리 랜덤 ID 생성 함수
 * @returns {string} 8자리 랜덤 문자열
 */
const generateRandomId = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

/**
 * 랜덤 비밀번호 생성 함수
 * @param {number} length - 비밀번호 길이 (기본값: 12)
 * @returns {string} 랜덤 비밀번호
 */
const generateRandomPassword = (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
};

/**
 * 게스트 계정 생성 및 자동 로그인 API
 * @returns {Promise<Object>} 로그인 결과 (토큰 포함)
 */
export const createGuestAccountAndLogin = async () => {
    try {
        devLog.log('Creating guest account...');

        // 게스트 계정 정보 생성
        const randomId = generateRandomId();
        const guestUsername = `guest_${randomId}`;
        const guestEmail = `guest_${randomId}@guest.com`;
        const guestPassword = generateRandomPassword();

        devLog.log('Guest account info generated:', {
            username: guestUsername,
            email: guestEmail
        });

        // 1. 게스트 계정 회원가입
        const signupData = {
            username: guestUsername,
            email: guestEmail,
            password: guestPassword, // 원본 패스워드를 signup 함수에 전달 (signup 함수에서 해시화됨)
            full_name: `Guest User ${randomId}`
        };

        const signupResult = await signup(signupData);
        devLog.log('Guest signup successful:', signupResult);

        // 2. 생성된 계정으로 자동 로그인
        const loginData = {
            email: guestEmail,
            password: guestPassword // 원본 패스워드를 login 함수에 전달 (login 함수에서 해시화됨)
        };

        const loginResult = await login(loginData);
        devLog.log('Guest auto-login successful:', loginResult);

        return {
            ...loginResult,
            isGuest: true,
            guestInfo: {
                username: guestUsername,
                email: guestEmail
            }
        };

    } catch (error) {
        devLog.error('Failed to create guest account or login:', error);
        throw new Error(
            error.message || '게스트 계정 생성에 실패했습니다. 잠시 후 다시 시도해주세요.'
        );
    }
};
