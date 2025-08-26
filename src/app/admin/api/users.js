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

/**
 * 사용자와 관련된 모든 데이터를 삭제하는 함수 (슈퍼유저 권한 필요)
 * @param {Object} userData - 삭제할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {string} userData.username - 사용자명
 * @param {string} userData.email - 사용자 이메일
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteUser = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/user/user-account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Delete user result:', data);

        if (!response.ok) {
            devLog.error('Failed to delete user:', data);
            throw new Error(data.detail || 'Failed to delete user');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to delete user:', error);
        throw error;
    }
};
