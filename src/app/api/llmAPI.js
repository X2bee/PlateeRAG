// LLM API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * LLM 제공자 상태 정보를 가져오는 함수
 * @returns {Promise<Object>} LLM 제공자 상태 정보
 */
const _getLLMStatus = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/config/llm/status`);

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info('LLM status fetched:', data);
    return data;
};

export const getLLMStatus = withErrorHandler(_getLLMStatus, 'Failed to fetch LLM status');

/**
 * LLM 기본 제공자를 변경하는 함수
 * @param {string} provider - 변경할 제공자 ("openai", "vllm", 또는 "sgl")
 * @returns {Promise<Object>} 변경 결과
 */
const _switchLLMProvider = async (provider) => {
    if (!provider || !['openai', 'vllm', 'sgl'].includes(provider)) {
        throw new Error('Invalid provider. Must be "openai", "vllm", or "sgl"');
    }

    const response = await apiClient(`${API_BASE_URL}/api/config/llm/switch-provider`, {
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
};

export const switchLLMProvider = withErrorHandler(_switchLLMProvider, 'Failed to switch LLM provider');

/**
 * 사용 가능한 LLM 제공자로 자동 전환하는 함수
 * @returns {Promise<Object>} 자동 전환 결과
 */
const _autoSwitchLLMProvider = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/config/llm/auto-switch`, {
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
};

export const autoSwitchLLMProvider = withErrorHandler(_autoSwitchLLMProvider, 'Failed to auto-switch LLM provider');

/**
 * 현재 기본 LLM 제공자 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
const _testLLMConnection = async () => {
    devLog.info('Testing current LLM provider connection...');

    const response = await apiClient(`${API_BASE_URL}/api/config/test/llm`, {
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

    devLog.info('LLM connection test completed:', data);
    return data;
};

export const testLLMConnection = withErrorHandler(_testLLMConnection, 'Failed to test LLM connection');

/**
 * OpenAI 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
const _testOpenAIConnection = async () => {
    devLog.info('Testing OpenAI connection...');

    const response = await apiClient(`${API_BASE_URL}/api/config/test/openai`, {
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
};

export const testOpenAIConnection = withErrorHandler(_testOpenAIConnection, 'Failed to test OpenAI connection');

const _testOpenACollectionConnection = async () => {
    devLog.info('Testing OpenAI connection...');

    const response = await apiClient(`${API_BASE_URL}/api/config/test/collection/openai`, {
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
};

export const testOpenACollectionConnection = withErrorHandler(_testOpenACollectionConnection, 'Failed to test OpenAI connection');

/**
 * vLLM 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
const _testVLLMConnection = async () => {
    devLog.info('Testing vLLM connection...');

    const response = await apiClient(`${API_BASE_URL}/api/config/test/vllm`, {
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
};

export const testVLLMConnection = withErrorHandler(_testVLLMConnection, 'Failed to test vLLM connection');

const _testVLLMCollectionConnection = async () => {
    devLog.info('Testing vLLM connection...');

    const response = await apiClient(`${API_BASE_URL}/api/config/test/collection/vllm`, {
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
};

export const testVLLMCollectionConnection = withErrorHandler(_testVLLMCollectionConnection, 'Failed to test vLLM connection');

/**
 * SGL 연결 테스트를 수행하는 함수
 * @returns {Promise<Object>} 테스트 결과
 */
const _testSGLConnection = async () => {
    devLog.info('Testing SGL connection...');

    const response = await apiClient(`${API_BASE_URL}/api/config/test/sgl`, {
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

    devLog.info('SGL connection test completed:', data);
    return data;
};

export const testSGLConnection = withErrorHandler(_testSGLConnection, 'Failed to test SGL connection');

/**
 * 특정 LLM 제공자의 설정 유효성을 검사하는 함수
 * @param {string} provider - 검사할 제공자 ("openai", "vllm", 또는 "sgl")
 * @returns {Promise<Object>} 유효성 검사 결과
 */
const _validateLLMProvider = async (provider) => {
    if (!provider || !['openai', 'vllm', 'sgl'].includes(provider)) {
        throw new Error('Invalid provider. Must be "openai", "vllm", or "sgl"');
    }

    const response = await apiClient(`${API_BASE_URL}/api/config/llm/validate/${provider}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info(`LLM provider ${provider} validation completed:`, data);
    return data.validation;
};

const _validateLLMProviderWithFallback = async (provider) => {
    try {
        return await _validateLLMProvider(provider);
    } catch (error) {
        // Fallback to status-based validation if the endpoint is not available
        devLog.warn(`Validation endpoint failed, falling back to status check for ${provider}:`, error);

        try {
            const status = await getLLMStatus();
            const providerStatus = status.providers[provider];

            return {
                valid: providerStatus.configured && providerStatus.available,
                configured: providerStatus.configured,
                available: providerStatus.available,
                error: providerStatus.error || null,
                warnings: providerStatus.warnings || null,
            };
        } catch (statusError) {
            throw statusError;
        }
    }
};

export const validateLLMProvider = withErrorHandler(_validateLLMProviderWithFallback, 'Failed to validate LLM provider');

/**
 * 특정 LLM 제공자의 사용 가능한 모델 목록을 가져오는 함수
 * @param {string} provider - 모델을 조회할 제공자 ("openai", "vllm", 또는 "sgl")
 * @returns {Promise<Object>} 모델 목록
 */
const _getLLMModels = async (provider) => {
    if (!provider || !['openai', 'vllm', 'sgl'].includes(provider)) {
        throw new Error('Invalid provider. Must be "openai", "vllm", or "sgl"');
    }

    devLog.info(`Fetching models for ${provider}...`);

    const response = await apiClient(`${API_BASE_URL}/api/config/llm/models/${provider}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    devLog.info(`Models fetched for ${provider}:`, data);
    return data;
};

export const getLLMModels = withErrorHandler(_getLLMModels, 'Failed to fetch models for provider');

/**
 * 현재 활성화된 LLM 제공자 정보를 가져오는 함수
 * @returns {Promise<Object>} 현재 제공자 정보
 */
const _getCurrentLLMProvider = async () => {
    const status = await getLLMStatus();
    return {
        provider: status.current_provider,
        available: status.available_providers.includes(status.current_provider),
        providers_status: status.providers,
    };
};

export const getCurrentLLMProvider = withErrorHandler(_getCurrentLLMProvider, 'Failed to get current LLM provider');

/**
 * 사용 가능한 모든 LLM 제공자 목록을 가져오는 함수
 * @returns {Promise<Array>} 사용 가능한 제공자 목록
 */
const _getAvailableLLMProviders = async () => {
    const status = await getLLMStatus();
    return status.available_providers || [];
};

export const getAvailableLLMProviders = withErrorHandler(_getAvailableLLMProviders, 'Failed to get available LLM providers');

/**
 * LLM 제공자별 상세 정보를 가져오는 함수
 * @returns {Promise<Object>} 제공자별 상세 정보
 */
const _getLLMProvidersDetails = async () => {
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
            sgl: {
                name: 'SGL',
                displayName: 'SGLang',
                description: 'SGLang 고성능 추론 엔진 (self-hosted)',
                configured: status.providers.sgl.configured,
                available: status.providers.sgl.available,
                error: status.providers.sgl.error,
                warnings: status.providers.sgl.warnings,
                is_current: status.current_provider === 'sgl',
            },
        },
    };
};

export const getLLMProvidersDetails = withErrorHandler(_getLLMProvidersDetails, 'Failed to get LLM providers details');

/**
 * 여러 LLM 제공자의 연결을 동시에 테스트하는 함수
 * @param {Array<string>} providers - 테스트할 제공자 목록 (기본값: 모든 제공자)
 * @returns {Promise<Object>} 각 제공자별 테스트 결과
 */
const _testMultipleLLMConnections = async (providers = ['openai', 'vllm', 'sgl']) => {
    devLog.info('Testing multiple LLM connections:', providers);

    const testPromises = providers.map(async (provider) => {
        try {
            let result;
            switch (provider) {
                case 'openai':
                    result = await testOpenAIConnection();
                    break;
                case 'vllm':
                    result = await testVLLMConnection();
                    break;
                case 'sgl':
                    result = await testSGLConnection();
                    break;
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
            return { provider, success: true, result };
        } catch (error) {
            return { provider, success: false, error: error.message };
        }
    });

    const results = await Promise.allSettled(testPromises);

    const testResults = {};
    results.forEach((result, index) => {
        const provider = providers[index];
        if (result.status === 'fulfilled') {
            testResults[provider] = result.value;
        } else {
            testResults[provider] = {
                provider,
                success: false,
                error: result.reason?.message || 'Unknown error'
            };
        }
    });

    devLog.info('Multiple LLM connection tests completed:', testResults);
    return testResults;
};

export const testMultipleLLMConnections = withErrorHandler(_testMultipleLLMConnections, 'Failed to test multiple LLM connections');

/**
 * LLM 제공자의 건강 상태를 확인하는 함수
 * @param {string} provider - 확인할 제공자
 * @returns {Promise<Object>} 건강 상태 정보
 */
export const checkLLMProviderHealth = async (provider) => {
    try {
        const validation = await validateLLMProvider(provider);
        const status = await getLLMStatus();

        return {
            provider,
            healthy: validation.valid && status.providers[provider].available,
            configured: validation.configured,
            available: validation.available,
            is_current: status.current_provider === provider,
            error: validation.error,
            warnings: validation.warnings,
            last_checked: new Date().toISOString(),
        };
    } catch (error) {
        devLog.error(`Failed to check health for ${provider}:`, error);
        return {
            provider,
            healthy: false,
            error: error.message,
            last_checked: new Date().toISOString(),
        };
    }
};
