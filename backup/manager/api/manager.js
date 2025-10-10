// Manager 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * Manager 권한을 검증하는 함수
 * @returns {Promise<Object>} { manager: boolean, user_id?: number }
 */
export const validateManager = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/manager/base/validate/manager`);
        const data = await response.json();
        devLog.log('Validate manager result:', data);

        if (!response.ok) {
            devLog.error('Failed to validate manager:', data);
            throw new Error(data.detail || 'Failed to validate manager');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to validate manager:', error);
        throw error;
    }
};
