// Workflow 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/helper/apiClient';

/**
 * 모든 IO 로그를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수 (기본값: 250)
 * @param {number|null} userId - 특정 사용자 ID (선택사항, null이면 전체 조회)
 * @returns {Promise<Object>} IO 로그 목록과 페이지네이션 정보가 포함된 객체
 */
export const getAllIOLogs = async (page = 1, pageSize = 250, userId = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/workflow/all-io-logs?page=${page}&page_size=${pageSize}`;

        // user_id가 제공된 경우에만 쿼리 파라미터에 추가
        if (userId !== null && userId !== undefined) {
            url += `&user_id=${userId}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get all IO logs:', data);
            throw new Error(data.detail || 'Failed to get all IO logs');
        }

        devLog.log('Get all IO logs result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get all IO logs:', error);
        throw error;
    }
};

/**
 * 모든 워크플로우 정보를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수 (기본값: 250)
 * @param {number|null} userId - 특정 사용자 ID (선택사항, null이면 전체 조회)
 * @returns {Promise<Object>} 워크플로우 목록과 페이지네이션 정보가 포함된 객체
 */
export const getAllWorkflowMeta = async (page = 1, pageSize = 250, userId = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/workflow/all-list?page=${page}&page_size=${pageSize}`;

        if (userId !== null && userId !== undefined) {
            url += `&user_id=${userId}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get all workflow meta:', data);
            throw new Error(data.detail || 'Failed to get all workflow meta');
        }

        devLog.log('Get all workflow meta result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get all workflow meta:', error);
        throw error;
    }
};

/**
 * 관리자용 ExecutionIO 로그를 조건별로 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number|null} userId - 사용자 ID (선택사항)
 * @param {string|null} workflowName - 워크플로우 이름 (선택사항)
 * @param {string|null} workflowId - 워크플로우 ID (선택사항)
 * @returns {Promise<Object>} IO 로그 목록이 포함된 객체
 */
export const getIOLogsAdmin = async (userId = null, workflowName = null, workflowId = null) => {
    try {
        let url = `${API_BASE_URL}/api/admin/workflow/admin-io-logs`;
        const queryParams = [];

        if (userId !== null && userId !== undefined) {
            queryParams.push(`user_id=${userId}`);
        }
        if (workflowName !== null && workflowName !== undefined) {
            queryParams.push(`workflow_name=${encodeURIComponent(workflowName)}`);
        }
        if (workflowId !== null && workflowId !== undefined) {
            queryParams.push(`workflow_id=${encodeURIComponent(workflowId)}`);
        }

        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        }

        const response = await apiClient(url);
        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to get IO logs by condition:', data);
            throw new Error(data.detail || 'Failed to get IO logs by condition');
        }

        devLog.log('Get IO logs by condition result:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to get IO logs by condition:', error);
        throw error;
    }
};
