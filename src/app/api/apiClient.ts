import { getAuthCookie } from '@/app/_common/utils/cookieUtils';
import { devLog } from '@/app/_common/utils/logger';

/**
 * 쿠키에서 인증 토큰을 가져옵니다.
 * @returns {string|null}
 */
const getToken = (): string | null => {
    return getAuthCookie('access_token');
};

/**
 * 쿠키에서 사용자 ID를 가져옵니다.
 * @returns {string|null}
 */
const getUserId = (): string | null => {
    return getAuthCookie('user_id');
};

/**
 * 전역 fetch 래퍼 함수. 모든 API 요청은 이 함수를 통해 이루어집니다.
 * @param url - 요청을 보낼 URL
 * @param options - fetch에 전달할 옵션 객체
 * @returns fetch의 응답(Response) 객체를 담은 프로미스
 */
export const apiClient = async (
    url: string,
    options: RequestInit = {},
): Promise<Response> => {
    const token = getToken();
    const userId = getUserId();

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
        defaultHeaders['X-User-ID'] = userId;
    }

    const mergedOptions: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(url, mergedOptions);

    if (response.status === 401) {
        // This could be enhanced to use a centralized session expiration handler
        devLog.error('Unauthorized request at apiClient. Redirecting to login might be needed.');
    }

    return response;
};
