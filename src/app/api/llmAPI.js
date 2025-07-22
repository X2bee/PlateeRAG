// LLM API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/utils/logger';
import { API_BASE_URL } from '@/app/config.js';

/**
 * LLM 제공자 상태 정보를 가져오는 함수
 * @returns {Promise<Object>} LLM 제공자 상태 정보
 */
export const getLLMStatus = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/config/llm/status`);

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
 * @param {string} provider - 변경할 제공자 ("openai" 또는 "vllm")
 * @returns {Promise<Object>} 변경 결과
 */
export const switchLLMProvider = async (provider) => {
    try {
        if (!provider || !['openai', 'vllm'].includes(provider)) {
            throw new Error('Invalid provider. Must be "openai" or "vllm"');
        }

        const response = await fetch(`${API_BASE_URL}/api/config/llm/switch-provider`, {
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
 * 사용 가능한 LLM 제공자로 자동 전환하는 함수
 * @returns {Promise<Object>} 자동 전환 결과
 */
export const autoSwitchLLMProvider = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/config/llm/auto-switch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('LLM provider auto-switched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to auto-switch LLM provider:', error);
        throw error;
    }
};

/**
 * 현재 기본 LLM 제공자 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
export const testLLMConnection = async () => {
    try {
        devLog.info('Testing current LLM provider connection...');

        const response = await fetch(`${API_BASE_URL}/api/config/test/llm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('LLM connection test completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test LLM connection:', error);
        throw error;
    }
};

/**
 * OpenAI 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
export const testOpenAIConnection = async () => {
    try {
        devLog.info('Testing OpenAI connection...');

        const response = await fetch(`${API_BASE_URL}/api/config/test/openai`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('OpenAI connection test completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test OpenAI connection:', error);
        throw error;
    }
};

/**
 * vLLM 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
export const testVLLMConnection = async () => {
    try {
        devLog.info('Testing vLLM connection...');

        const response = await fetch(`${API_BASE_URL}/api/config/test/vllm`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('vLLM connection test completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to test vLLM connection:', error);
        throw error;
    }
};

/**
 * 특정 LLM 제공자의 설정 유효성을 검사하는 함수
 * @param {string} provider - 검사할 제공자 ("openai" 또는 "vllm")
 * @returns {Promise<Object>} 유효성 검사 결과
 */
export const validateLLMProvider = async (provider) => {
    try {
        if (!provider || !['openai', 'vllm'].includes(provider)) {
            throw new Error('Invalid provider. Must be "openai" or "vllm"');
        }

        // 상태 정보를 가져와서 해당 제공자의 설정 확인
        const status = await getLLMStatus();
        const providerStatus = status.providers[provider];

        return {
            valid: providerStatus.configured && providerStatus.available,
            configured: providerStatus.configured,
            available: providerStatus.available,
            error: providerStatus.error || null,
        };
    } catch (error) {
        devLog.error(`Failed to validate LLM provider ${provider}:`, error);
        throw error;
    }
};

/**
 * 현재 활성화된 LLM 제공자 정보를 가져오는 함수
 * @returns {Promise<Object>} 현재 제공자 정보
 */
export const getCurrentLLMProvider = async () => {
    try {
        const status = await getLLMStatus();
        return {
            provider: status.current_provider,
            available: status.available_providers.includes(status.current_provider),
            providers_status: status.providers,
        };
    } catch (error) {
        devLog.error('Failed to get current LLM provider:', error);
        throw error;
    }
};

/**
 * 사용 가능한 모든 LLM 제공자 목록을 가져오는 함수
 * @returns {Promise<Array>} 사용 가능한 제공자 목록
 */
export const getAvailableLLMProviders = async () => {
    try {
        const status = await getLLMStatus();
        return status.available_providers || [];
    } catch (error) {
        devLog.error('Failed to get available LLM providers:', error);
        throw error;
    }
};

/**
 * LLM 제공자별 상세 정보를 가져오는 함수
 * @returns {Promise<Object>} 제공자별 상세 정보
 */
export const getLLMProvidersDetails = async () => {
    try {
        const status = await getLLMStatus();
        return {
            current_provider: status.current_provider,
            providers: {
                openai: {
                    name: 'OpenAI',
                    displayName: 'OpenAI',
                    description: 'GPT-4, GPT-3.5 등 OpenAI의 고성능 언어 모델',
                    configured: status.providers.openai.configured,
                    available: status.providers.openai.available,
                    error: status.providers.openai.error,
                    is_current: status.current_provider === 'openai',
                },
                vllm: {
                    name: 'vLLM',
                    displayName: 'vLLM',
                    description: '고성능 LLM 추론을 위한 vLLM 서버 (self-hosted)',
                    configured: status.providers.vllm.configured,
                    available: status.providers.vllm.available,
                    error: status.providers.vllm.error,
                    is_current: status.current_provider === 'vllm',
                },
            },
        };
    } catch (error) {
        devLog.error('Failed to get LLM providers details:', error);
        throw error;
    }
};