import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// It would be good to have a central place for these types, e.g., src/types/vast.ts
export interface VastSearchParams {
    gpu_name?: string;
    max_price?: number;
    min_gpu_ram?: number;
    num_gpus?: number;
    rentable?: boolean;
    sort_by?: 'price' | 'gpu_ram' | 'num_gpus';
    limit?: number;
}

export interface VllmConfig {
    api_base_url: string;
    model_name: string;
}

const _checkVastHealth = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/vast/health`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const checkVastHealth = withErrorHandler(_checkVastHealth, 'Failed to check vast health');

const _searchVastOffers = async (searchParams: VastSearchParams = {}): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/vast/search-offers`, {
        method: 'POST',
        body: JSON.stringify(searchParams),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const searchVastOffers = withErrorHandler(_searchVastOffers, 'Failed to search vast offers');

const _createVastInstance = async (options: object = {}): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/vast/instances`, {
        method: 'POST',
        body: JSON.stringify(options),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const createVastInstance = withErrorHandler(_createVastInstance, 'Failed to create vast instance');

const _listVastInstances = async (): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/vast/instances`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const listVastInstances = withErrorHandler(_listVastInstances, 'Failed to list vast instances');

const _destroyVastInstance = async (instanceId: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/vast/instances/${instanceId}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const destroyVastInstance = withErrorHandler(_destroyVastInstance, 'Failed to destroy vast instance');

const _updateVllmConnectionConfig = async (vllmConfig: VllmConfig): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/vast/set-vllm`, {
        method: 'PUT',
        body: JSON.stringify(vllmConfig),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const updateVllmConnectionConfig = withErrorHandler(_updateVllmConnectionConfig, 'Failed to update VLLM config');
