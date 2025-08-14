import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '../apiClient';
import type { WorkflowData } from '@/app/canvas/types';

const _saveWorkflow = async (workflowName: string, workflowContent: WorkflowData): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/workflow/save`, {
        method: 'POST',
        body: JSON.stringify({ workflow_name: workflowName, content: workflowContent }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const saveWorkflow = withErrorHandler(_saveWorkflow, 'Failed to save workflow');

const _listWorkflows = async (): Promise<string[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/workflow/list`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.workflows || [];
};
export const listWorkflows = withErrorHandler(_listWorkflows, 'Failed to list workflows');

const _listWorkflowsDetail = async (): Promise<WorkflowData[]> => {
    const response = await apiClient(`${API_BASE_URL}/api/workflow/list/detail`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.workflows || [];
};
export const listWorkflowsDetail = withErrorHandler(_listWorkflowsDetail, 'Failed to list workflow details');

const _loadWorkflow = async (workflowId: string): Promise<WorkflowData> => {
    const cleanWorkflowId = workflowId.endsWith('.json') ? workflowId.slice(0, -5) : workflowId;
    const response = await apiClient(`${API_BASE_URL}/api/workflow/load/${encodeURIComponent(cleanWorkflowId)}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const loadWorkflow = withErrorHandler(_loadWorkflow, 'Failed to load workflow');

const _deleteWorkflow = async (workflowId: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/workflow/delete/${encodeURIComponent(workflowId)}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const deleteWorkflow = withErrorHandler(_deleteWorkflow, 'Failed to delete workflow');
