// RAG API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 임베딩 생성을 테스트하는 함수
 * @param {string} queryText - 테스트할 쿼리 텍스트 (기본값: "Hello, world!")
 * @returns {Promise<Object>} 임베딩 테스트 결과
 */
export const testEmbeddingQuery = async (queryText = "Hello, world!") => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/test-query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query_text: queryText
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding query test completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test embedding query:', error);
        throw error;
    }
};



/**
 * 임베딩 제공자를 변경하는 함수
 * @param {string} newProvider - 새로운 제공자 이름 ("openai", "huggingface", "custom_http")
 * @returns {Promise<Object>} 제공자 변경 결과
 */
export const switchEmbeddingProvider = async (newProvider) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/switch-provider`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                new_provider: newProvider
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding provider switched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to switch embedding provider:', error);
        throw error;
    }
};

/**
 * 임베딩 설정 상태를 조회하는 함수
 * @returns {Promise<Object>} 임베딩 설정 상태
 */
export const getEmbeddingConfigStatus = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/config-status`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding config status fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch embedding config status:', error);
        throw error;
    }
};
