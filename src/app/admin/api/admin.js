// Admin API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/helper/apiClient';
import { generateSha256Hash } from '@/app/_common/utils/generateSha1Hash';

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
        const signupForm = {
            ...signupData,
            password: generateSha256Hash(signupData.password)
        };

        const response = await fetch(`${API_BASE_URL}/api/admin/base/create-superuser`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(signupForm)
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

/**
 * 백엔드 로그 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {number} page - 페이지 번호 (1부터 시작, 기본값: 1)
 * @param {number} pageSize - 페이지당 항목 수 (1-1000, 기본값: 250)
 * @returns {Promise<Object>} 로그 목록과 페이지네이션 정보가 포함된 객체
 */
export const getBackendLogs = async (page = 1, pageSize = 250) => {
    try {
        // 파라미터 검증
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 1000) pageSize = 250;

        const url = `${API_BASE_URL}/api/admin/base/backend/logs?page=${page}&page_size=${pageSize}`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log('Get backend logs result:', data);

        if (!response.ok) {
            devLog.error('Failed to get backend logs:', data);
            throw new Error(data.detail || 'Failed to get backend logs');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get backend logs:', error);
        throw error;
    }
};
