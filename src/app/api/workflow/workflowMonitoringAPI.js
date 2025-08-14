// Workflow Monitoring API - Performance monitoring and analytics
import { devLog } from '@/app/_common/utils/logger';
import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '../apiClient';

/**
 * 워크플로우의 성능 데이터를 조회합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 성능 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _getWorkflowPerformance = async (workflowName, workflowId) => {
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
    });

    const response = await apiClient(
        `${API_BASE_URL}/api/workflow/performance?${params}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    devLog.log('Workflow performance data retrieved successfully:', result);
    return result;
};

export const getWorkflowPerformance = withErrorHandler(_getWorkflowPerformance, 'Failed to get workflow performance');

/**
 * 워크플로우 내 각 노드별 로그 개수를 조회합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 노드별 로그 개수 데이터
 */
const _getWorkflowNodeCounts = async (workflowName, workflowId) => {
    const response = await apiClient(`${API_BASE_URL}/api/performance/counts/${workflowName}/${workflowId}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
};

export const getWorkflowNodeCounts = withErrorHandler(_getWorkflowNodeCounts, 'Failed to get node log counts');

/**
 * 파이 차트 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {number} limit - 분석할 최근 로그 개수
 * @returns {Promise<Object>} 파이 차트 데이터
 */
const _getPieChartData = async (workflowName, workflowId, limit) => {
    const params = new URLSearchParams({ limit });
    const response = await apiClient(`${API_BASE_URL}/api/performance/charts/pie/${workflowName}/${workflowId}?${params}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
};

export const getPieChartData = withErrorHandler(_getPieChartData, 'Failed to get pie chart data');

/**
 * 바 차트 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {number} limit - 분석할 최근 로그 개수
 * @returns {Promise<Object>} 바 차트 데이터
 */
const _getBarChartData = async (workflowName, workflowId, limit) => {
    const params = new URLSearchParams({ limit });
    const response = await apiClient(`${API_BASE_URL}/api/performance/charts/bar/${workflowName}/${workflowId}?${params}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
};

export const getBarChartData = withErrorHandler(_getBarChartData, 'Failed to get bar chart data');

/**
 * 라인 차트 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {number} limit - 분석할 최근 로그 개수
 * @returns {Promise<Object>} 라인 차트 데이터
 */
const _getLineChartData = async (workflowName, workflowId, limit) => {
    const params = new URLSearchParams({ limit });
    const response = await apiClient(`${API_BASE_URL}/api/performance/charts/line/${workflowName}/${workflowId}?${params}`);
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
};

export const getLineChartData = withErrorHandler(_getLineChartData, 'Failed to get line chart data');

/**
 * 특정 워크플로우의 실행 기록 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} interactionId - 상호작용 ID (선택사항, 기본값: "default")
 * @returns {Promise<Object>} 실행 기록 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _getWorkflowIOLogs = async (workflowName, workflowId, interactionId = 'default') => {
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
        interaction_id: interactionId,
    });

    const response = await apiClient(
        `${API_BASE_URL}/api/workflow/io_logs?${params}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    devLog.log('Workflow IO logs retrieved successfully:', result);
    return result;
};

export const getWorkflowIOLogs = withErrorHandler(_getWorkflowIOLogs, 'Failed to get workflow IO logs');

/**
 * 특정 워크플로우의 실행 기록 데이터를 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} interactionId - 상호작용 ID (기본값: "default")
 * @returns {Promise<Object>} 삭제 결과 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _deleteWorkflowIOLogs = async (workflowName, workflowId, interactionId = 'default') => {
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
        interaction_id: interactionId,
    });

    const response = await apiClient(
        `${API_BASE_URL}/api/workflow/io_logs?${params}`,
        {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    devLog.log('Workflow IO logs deleted successfully:', result);
    return result;
};

export const deleteWorkflowIOLogs = withErrorHandler(_deleteWorkflowIOLogs, 'Failed to delete workflow IO logs');

/**
 * 워크플로우의 성능 데이터를 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _deleteWorkflowPerformance = async (workflowName, workflowId) => {
    const params = new URLSearchParams({
        workflow_name: workflowName,
        workflow_id: workflowId,
    });

    const response = await apiClient(
        `${API_BASE_URL}/api/workflow/performance?${params}`,
        {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    devLog.log('Workflow performance data deleted successfully:', result);
    return result;
};

export const deleteWorkflowPerformance = withErrorHandler(_deleteWorkflowPerformance, 'Failed to delete workflow performance data');

/**
 * 모든 차트 데이터를 한 번에 가져오는 유틸리티 함수
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {number} limit - 분석할 최근 로그 개수
 * @returns {Promise<Object>} 모든 차트 데이터를 포함하는 객체
 */
const _getAllChartData = async (workflowName, workflowId, limit) => {
    const [pieData, barData, lineData, nodeCounts] = await Promise.all([
        getPieChartData(workflowName, workflowId, limit),
        getBarChartData(workflowName, workflowId, limit),
        getLineChartData(workflowName, workflowId, limit),
        getWorkflowNodeCounts(workflowName, workflowId)
    ]);

    return {
        pie: pieData,
        bar: barData,
        line: lineData,
        nodeCounts: nodeCounts
    };
};

export const getAllChartData = withErrorHandler(_getAllChartData, 'Failed to get all chart data');