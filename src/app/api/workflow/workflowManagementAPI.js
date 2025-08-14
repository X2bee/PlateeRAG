// Workflow Management API - CRUD operations for workflows
import { devLog } from '@/app/_common/utils/logger';
import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '../apiClient';

/**
 * 워크플로우 데이터를 백엔드 서버에 저장합니다.
 * @param {string} workflowName - 워크플로우 식별자 (파일명으로 사용됨)
 * @param {Object} workflowContent - 저장할 워크플로우 데이터 (노드, 엣지, 뷰 정보 포함)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _saveWorkflow = async (workflowName, workflowContent) => {
    devLog.log('SaveWorkflow called with:');
    devLog.log('- workflowName (name):', workflowName);
    devLog.log('- workflowContent.id:', workflowContent.id);
    devLog.log(
        '- Full workflowContent keys:',
        Object.keys(workflowContent),
    );

    // apiClient가 자동으로 Authorization header와 X-User-ID header를 추가합니다
    const response = await apiClient(`${API_BASE_URL}/api/workflow/save`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            workflow_name: workflowName,
            content: workflowContent,
        }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.detail || `HTTP error! status: ${response.status}`,
        );
    }

    return result;
};

export const saveWorkflow = withErrorHandler(_saveWorkflow, 'Failed to save workflow');

/**
 * 백엔드에서 저장된 워크플로우 목록을 가져옵니다.
 * @returns {Promise<Array<string>>} 워크플로우 파일명 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _listWorkflows = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/workflow/list`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    return result.workflows || [];
};

export const listWorkflows = withErrorHandler(_listWorkflows, 'Failed to list workflows');

/**
 * 백엔드에서 저장된 워크플로우들의 상세 정보를 가져옵니다.
 * @returns {Promise<Array<Object>>} 워크플로우 상세 정보 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _listWorkflowsDetail = async () => {
    // apiClient가 자동으로 Authorization header와 X-User-ID header를 추가합니다
    const response = await apiClient(`${API_BASE_URL}/api/workflow/list/detail`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    return result.workflows || [];
};

export const listWorkflowsDetail = withErrorHandler(_listWorkflowsDetail, 'Failed to list workflow details');

/**
 * 백엔드에서 특정 워크플로우를 로드합니다.
 * @param {string} workflowId - 로드할 워크플로우 ID (.json 확장자 포함/제외 모두 가능)
 * @param {boolean} isDeploy - 배포된 워크플로우를 로드할지 여부 (기본값: false)
 * @param {number|string|null} user_id - 사용자 ID (배포용)
 * @returns {Promise<Object>} 워크플로우 데이터 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _loadWorkflow = async (workflowId, isDeploy = false, user_id = null) => {
    // .json 확장자가 포함되어 있으면 제거
    const cleanWorkflowId = workflowId.endsWith('.json')
        ? workflowId.slice(0, -5)
        : workflowId;

    devLog.log('Loading workflow with cleaned ID:', cleanWorkflowId);

    let url;
    if (isDeploy && user_id) {
        url = `${API_BASE_URL}/api/workflow/deploy/load/${user_id}/${encodeURIComponent(cleanWorkflowId)}`;
    } else {
        url = `${API_BASE_URL}/api/workflow/load/${encodeURIComponent(cleanWorkflowId)}`;
    }

    const response = await apiClient(url);

    devLog.log('Workflow load response status:', response.status);

    if (!response.ok) {
        const errorData = await response.json();
        devLog.error('Workflow load error data:', errorData);
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const workflowData = await response.json();
    devLog.log('Successfully loaded workflow data:', workflowData);
    return workflowData;
};

export const loadWorkflow = withErrorHandler(_loadWorkflow, 'Failed to load workflow');

/**
 * 백엔드에서 특정 워크플로우를 삭제합니다.
 * @param {string} workflowId - 삭제할 워크플로우 ID
 * @returns {Promise<Object>} 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _deleteWorkflow = async (workflowId) => {
    const response = await apiClient(
        `${API_BASE_URL}/api/workflow/delete/${encodeURIComponent(workflowId)}`,
        {
            method: 'DELETE',
        },
    );

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    devLog.log('Workflow deleted successfully:', result);
    return result;
};

export const deleteWorkflow = withErrorHandler(_deleteWorkflow, 'Failed to delete workflow');

/**
 * 백엔드에서 워크플로우 목록을 가져옵니다. (legacy method)
 * @returns {Promise<Array<string>>} 워크플로우 파일명 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _getWorkflowList = async () => {
    const response = await apiClient(`${API_BASE_URL}/api/workflow/list`);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            errorData.detail || `HTTP error! status: ${response.status}`,
        );
    }

    const result = await response.json();
    devLog.log('Workflow list retrieved:', result);
    
    // workflows 키가 있으면 그 값을 반환하고, 없으면 빈 배열 반환
    return result.workflows || [];
};

export const getWorkflowList = withErrorHandler(_getWorkflowList, 'Failed to get workflow list');