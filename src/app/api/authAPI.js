import { devLog } from '@/app/utils/logger';
import { API_BASE_URL } from '@/app/config.js';

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
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData),
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
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        // 토큰을 localStorage에 저장
        if (result.access_token) {
            localStorage.setItem('access_token', result.access_token);
        }
        if (result.refresh_token) {
            localStorage.setItem('refresh_token', result.refresh_token);
        }
        if (result.user_id) {
            localStorage.setItem('user_id', result.user_id.toString());
        }
        if (result.username) {
            localStorage.setItem('username', result.username);
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
        const authToken = token || localStorage.getItem('access_token');

        if (!authToken) {
            throw new Error('No token found');
        }

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

        // localStorage에서 모든 인증 관련 데이터 삭제
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');

        devLog.log('Logout successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to logout:', error);
        // 로그아웃 실패해도 로컬 저장소는 정리
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
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
        const authToken = token || localStorage.getItem('access_token');

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
        const refToken = refreshToken || localStorage.getItem('refresh_token');

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

        // 새로운 액세스 토큰을 localStorage에 저장
        if (result.access_token) {
            localStorage.setItem('access_token', result.access_token);
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
        const userId = localStorage.getItem('user_id');
        const username = localStorage.getItem('username');
        const accessToken = localStorage.getItem('access_token');

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
    const token = localStorage.getItem('access_token');
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
