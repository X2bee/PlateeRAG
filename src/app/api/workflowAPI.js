import { devLog } from '@/app/utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * 주어진 워크플로우 데이터를 백엔드로 전송하여 실행합니다.
 * @param {Object} workflowData - 노드와 엣지 정보를 포함하는 워크플로우 객체.
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스.
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const executeWorkflow = async (workflowData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/node/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(workflowData),
        });

        const result = await response.json();

        if (!response.ok) {
            // FastAPI에서 HTTPException으로 반환된 detail 메시지를 사용
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        devLog.error("Failed to execute workflow:", error);
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
        devLog.log('- Full workflowContent keys:', Object.keys(workflowContent));
        
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
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        devLog.error("Failed to save workflow:", error);
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
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result.workflows || [];
    } catch (error) {
        devLog.error("Failed to list workflows:", error);
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
            
        const response = await fetch(`${API_BASE_URL}/workflow/load/${encodeURIComponent(cleanWorkflowId)}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const workflowData = await response.json();
        return workflowData;
    } catch (error) {
        devLog.error("Failed to load workflow:", error);
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
        const response = await fetch(`${API_BASE_URL}/workflow/delete/${encodeURIComponent(workflowId)}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        devLog.error("Failed to delete workflow:", error);
        throw error;
    }
};
