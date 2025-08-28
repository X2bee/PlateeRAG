// Workflow 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/helper/apiClient';

/**
 * 모든 IO 로그를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작)
 * @param {number} pageSize - 페이지당 항목 수 (기본값: 250)
 * @returns {Promise<Object>} IO 로그 목록과 페이지네이션 정보가 포함된 객체
 */
export const getAllIOLogs = async (page = 1, pageSize = 250) => {
    try {
        const url = `${API_BASE_URL}/api/admin/workflow/all-io-logs?page=${page}&page_size=${pageSize}`;
        const response = await apiClient(url);
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
