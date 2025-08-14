import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// You might want to create a central types/embedding.ts file for these interfaces
export interface ProviderStatus {
    [key: string]: {
        available: boolean;
        configured: boolean;
        error?: string | null;
    };
}

export interface EmbeddingStatus {
    current_provider: string;
    available_providers: string[];
    providers: ProviderStatus;
}

const _getEmbeddingProviders = async (): Promise<string[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/providers`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const getEmbeddingProviders = withErrorHandler(_getEmbeddingProviders, 'Failed to fetch embedding providers');

const _testEmbeddingProviders = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/test`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const testEmbeddingProviders = withErrorHandler(_testEmbeddingProviders, 'Failed to test embedding providers');

const _getEmbeddingStatus = async (): Promise<EmbeddingStatus> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/status`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const getEmbeddingStatus = withErrorHandler(_getEmbeddingStatus, 'Failed to fetch embedding status');

const _testEmbeddingQuery = async (queryText: string = "Hello, world!"): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/test-query`, {
        method: 'POST',
        body: JSON.stringify({ query_text: queryText }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const testEmbeddingQuery = withErrorHandler(_testEmbeddingQuery, 'Failed to test embedding query');

const _reloadEmbeddingClient = async (): Promise<{ message: string }> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/reload`, { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const reloadEmbeddingClient = withErrorHandler(_reloadEmbeddingClient, 'Failed to reload embedding client');

const _switchEmbeddingProvider = async (newProvider: string): Promise<{ message: string }> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/switch-provider`, {
        method: 'POST',
        body: JSON.stringify({ new_provider: newProvider }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const switchEmbeddingProvider = withErrorHandler(_switchEmbeddingProvider, 'Failed to switch embedding provider');

const _autoSwitchEmbeddingProvider = async (): Promise<{ new_provider: string }> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/auto-switch`, { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const autoSwitchEmbeddingProvider = withErrorHandler(_autoSwitchEmbeddingProvider, 'Failed to auto-switch embedding provider');

const _getEmbeddingConfigStatus = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/embedding/config-status`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const getEmbeddingConfigStatus = withErrorHandler(_getEmbeddingConfigStatus, 'Failed to fetch embedding config status');

const _getEmbeddingDebugInfo = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/debug/info`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const getEmbeddingDebugInfo = withErrorHandler(_getEmbeddingDebugInfo, 'Failed to fetch embedding debug info');
