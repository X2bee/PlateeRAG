// RAG API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';
import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';

/**
 * 사용 가능한 임베딩 제공자 목록을 조회하는 함수
 * @returns {Promise<Object>} 임베딩 제공자 목록
 */
const _getEmbeddingProviders = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/providers`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('Embedding providers fetched:', data);
    return data;
};

export const getEmbeddingProviders = withErrorHandler(_getEmbeddingProviders, 'Failed to fetch embedding providers');

/**
 * 모든 임베딩 제공자를 테스트하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
const _testEmbeddingProviders = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/test`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('Embedding providers tested:', data);
    return data;
};

export const testEmbeddingProviders = withErrorHandler(_testEmbeddingProviders, 'Failed to test embedding providers');

/**
 * 현재 임베딩 클라이언트 상태를 조회하는 함수
 * @returns {Promise<Object>} 임베딩 클라이언트 상태
 */
const _getEmbeddingStatus = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/status`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('Embedding status fetched:', data);
    return data;
};

export const getEmbeddingStatus = withErrorHandler(_getEmbeddingStatus, 'Failed to fetch embedding status');

/**
 * 임베딩 생성을 테스트하는 함수
 * @param {string} queryText - 테스트할 쿼리 텍스트 (기본값: "Hello, world!")
 * @returns {Promise<Object>} 임베딩 테스트 결과
 */
const _testEmbeddingQuery = async (queryText = "Hello, world!") => {
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
};

export const testEmbeddingQuery = withErrorHandler(_testEmbeddingQuery, 'Failed to test embedding query');

/**
 * 임베딩 클라이언트를 강제로 재로드하는 함수
 * @returns {Promise<Object>} 재로드 결과
 */
const _reloadEmbeddingClient = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/reload`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('Embedding client reloaded:', data);
    return data;
};

export const reloadEmbeddingClient = withErrorHandler(_reloadEmbeddingClient, 'Failed to reload embedding client');

/**
 * 임베딩 제공자를 변경하는 함수
 * @param {string} newProvider - 새로운 제공자 이름 ("openai", "huggingface", "custom_http")
 * @returns {Promise<Object>} 제공자 변경 결과
 */
const _switchEmbeddingProvider = async (newProvider) => {
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
};

export const switchEmbeddingProvider = withErrorHandler(_switchEmbeddingProvider, 'Failed to switch embedding provider');

/**
 * 자동으로 최적의 임베딩 제공자로 전환하는 함수
 * @returns {Promise<Object>} 자동 전환 결과
 */
const _autoSwitchEmbeddingProvider = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/auto-switch`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('Embedding provider auto-switched:', data);
    return data;
};

export const autoSwitchEmbeddingProvider = withErrorHandler(_autoSwitchEmbeddingProvider, 'Failed to auto-switch embedding provider');

/**
 * 임베딩 설정 상태를 조회하는 함수
 * @returns {Promise<Object>} 임베딩 설정 상태
 */
const _getEmbeddingConfigStatus = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/config-status`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('Embedding config status fetched:', data);
    return data;
};

export const getEmbeddingConfigStatus = withErrorHandler(_getEmbeddingConfigStatus, 'Failed to fetch embedding config status');

// =============================================================================
// Debug Functions
// =============================================================================

/**
 * 디버깅을 위한 임베딩 상세 정보를 조회하는 함수
 * @returns {Promise<Object>} 임베딩 디버그 정보
 */
const _getEmbeddingDebugInfo = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/debug/info`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('Embedding debug info fetched:', data);
    return data;
};

export const getEmbeddingDebugInfo = withErrorHandler(_getEmbeddingDebugInfo, 'Failed to fetch embedding debug info');
