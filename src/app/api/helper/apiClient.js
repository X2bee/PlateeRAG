import { getAuthCookie } from '@/app/_common/utils/cookieUtils';
import { devLog } from '@/app/_common/utils/logger';

/**
 * 쿠키에서 인증 토큰을 가져옵니다.
 * @returns {string|null}
 */
const getToken = () => {
    return getAuthCookie('access_token');
};

/**
 * 쿠키에서 사용자 ID를 가져옵니다.
 * @returns {string|null}
 */
const getUserId = () => {
    return getAuthCookie('user_id');
};

/**
 * 전역 fetch 래퍼 함수. 모든 API 요청은 이 함수를 통해 이루어집니다.
 * @param {string} url - 요청을 보낼 URL
 * @param {object} options - fetch에 전달할 옵션 객체
 * @param {boolean} useDefaultContentType - 기본 Content-Type 사용 여부 (기본값: true)
 * @returns {Promise<Response>} fetch의 응답(Response) 객체를 담은 프로미스
 */
export const apiClient = async (url, options = {}, useDefaultContentType = true) => {
    const token = getToken();
    const userId = getUserId();

    const defaultHeaders = {};

    // useDefaultContentType이 true인 경우에만 기본 Content-Type 설정
    if (useDefaultContentType) {
        defaultHeaders['Content-Type'] = 'application/json';
    }

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    // user_id가 있으면 별도의 헤더로 추가
    if (userId) {
        defaultHeaders['X-User-ID'] = userId;
    }

    // 사용자가 명시적으로 Content-Type을 설정한 경우 기본값을 사용하지 않음
    const userHeaders = options.headers || {};
    if (userHeaders.hasOwnProperty('Content-Type')) {
        delete defaultHeaders['Content-Type'];
    }

    const mergedOptions = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...userHeaders,
        },
    };

    const response = await fetch(`${url}`, mergedOptions);

    if (response.status === 401) {
        devLog.error('Unauthorized request. Redirecting to login...');
    }

    return response;
};
