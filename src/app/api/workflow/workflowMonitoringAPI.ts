import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '../apiClient';

const _getWorkflowPerformance = async (workflowName: string, workflowId: string): Promise<any> => {
    const params = new URLSearchParams({ workflow_name: workflowName, workflow_id: workflowId });
    const response = await apiClient(`${API_BASE_URL}/api/workflow/performance?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const getWorkflowPerformance = withErrorHandler(_getWorkflowPerformance, 'Failed to get workflow performance');

const _getWorkflowNodeCounts = async (workflowName: string, workflowId: string): Promise<any> => {
    const response = await apiClient(`${API_BASE_URL}/api/performance/counts/${workflowName}/${workflowId}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const getWorkflowNodeCounts = withErrorHandler(_getWorkflowNodeCounts, 'Failed to get node log counts');

const _getChartData = async (chartType: 'pie' | 'bar' | 'line', workflowName: string, workflowId: string, limit: number): Promise<any> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    const response = await apiClient(`${API_BASE_URL}/api/performance/charts/${chartType}/${workflowName}/${workflowId}?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const getPieChartData = (workflowName: string, workflowId: string, limit: number) => 
    withErrorHandler(() => _getChartData('pie', workflowName, workflowId, limit), 'Failed to get pie chart data')();

export const getBarChartData = (workflowName: string, workflowId: string, limit: number) =>
    withErrorHandler(() => _getChartData('bar', workflowName, workflowId, limit), 'Failed to get bar chart data')();

export const getLineChartData = (workflowName: string, workflowId: string, limit: number) =>
    withErrorHandler(() => _getChartData('line', workflowName, workflowId, limit), 'Failed to get line chart data')();


const _getWorkflowIOLogs = async (workflowName: string, workflowId: string, interactionId: string = 'default'): Promise<any> => {
    const params = new URLSearchParams({ workflow_name: workflowName, workflow_id: workflowId, interaction_id: interactionId });
    const response = await apiClient(`${API_BASE_URL}/api/workflow/io_logs?${params.toString()}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const getWorkflowIOLogs = withErrorHandler(_getWorkflowIOLogs, 'Failed to get workflow IO logs');

const _deleteWorkflowIOLogs = async (workflowName: string, workflowId: string, interactionId: string = 'default'): Promise<any> => {
    const params = new URLSearchParams({ workflow_name: workflowName, workflow_id: workflowId, interaction_id: interactionId });
    const response = await apiClient(`${API_BASE_URL}/api/workflow/io_logs?${params.toString()}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
};
export const deleteWorkflowIOLogs = withErrorHandler(_deleteWorkflowIOLogs, 'Failed to delete workflow IO logs');
