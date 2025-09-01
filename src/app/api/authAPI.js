import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import {
    setCookieAuth,
    removeAuthCookie,
    getAuthCookie,
    clearAllAuth
} from '@/app/_common/utils/cookieUtils';
import { generateSha256Hash } from '@/app/_common/utils/generateSha1Hash';
import { apiClient } from '@/app/api/helper/apiClient';


/**
 * 휴대폰 번호를 정규화하는 함수 (010-1234-5678 형태로 변환)
 * @param {string} phoneNumber - 원본 휴대폰 번호
 * @returns {string} 정규화된 휴대폰 번호 또는 원본 번호
 */
const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
        return phoneNumber;
    }

    try {
        // 모든 공백, 하이픈, 괄호 등 제거하고 숫자만 추출
        const numbersOnly = phoneNumber.replace(/[^\d]/g, '');

        // 한국 휴대폰 번호 패턴 확인 (010, 011, 016, 017, 018, 019로 시작하는 11자리)
        const koreanMobilePattern = /^(010|011|016|017|018|019)(\d{3,4})(\d{4})$/;
        const match = numbersOnly.match(koreanMobilePattern);

        if (match) {
            const [, prefix, middle, last] = match;
            return `${prefix}-${middle}-${last}`;
        }

        // 패턴이 맞지 않으면 원본 반환
        return phoneNumber;
    } catch (error) {
        devLog.warn('Failed to normalize phone number:', error);
        return phoneNumber;
    }
};

/**
 * 회원가입 API
 * @param {Object} signupData - 회원가입 데이터
 * @param {string} signupData.username - 사용자명
 * @param {string} signupData.email - 이메일
 * @param {string} signupData.password - 비밀번호
 * @param {string} [signupData.full_name] - 전체 이름 (선택사항)
 * @param {string} [signupData.group_name] - 소속 (선택사항)
 * @param {string} [signupData.mobile_phone_number] - 휴대폰 번호 (선택사항)
 * @returns {Promise<Object>} 회원가입 결과
 */
export const signup = async (signupData) => {
    try {
        // 휴대폰 번호가 있으면 정규화
        const normalizedSignupData = {
            ...signupData
        };

        if (signupData.mobile_phone_number) {
            normalizedSignupData.mobile_phone_number = normalizePhoneNumber(signupData.mobile_phone_number);
        }

        // 패스워드를 SHA256으로 해시화
        const hashedSignupData = {
            ...normalizedSignupData,
            password: generateSha256Hash(normalizedSignupData.password)
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
 * 사용자 그룹의 사용 가능한 그룹 목록 조회 API
 * @param {number} user_id - 사용자 ID
 * @returns {Promise<Object>} 사용 가능한 그룹 목록
 */
export const getGroupAvailableGroups = async (user_id) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/auth/available-group?user_id=${user_id}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const result = await response.json();
        devLog.log('Group available groups fetched successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch group available groups:', error);
        throw error;
    }
};

/**
 * 사용자 그룹의 사용 가능한 섹션 조회 API
 * @param {number} user_id - 사용자 ID
 * @returns {Promise<Object>} 사용 가능한 섹션 목록
 */
export const getGroupAvailableSections = async (user_id) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/auth/available-section?user_id=${user_id}`,
            {
                method: 'GET',
            }
        );

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const result = await response.json();
        devLog.log('Group available sections fetched successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch group available sections:', error);
        throw error;
    }
};
