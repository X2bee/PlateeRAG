import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * @returns {Promise<Array<Object>>} 노드 객체의 배열을 반환하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getNodes = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/node/get`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        return await response.json();
    } catch (error) {
        devLog.error('Failed to get nodes:', error);
        throw error; // 에러를 호출한 쪽으로 다시 던져서 UI에서 처리할 수 있도록 합니다.
    }
};

/**
 * 백엔드에 노드 목록을 새로고침하고(export) 가져오도록 요청합니다.
 * @returns {Promise<Array<Object>>} 새로 생성된 노드 객체의 배열을 반환하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const exportNodes = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/node/export`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        // export 후, 최신 노드 리스트를 다시 불러옵니다.
        return await getNodes();
    } catch (error) {
        devLog.error('Failed to export nodes:', error);
        throw error;
    }
};

/**
 * 백엔드에 노드 목록을 새로고침하고(refresh) 가져오도록 요청합니다.
 * refresh를 먼저 수행한 후 getNodes를 호출하여 순서를 보장합니다.
 * @returns {Promise<Array<Object>>} 새로 생성된 노드 객체의 배열을 반환하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const refreshNodes = async () => {
    try {
        devLog.log('Starting node refresh process...');

        // 1단계: refresh 수행
        const refreshResponse = await apiClient(`${API_BASE_URL}/api/node/refresh`);

        if (!refreshResponse.ok) {
            const errorData = await refreshResponse.json();
            throw new Error(
                errorData.detail || `Refresh failed! status: ${refreshResponse.status}`,
            );
        }

        devLog.log('Node refresh completed, fetching updated nodes...');

        // 2단계: refresh 성공 후 최신 노드 리스트를 가져옵니다
        return await getNodes();
    } catch (error) {
        devLog.error('Failed to refresh nodes:', error);
        throw error;
    }
};
