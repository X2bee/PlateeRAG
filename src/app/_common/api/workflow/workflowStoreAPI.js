import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';
import { validateWorkflowName } from '@/app/_common/utils/workflowStorage';

/**
 * 워크플로우 스토어의 워크플로우 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>} 워크플로우 목록을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listWorkflowStore = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/store/list`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow store list response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow store list error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully retrieved workflow store list:', {
            count: result.workflows?.length || 0
        });
        return result.workflows || [];
    } catch (error) {
        devLog.error('Failed to list workflow store:', error);
        throw error;
    }
};

/**
 * 워크플로우를 스토어에 업로드합니다.
 * @param {string} workflowName - 업로드할 워크플로우 이름
 * @param {string} workflowUploadName - 업로드될 워크플로우 이름
 * @param {string} description - 워크플로우 설명
 * @param {Array<string>} tags - 워크플로우 태그 배열
 * @returns {Promise<Object>} 업로드 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const uploadWorkflowToStore = async (workflowName, workflowUploadName, description, tags) => {
    try {
        const params = new URLSearchParams({
            workflow_upload_name: workflowUploadName,
            description: description || '',
            tags: JSON.stringify(tags || [])
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/store/upload/${encodeURIComponent(workflowName)}?${params}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow upload response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow upload error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully uploaded workflow to store:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to upload workflow to store:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Upload name that failed:', workflowUploadName);
        throw error;
    }
};

/**
 * 워크플로우 스토어에서 워크플로우를 삭제합니다.
 * @param {string} workflowName - 삭제할 워크플로우 이름
 * @param {string} workflowUploadName - 업로드된 워크플로우 이름
 * @param {number} currentVersion - 현재 버전
 * @returns {Promise<Object>} 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowFromStore = async (workflowName, workflowUploadName, currentVersion) => {
    try {
        const params = new URLSearchParams({
            workflow_upload_name: workflowUploadName,
            current_version: currentVersion
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/store/delete/${encodeURIComponent(workflowName)}?${params}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow delete response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow delete error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully deleted workflow from store:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to delete workflow from store:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Upload name that failed:', workflowUploadName);
        throw error;
    }
};

/**
 * 워크플로우 스토어에서 워크플로우를 복제합니다.
 * @param {string} workflowName - 복제할 워크플로우 이름
 * @param {string} workflowUploadName - 업로드된 워크플로우 이름
 * @param {number} userId - 원본 워크플로우의 사용자 ID
 * @param {number} currentVersion - 현재 버전
 * @returns {Promise<Object>} 복제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const duplicateWorkflowFromStore = async (workflowName, workflowUploadName, userId, currentVersion) => {
    try {
        const params = new URLSearchParams({
            workflow_upload_name: workflowUploadName,
            current_version: currentVersion
        });

        // userId가 있는 경우에만 파라미터에 추가
        if (userId !== null && userId !== undefined) {
            params.append('user_id', userId);
        }

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/store/duplicate/${encodeURIComponent(workflowName)}?${params}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow duplicate response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow duplicate error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully duplicated workflow from store:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to duplicate workflow from store:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Upload name that failed:', workflowUploadName);
        throw error;
    }
};
