// User 관리 API 호출 함수들을 관리하는 파일 (Manager용 - 그룹 관련 기능만 제한적)
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 사용자를 그룹에서 제거하는 함수 (매니저가 속한 그룹만)
 * @param {Object} userData - 그룹에서 제거할 사용자 정보
 * @param {number} userData.id - 사용자 ID
 * @param {string} userData.group_name - 제거할 그룹명
 * @returns {Promise<Object>} 그룹 제거 결과
 */
export const removeUserGroup = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/manager/user/edit-user/groups`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();
        devLog.log('Remove user group result:', data);

        if (!response.ok) {
            devLog.error('Failed to remove user group:', data);
            throw new Error(data.detail || 'Failed to remove user group');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to remove user group:', error);
        throw error;
    }
};
