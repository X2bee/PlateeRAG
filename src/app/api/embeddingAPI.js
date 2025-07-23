// RAG API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * 사용 가능한 임베딩 제공자 목록을 조회하는 함수
 * @returns {Promise<Object>} 임베딩 제공자 목록
 */
export const getEmbeddingProviders = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/providers`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding providers fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch embedding providers:', error);
        throw error;
    }
};

/**
 * 모든 임베딩 제공자를 테스트하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
export const testEmbeddingProviders = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/test`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding providers tested:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test embedding providers:', error);
        throw error;
    }
};

/**
 * 현재 임베딩 클라이언트 상태를 조회하는 함수
 * @returns {Promise<Object>} 임베딩 클라이언트 상태
 */
export const getEmbeddingStatus = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/status`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding status fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch embedding status:', error);
        throw error;
    }
};

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
 * 임베딩 클라이언트를 강제로 재로드하는 함수
 * @returns {Promise<Object>} 재로드 결과
 */
export const reloadEmbeddingClient = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/reload`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding client reloaded:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to reload embedding client:', error);
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
 * 자동으로 최적의 임베딩 제공자로 전환하는 함수
 * @returns {Promise<Object>} 자동 전환 결과
 */
export const autoSwitchEmbeddingProvider = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/embedding/auto-switch`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding provider auto-switched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to auto-switch embedding provider:', error);
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

// =============================================================================
// Debug Functions
// =============================================================================

/**
 * 디버깅을 위한 임베딩 상세 정보를 조회하는 함수
 * @returns {Promise<Object>} 임베딩 디버그 정보
 */
export const getEmbeddingDebugInfo = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/debug/info`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Embedding debug info fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch embedding debug info:', error);
        throw error;
    }
};
