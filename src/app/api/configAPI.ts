import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// It would be good to have a central place for these types, e.g., src/types/config.ts
export interface ConfigValue {
    value: any;
    description?: string;
    type?: string;
    required?: boolean;
}

export interface ConfigCollection {
    [key: string]: ConfigValue;
}

const _fetchAllConfigs = async (): Promise<ConfigCollection> => {
    const response = await apiClient(`${API_BASE_URL}/app/config/persistent`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const fetchAllConfigs = withErrorHandler(_fetchAllConfigs, 'Failed to fetch all configs');

const _updateConfig = async (configName: string, value: any): Promise<ConfigValue> => {
    const response = await apiClient(
        `${API_BASE_URL}/app/config/persistent/${configName}`,
        {
            method: 'PUT',
            body: JSON.stringify({ value }),
        },
    );
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const updateConfig = withErrorHandler(_updateConfig, 'Failed to update config');

const _refreshConfigs = async (): Promise<{ message: string }> => {
    const response = await apiClient(
        `${API_BASE_URL}/app/config/persistent/refresh`,
        { method: 'POST' },
    );
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const refreshConfigs = withErrorHandler(_refreshConfigs, 'Failed to refresh configs');

const _fetchConfigsByCategory = async (category: string): Promise<ConfigCollection> => {
    const allConfigs = await fetchAllConfigs();
    const filteredConfigs: ConfigCollection = {};
    const categoryPrefix = category.toLowerCase();

    for (const [key, config] of Object.entries(allConfigs)) {
        if (key.toLowerCase().includes(categoryPrefix)) {
            filteredConfigs[key] = config;
        }
    }
    return filteredConfigs;
};
export const fetchConfigsByCategory = withErrorHandler(_fetchConfigsByCategory, 'Failed to fetch configs by category');

const _saveConfigs = async (): Promise<{ message: string }> => {
    const response = await apiClient(
        `${API_BASE_URL}/app/config/persistent/save`,
        { method: 'POST' },
    );
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const saveConfigs = withErrorHandler(_saveConfigs, 'Failed to save configs');

const _fetchAppConfig = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/app/config`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const fetchAppConfig = withErrorHandler(_fetchAppConfig, 'Failed to fetch app config');
