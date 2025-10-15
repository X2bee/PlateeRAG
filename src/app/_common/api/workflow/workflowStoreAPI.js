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
 * @param {boolean} isTemplate - 템플릿 워크플로우 여부 (관리자 전용)
 * @returns {Promise<Object>} 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowFromStore = async (workflowName, workflowUploadName, currentVersion, isTemplate = false) => {
    try {
        const params = new URLSearchParams({
            workflow_upload_name: workflowUploadName,
            current_version: currentVersion
        });

        // 템플릿인 경우에만 is_template 파라미터 추가
        if (isTemplate) {
            params.append('is_template', 'true');
        }

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/store/delete/${encodeURIComponent(workflowName)}?${params}`,
            {
                method: 'DELETE',
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

/**
 * 워크플로우에 평점을 부여합니다.
 * @param {string} workflowName - 평가할 워크플로우 이름
 * @param {string} workflowUploadName - 업로드된 워크플로우 이름
 * @param {number} userId - 원본 워크플로우의 사용자 ID
 * @param {boolean} isTemplate - 템플릿 워크플로우 여부
 * @param {number} currentVersion - 현재 버전
 * @param {number} rating - 평점 (1-5)
 * @returns {Promise<Object>} 평가 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const rateWorkflow = async (workflowName, workflowUploadName, userId, isTemplate, currentVersion, rating) => {
    try {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const params = new URLSearchParams({
            workflow_upload_name: workflowUploadName,
            user_id: userId,
            is_template: isTemplate,
            current_version: currentVersion,
            rating: rating
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/store/rating/${encodeURIComponent(workflowName)}?${params}`,
            {
                method: 'POST',
            }
        );

        devLog.log('Workflow rating response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow rating error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully rated workflow:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to rate workflow:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Rating that failed:', rating);
        throw error;
    }
};
