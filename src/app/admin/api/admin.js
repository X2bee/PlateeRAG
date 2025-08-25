// Admin API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * 슈퍼유저 존재 여부를 확인하는 함수
 * @returns {Promise<boolean>} 슈퍼유저 존재 여부 (true/false)
 */
export const checkSuperuser = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/base/superuser`);
        const data = await response.json();
        devLog.log('Superuser check result:', data);
        return data.superuser;
    } catch (error) {
        devLog.error('Failed to check superuser:', error);
        throw error;
    }
};

/**
 * 현재 로그인한 사용자가 슈퍼유저인지 검증하는 함수 (인증 헤더 필요)
 * @returns {Promise<boolean>} 현재 사용자의 슈퍼유저 여부 (true/false)
 */
export const validateSuperuser = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/admin/base/validate/superuser`);
        const data = await response.json();
        devLog.log('Superuser validation result:', data);

        return data.superuser;
    } catch (error) {
        devLog.error('Failed to validate superuser:', error);
        throw error;
    }
};

/**
 * 슈퍼유저를 생성하는 함수
 * @param {Object} signupData - 회원가입 데이터
 * @param {string} signupData.username - 사용자명
 * @param {string} signupData.email - 이메일
 * @param {string} signupData.password - 비밀번호
 * @param {string} [signupData.full_name] - 전체 이름 (선택사항)
 * @returns {Promise<Object>} 회원가입 응답 데이터
 */
export const createSuperuser = async (signupData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/base/create-superuser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupData)
        });

        const data = await response.json();

        if (!response.ok) {
            devLog.error('Failed to create superuser:', data);
            throw new Error(data.detail || 'Failed to create superuser');
        }

        devLog.log('Superuser created successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to create superuser:', error);
        throw error;
    }
};
