import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from './apiClient';

/**
 * 신규 사용자 정보를 백엔드로 전송하여 회원가입을 요청합니다.
 * @param {object} userData - username, userId, password를 포함하는 사용자 정보 객체.
 * @returns {Promise<object>} API 성공 응답 객체를 포함하는 프로미스.
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const registerUser = async (userData) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        return result;

    } catch (error) {
        devLog.error('Failed to register user:', error);

        throw error;
    }
};

/**
 * 이메일 주소를 백엔드로 전송하여 비밀번호 재설정 이메일 발송을 요청합니다.
 * @param {object} data - email을 포함하는 객체.
 * @returns {Promise<object>} API 성공 응답 객체를 포함하는 프로미스.
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const requestPasswordReset = async (data) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        return result;

    } catch (error) {
        console.error('Failed to request password reset:', error);
        throw error;
    }
};

/**
 * 토큰과 새 비밀번호를 백엔드로 전송하여 비밀번호 변경을 요청합니다.
 * @param {ResetPasswordData} data - token과 password를 포함하는 객체.
 * @returns {Promise<object>} API 성공 응답 객체를 포함하는 프로미스.
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const resetPassword = async (data) => {
    try {
        const response = await apiClient(`/api/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }
        return result;
    } catch (error) {
        console.error('Failed to reset password:', error);
        throw error;
    }
};
