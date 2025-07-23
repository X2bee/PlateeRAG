// Configuration API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * 백엔드에서 모든 설정 정보를 가져오는 함수
 * @returns {Promise<Object>} 설정 정보 객체
 */
export const fetchAllConfigs = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/app/config/persistent`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        devLog.error('Failed to fetch configs:', error);
        throw error;
    }
};

/**
 * 특정 설정값을 업데이트하는 함수
 * @param {string} configName - 설정 이름 (예: "OPENAI_API_KEY")
 * @param {any} value - 새로운 값
 * @returns {Promise<Object>} 업데이트된 설정 정보
 */
export const updateConfig = async (configName, value) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/app/config/persistent/${configName}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    value: value,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        devLog.error('Failed to update config:', error);
        throw error;
    }
};

/**
 * 모든 설정을 새로고침하는 함수
 * @returns {Promise<Object>} 새로고침 결과
 */
export const refreshConfigs = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/app/config/persistent/refresh`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        devLog.error('Failed to refresh configs:', error);
        throw error;
    }
};

/**
 * 특정 카테고리의 설정들을 가져오는 함수 (클라이언트 필터링)
 * @param {string} category - 카테고리 (예: "openai", "database")
 * @returns {Promise<Object>} 해당 카테고리의 설정 정보
 */
export const fetchConfigsByCategory = async (category) => {
    try {
        const allConfigs = await fetchAllConfigs();
        // 클라이언트에서 카테고리별로 필터링
        const filteredConfigs = {};
        const categoryPrefix = category.toLowerCase();

        for (const [key, config] of Object.entries(allConfigs)) {
            if (key.toLowerCase().includes(categoryPrefix)) {
                filteredConfigs[key] = config;
            }
        }

        return filteredConfigs;
    } catch (error) {
        devLog.error('Failed to fetch configs by category:', error);
        throw error;
    }
};

/**
 * 설정 연결 테스트를 수행하는 함수 (임시 구현)
 * @param {string} category - 테스트할 카테고리 (예: "openai", "database")
 * @returns {Promise<Object>} 테스트 결과
 */
export const testConnection = async (category) => {
    try {
        // 백엔드에 연결 테스트 엔드포인트가 없으므로 임시로 더미 응답 반환
        devLog.info(`Testing connection for ${category}...`);

        // 시뮬레이션을 위한 지연
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return {
            success: true,
            message: `${category} 연결 테스트가 완료되었습니다.`,
            category: category,
            timestamp: new Date().toISOString(),
        };
    } catch (error) {
        devLog.error('Failed to test connection:', error);
        throw error;
    }
};

/**
 * 모든 설정 정보를 저장하는 함수
 * @returns {Promise<Object>} 저장 결과
 */
export const saveConfigs = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/app/config/persistent/save`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        devLog.error('Failed to save configs:', error);
        throw error;
    }
};

/**
 * 앱 설정 정보를 가져오는 함수
 * @returns {Promise<Object>} 앱 설정 정보
 */
export const fetchAppConfig = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/app/config`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        devLog.error('Failed to fetch app config:', error);
        throw error;
    }
};
