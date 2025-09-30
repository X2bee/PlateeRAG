// Workflow 관리 API 호출 함수들을 관리하는 파일 (Manager용)
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 모든 워크플로우 IO 로그를 페이지네이션과 함께 가져오는 함수
 * @param {number} page - 페이지 번호 (기본값: 1)
 * @param {number} pageSize - 페이지 크기 (기본값: 250)
 * @param {number|null} userId - 필터링할 사용자 ID (선택사항)
 * @returns {Promise<Object>} IO 로그 목록 및 페이지네이션 정보
 */
export const getAllIOLogs = async (page = 1, pageSize = 250, userId = null) => {
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString()
        });

        if (userId) {
            params.append('user_id', userId.toString());
        }

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/all-io-logs?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        devLog.log('Get all IO logs result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all IO logs:', data);
            throw new Error(data.detail || 'Failed to get all IO logs');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get all IO logs:', error);
        throw error;
    }
};

/**
 * 특정 조건으로 워크플로우 IO 로그를 가져오는 함수
 * @param {Object} params - 검색 조건
 * @param {number|null} params.user_id - 사용자 ID
 * @param {string|null} params.workflow_name - 워크플로우 이름
 * @param {string|null} params.workflow_id - 워크플로우 ID
 * @returns {Promise<Object>} IO 로그 목록
 */
export const getIOLogsByCondition = async ({ user_id = null, workflow_name = null, workflow_id = null }) => {
    try {
        const params = new URLSearchParams();

        if (user_id) {
            params.append('user_id', user_id.toString());
        }
        if (workflow_name) {
            params.append('workflow_name', workflow_name);
        }
        if (workflow_id) {
            params.append('workflow_id', workflow_id);
        }

        const response = await apiClient(
            `${API_BASE_URL}/api/manager/workflow/manager-io-logs?${params.toString()}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        devLog.log('Get IO logs by condition result:', data);

        if (!response.ok) {
            devLog.error('Failed to get IO logs by condition:', data);
            throw new Error(data.detail || 'Failed to get IO logs by condition');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get IO logs by condition:', error);
        throw error;
    }
};
