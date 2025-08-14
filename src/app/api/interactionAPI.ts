import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from './apiClient';

// Define interfaces for the data structures
export interface InteractionFilters {
    interaction_id?: string;
    workflow_id?: string;
    limit?: number;
}

export interface ExecutionMeta {
    // Define the structure of your execution meta data here
    [key: string]: any;
}

const _listInteractions = async (filters: InteractionFilters = {}): Promise<ExecutionMeta[]> => {
    const { interaction_id, workflow_id, limit = 100 } = filters;

    const params = new URLSearchParams();
    if (interaction_id) params.append('interaction_id', interaction_id);
    if (workflow_id) params.append('workflow_id', workflow_id);
    params.append('limit', limit.toString());

    const response = await apiClient(`${API_BASE_URL}/api/interaction/list?${params.toString()}`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return response.json();
};
export const listInteractions = withErrorHandler(_listInteractions, 'Failed to list interactions');

const _getWorkflowInteractions = async (workflow_id: string, limit: number = 100): Promise<ExecutionMeta[]> => {
    if (!workflow_id) {
        throw new Error('workflow_id는 필수 파라미터입니다.');
    }
    return listInteractions({ workflow_id, limit });
};
export const getWorkflowInteractions = withErrorHandler(_getWorkflowInteractions, 'Failed to get workflow interactions');

const _getInteractionById = async (interaction_id: string): Promise<ExecutionMeta[]> => {
    if (!interaction_id) {
        throw new Error('interaction_id는 필수 파라미터입니다.');
    }
    return listInteractions({ interaction_id, limit: 1 });
};
export const getInteractionById = withErrorHandler(_getInteractionById, 'Failed to get interaction by ID');

export const generateInteractionId = (prefix: string = 'chat'): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
};

export const normalizeWorkflowName = (workflowName: string): string => {
    return workflowName.replace(/\.json$/, '');
};
