// User 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * 모든 사용자 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} 사용자 목록 배열
 */
export const getAllUsers = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/all-users`);
        const data = await response.json();
        devLog.log('Get all users result:', data);

        if (!response.ok) {
            devLog.error('Failed to get all users:', data);
            throw new Error(data.detail || 'Failed to get all users');
        }

        return data.users;
    } catch (error) {
        devLog.error('Failed to get all users:', error);
        throw error;
    }
};
