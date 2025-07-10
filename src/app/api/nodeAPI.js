import { devLog } from '@/app/utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * @returns {Promise<Array<Object>>} 노드 객체의 배열을 반환하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getNodes = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/node/get`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        devLog.error("Failed to get nodes:", error);
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
        const response = await fetch(`${API_BASE_URL}/node/export`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        
        // export 후, 최신 노드 리스트를 다시 불러옵니다.
        return await getNodes();
    } catch (error) {
        devLog.error("Failed to export nodes:", error);
        throw error;
    }
};
