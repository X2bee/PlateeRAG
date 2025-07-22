import { devLog } from '@/app/utils/logger';
import { API_BASE_URL } from '@/app/config.js';

/**
 * 신규 사용자 정보를 백엔드로 전송하여 회원가입을 요청합니다.
 * @param {object} userData - username, userId, password를 포함하는 사용자 정보 객체.
 * @returns {Promise<object>} API 성공 응답 객체를 포함하는 프로미스.
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const registerUser = async (userData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/signup`, {
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