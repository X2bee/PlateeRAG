// LLM API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * LLM 제공자 상태 정보를 가져오는 함수
 * @returns {Promise<Object>} LLM 제공자 상태 정보
 */
export const getLLMStatus = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/llm/status`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('LLM status fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch LLM status:', error);
        throw error;
    }
};

/**
 * LLM 기본 제공자를 변경하는 함수
 * @param {string} provider - 변경할 제공자 ("openai", "vllm", 또는 "sgl")
 * @returns {Promise<Object>} 변경 결과
 */
export const switchLLMProvider = async (provider) => {
    try {
        if (!provider || !['openai', 'vllm', 'sgl'].includes(provider)) {
            throw new Error('Invalid provider. Must be "openai", "vllm", or "sgl"');
        }

        const response = await apiClient(`${API_BASE_URL}/api/llm/switch-provider`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                provider: provider,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info(`LLM provider switched to ${provider}:`, data);
        return data;
    } catch (error) {
        devLog.error('Failed to switch LLM provider:', error);
        throw error;
    }
};

/**
 * OpenAI 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
export const testConnection = async (provider) => {
    try {
        devLog.info(`Testing ${provider} connection...`);

        const response = await apiClient(`${API_BASE_URL}/api/llm/test/${provider}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        // HTTP 상태 코드와 응답 데이터 모두 확인
        if (!response.ok || data.status !== 'success') {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        devLog.info('OpenAI connection test completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test OpenAI connection:', error);
        throw error;
    }
};

export const testCollectionConnection = async (provider) => {
    try {
        devLog.info(`Testing ${provider} connection...`);

        const response = await apiClient(`${API_BASE_URL}/api/llm/test/collection/${provider}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        // HTTP 상태 코드와 응답 데이터 모두 확인
        if (!response.ok || data.status !== 'success') {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        devLog.info('OpenAI connection test completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test OpenAI connection:', error);
        throw error;
    }
};

export const testVLLMCollectionConnection = async () => {
    try {
        devLog.info('Testing vLLM connection...');

        const response = await apiClient(`${API_BASE_URL}/api/llm/test/collection/vllm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        // HTTP 상태 코드와 응답 데이터 모두 확인
        if (!response.ok || data.status !== 'success') {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        devLog.info('vLLM connection test completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test vLLM connection:', error);
        throw error;
    }
};
