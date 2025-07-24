import { devLog } from '@/app/_common/utils/logger';

/**
 * 인증 실패 또는 로그아웃 시 모든 사용자 관련 localStorage 데이터를 정리하는 유틸리티
 */

// 정리해야 할 localStorage 키들 목록
const USER_DATA_KEYS = [
    // 워크플로우 관련
    'plateerag_workflow_name',
    'plateerag_workflow_state',

    // 채팅 관련
    'currentChatData',
    'selectedCollection',

    // UI 상태 관련
    'execMonitorTab',

    // 설정 관련 (사용자별 설정이 있다면)
    'plateerag-configs',

    // 기타 사용자 세션 관련 데이터
    'previousPage', // sessionStorage이지만 같이 정리
];

/**
 * 모든 사용자 관련 localStorage 데이터를 정리합니다
 * @param {boolean} includeConfigs - 설정 정보도 함께 정리할지 여부 (기본값: false)
 */
export const clearAllUserData = (includeConfigs = false) => {
    if (typeof window === 'undefined') return;

    devLog.log('Starting to clear all user data from localStorage...');

    try {
        const keysToRemove = includeConfigs
            ? USER_DATA_KEYS
            : USER_DATA_KEYS.filter(key => key !== 'plateerag-configs');

        let removedCount = 0;

        keysToRemove.forEach(key => {
            try {
                const hadValue = localStorage.getItem(key) !== null;
                localStorage.removeItem(key);

                if (hadValue) {
                    removedCount++;
                    devLog.log(`Removed localStorage key: ${key}`);
                }
            } catch (error) {
                devLog.warn(`Failed to remove localStorage key "${key}":`, error);
            }
        });

        // sessionStorage도 정리
        try {
            const sessionStorageKeys = ['previousPage'];
            sessionStorageKeys.forEach(key => {
                const hadValue = sessionStorage.getItem(key) !== null;
                sessionStorage.removeItem(key);

                if (hadValue) {
                    removedCount++;
                    devLog.log(`Removed sessionStorage key: ${key}`);
                }
            });
        } catch (error) {
            devLog.warn('Failed to clear sessionStorage:', error);
        }

        devLog.log(`Successfully cleared ${removedCount} storage items`);

        return {
            success: true,
            removedCount,
            message: `${removedCount}개의 사용자 데이터가 정리되었습니다.`
        };

    } catch (error) {
        devLog.error('Failed to clear user data:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: '사용자 데이터 정리 중 오류가 발생했습니다.'
        };
    }
};

/**
 * 특정 영역의 데이터만 정리합니다
 */
export const clearUserDataByCategory = (category: 'workflow' | 'chat' | 'ui' | 'all') => {
    if (typeof window === 'undefined') return;

    const categoryKeys: Record<string, string[]> = {
        workflow: [
            'plateerag_workflow_name',
            'plateerag_workflow_state'
        ],
        chat: [
            'currentChatData',
            'selectedCollection'
        ],
        ui: [
            'execMonitorTab'
        ],
        all: USER_DATA_KEYS
    };

    const keysToRemove = categoryKeys[category] || [];

    devLog.log(`Clearing ${category} data...`);

    let removedCount = 0;
    keysToRemove.forEach((key: string) => {
        try {
            const hadValue = localStorage.getItem(key) !== null;
            localStorage.removeItem(key);

            if (hadValue) {
                removedCount++;
                devLog.log(`Removed ${category} key: ${key}`);
            }
        } catch (error) {
            devLog.warn(`Failed to remove ${category} key "${key}":`, error);
        }
    });

    return {
        success: true,
        removedCount,
        category,
        message: `${category} 데이터 ${removedCount}개가 정리되었습니다.`
    };
};

/**
 * 현재 저장된 사용자 데이터 키들을 조회합니다 (디버깅용)
 */
export const getUserDataKeys = () => {
    if (typeof window === 'undefined') return [];

    const existingKeys = [];

    USER_DATA_KEYS.forEach(key => {
        try {
            if (localStorage.getItem(key) !== null) {
                existingKeys.push({
                    key,
                    type: 'localStorage',
                    size: localStorage.getItem(key)?.length || 0
                });
            }
        } catch (error) {
            devLog.warn(`Error checking key "${key}":`, error);
        }
    });

    // sessionStorage도 체크
    try {
        if (sessionStorage.getItem('previousPage') !== null) {
            existingKeys.push({
                key: 'previousPage',
                type: 'sessionStorage',
                size: sessionStorage.getItem('previousPage')?.length || 0
            });
        }
    } catch (error) {
        devLog.warn('Error checking sessionStorage:', error);
    }

    return existingKeys;
};

/**
 * localStorage 사용량을 확인합니다 (MB 단위)
 */
export const getStorageUsage = () => {
    if (typeof window === 'undefined') return null;

    try {
        let totalSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                const value = localStorage.getItem(key) || '';
                totalSize += key.length + value.length;
            }
        }

        return {
            totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            itemCount: localStorage.length
        };
    } catch (error) {
        devLog.warn('Failed to calculate storage usage:', error);
        return null;
    }
};
