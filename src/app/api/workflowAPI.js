import { devLog } from '@/app/utils/logger';
import { API_BASE_URL } from '@/app/config.js';

/**
 * 주어진 워크플로우 데이터를 백엔드로 전송하여 실행합니다.
 * @param {Object} workflowData - 노드와 엣지 정보를 포함하는 워크플로우 객체.
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스.
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const executeWorkflow = async (workflowData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflowData),
        });

        const result = await response.json();

        if (!response.ok) {
            // FastAPI에서 HTTPException으로 반환된 detail 메시지를 사용
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        return result;
    } catch (error) {
        devLog.error('Failed to execute workflow:', error);
        // UI에서 에러 메시지를 표시할 수 있도록 에러를 다시 던집니다.
        throw error;
    }
};

/**
 * 워크플로우 데이터를 백엔드 서버에 저장합니다.
 * @param {string} workflowId - 워크플로우 식별자 (파일명으로 사용됨)
 * @param {Object} workflowContent - 저장할 워크플로우 데이터 (노드, 엣지, 뷰 정보 포함)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const saveWorkflow = async (workflowId, workflowContent) => {
    try {
        devLog.log('SaveWorkflow called with:');
        devLog.log('- workflowId (name):', workflowId);
        devLog.log('- workflowContent.id:', workflowContent.id);
        devLog.log(
            '- Full workflowContent keys:',
            Object.keys(workflowContent),
        );

        const response = await fetch(`${API_BASE_URL}/workflow/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                workflow_id: workflowId,
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
    } catch (error) {
        devLog.error('Failed to save workflow:', error);
        throw error;
    }
};

/**
 * 백엔드에서 저장된 워크플로우 목록을 가져옵니다.
 * @returns {Promise<Array<string>>} 워크플로우 파일명 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listWorkflows = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/list`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.workflows || [];
    } catch (error) {
        devLog.error('Failed to list workflows:', error);
        throw error;
    }
};

/**
 * 백엔드에서 저장된 워크플로우들의 상세 정보를 가져옵니다.
 * @returns {Promise<Array<Object>>} 워크플로우 상세 정보 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listWorkflowsDetail = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/list/detail`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.workflows || [];
    } catch (error) {
        devLog.error('Failed to list workflow details:', error);
        throw error;
    }
};

/**
 * 백엔드에서 특정 워크플로우를 로드합니다.
 * @param {string} workflowId - 로드할 워크플로우 ID (.json 확장자 포함/제외 모두 가능)
 * @returns {Promise<Object>} 워크플로우 데이터 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const loadWorkflow = async (workflowId) => {
    try {
        // .json 확장자가 포함되어 있으면 제거
        const cleanWorkflowId = workflowId.endsWith('.json')
            ? workflowId.slice(0, -5)
            : workflowId;

        const response = await fetch(
            `${API_BASE_URL}/workflow/load/${encodeURIComponent(cleanWorkflowId)}`,
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const workflowData = await response.json();
        return workflowData;
    } catch (error) {
        devLog.error('Failed to load workflow:', error);
        throw error;
    }
};

/**
 * 백엔드에서 특정 워크플로우를 삭제합니다.
 * @param {string} workflowId - 삭제할 워크플로우 ID (.json 확장자 제외)
 * @returns {Promise<Object>} 삭제 결과 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflow = async (workflowId) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/workflow/delete/${encodeURIComponent(workflowId)}`,
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
        return result;
    } catch (error) {
        devLog.error('Failed to delete workflow:', error);
        throw error;
    }
};

/**
 * 워크플로우 목록과 세부 정보를 가져옵니다.
 * @returns {Promise<Object>} 워크플로우 목록을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowList = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/workflow/list/detail`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Workflow list retrieved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get workflow list:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 성능 모니터링 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 성능 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowPerformance = async (workflowName, workflowId) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
        });

        const response = await fetch(
            `${API_BASE_URL}/workflow/performance?${params}`,
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
    } catch (error) {
        devLog.error('Failed to get workflow performance:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 실행 기록 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} interactionId - 상호작용 ID (선택사항, 기본값: "default")
 * @returns {Promise<Object>} 실행 기록 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowIOLogs = async (workflowName, workflowId, interactionId = 'default') => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
            interaction_id: interactionId,
        });

        const response = await fetch(
            `${API_BASE_URL}/workflow/io_logs?${params}`,
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
    } catch (error) {
        devLog.error('Failed to get workflow IO logs:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 실행 기록 데이터를 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} interactionId - 상호작용 ID (기본값: "default")
 * @returns {Promise<Object>} 삭제 결과 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowIOLogs = async (workflowName, workflowId, interactionId = 'default') => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
            interaction_id: interactionId,
        });

        const response = await fetch(
            `${API_BASE_URL}/workflow/io_logs?${params}`,
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
    } catch (error) {
        devLog.error('Failed to delete workflow IO logs:', error);
        throw error;
    }
};

/**
 * 워크플로우 이름과 ID를 기반으로 워크플로우를 실행합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} inputData - 실행에 사용할 입력 데이터 (선택사항)
 * @returns {Promise<Object>} 실행 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const executeWorkflowById = async (
    workflowName,
    workflowId,
    inputData = '',
) => {
    try {
        const body = {
            workflow_name: workflowName,
            workflow_id: workflowId,
            input_data: inputData || '',
        };
        devLog.log('ExecuteWorkflowById called with:');
        devLog.log('- workflowName:', workflowName);
        devLog.log('- workflowId:', workflowId);
        devLog.log('- inputData:', inputData);
        const response = await fetch(
            `${API_BASE_URL}/workflow/execute/based_id`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Workflow executed successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to execute workflow:', error);
        throw error;
    }
};

/**
 * 워크플로우의 성능 데이터를 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowPerformance = async (workflowName, workflowId) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
        });

        const response = await fetch(
            `${API_BASE_URL}/workflow/performance?${params}`,
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
    } catch (error) {
        devLog.error('Failed to delete workflow performance data:', error);
        throw error;
    }
};
