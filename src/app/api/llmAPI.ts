import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// Define interfaces for the data structures
export interface LLMProviderStatus {
    configured: boolean;
    available: boolean;
    error?: string | null;
    warnings?: string[];
}

export interface LLMStatusResponse {
    current_provider: string;
    available_providers: string[];
    providers: {
        [providerName: string]: LLMProviderStatus;
    };
}

const _getLLMStatus = async (): Promise<LLMStatusResponse> => {
    const response = await apiClient(`${API_BASE_URL}/api/config/llm/status`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const getLLMStatus = withErrorHandler(_getLLMStatus, 'Failed to fetch LLM status');

const _switchLLMProvider = async (provider: 'openai' | 'vllm' | 'sgl'): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/config/llm/switch-provider`, {
        method: 'POST',
        body: JSON.stringify({ provider }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const switchLLMProvider = withErrorHandler(_switchLLMProvider, 'Failed to switch LLM provider');

const _autoSwitchLLMProvider = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/config/llm/auto-switch`, { method: 'POST' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const autoSwitchLLMProvider = withErrorHandler(_autoSwitchLLMProvider, 'Failed to auto-switch LLM provider');

const _testLLMConnection = async (provider: 'llm' | 'openai' | 'vllm' | 'sgl', collection: boolean = false): Promise<any> => {
    let url = `${API_BASE_URL}/api/config/test/`;
    if (collection) {
        url += `collection/${provider}`;
    } else {
        url += provider;
    }
    const response = await apiClient(url, { method: 'POST' });
    const data = await response.json();
    if (!response.ok || data.status !== 'success') {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
};
export const testLLMConnection = withErrorHandler(_testLLMConnection, 'Failed to test LLM connection');

const _getLLMModels = async (provider: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/config/llm/models/${provider}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const getLLMModels = withErrorHandler(_getLLMModels, 'Failed to fetch models for provider');
