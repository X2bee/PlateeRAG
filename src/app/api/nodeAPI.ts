import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// It would be good to have a central place for these types, e.g., src/types/node.ts
export interface NodeCategory {
    categoryId: string;
    categoryName: string;
    icon: string;
    functions?: any[]; // Define more specific type if possible
}

const _getNodes = async (): Promise<NodeCategory[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/node/get`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};
export const getNodes = withErrorHandler(_getNodes, 'Failed to get nodes');

const _exportNodes = async (): Promise<NodeCategory[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/node/export`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    // After exporting, fetch the updated list
    return getNodes();
};
export const exportNodes = withErrorHandler(_exportNodes, 'Failed to export nodes');

const _refreshNodes = async (): Promise<NodeCategory[]> => {
    const refreshResponse = await apiClient(`${API_BASE_URL}/api/node/refresh`);
    if (!refreshResponse.ok) {
        const errorData = await refreshResponse.json();
        throw new Error(errorData.detail || `Refresh failed! status: ${refreshResponse.status}`);
    }
    // After refreshing, fetch the updated list
    return getNodes();
};
export const refreshNodes = withErrorHandler(_refreshNodes, 'Failed to refresh nodes');
