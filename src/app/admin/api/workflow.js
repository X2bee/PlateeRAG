// Workflow 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * 모든 IO 로그를 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} IO 로그 목록 배열
 */
export const getAllIOLogs = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/workflow/all-io-logs`);
        const data = await response.json();
        devLog.log('Get all IO logs result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all IO logs:', data);
            throw new Error(data.detail || 'Failed to get all IO logs');
        }

        return data.io_logs;
    } catch (error) {
        devLog.error('Failed to get all IO logs:', error);
        throw error;
    }
};
