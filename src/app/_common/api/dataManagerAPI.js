import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * Data Manager API 함수들을 관리하는 파일
 * Data Manager 인스턴스의 생성, 관리, 삭제 및 Huggingface 데이터 관리를 위한 RESTful API
 */

/**
 * Data Manager 서비스 상태 확인
 * @returns {Promise<Object>} 서비스 상태 정보
 */
export const getDataManagerHealth = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/health`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Data Manager health status fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Data Manager health status:', error);
        throw error;
    }
};

/**
 * 새로운 Data Manager 인스턴스 생성
 * @returns {Promise<Object>} 생성된 매니저 정보
 */
export const createDataManager = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info('Data Manager created successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to create Data Manager:', error);
        throw error;
    }
};

/**
 * Data Manager 목록 조회
 * @param {boolean} allUsers - 모든 사용자의 매니저를 조회할지 여부 (기본값: false)
 * @returns {Promise<Object>} 매니저 목록
 */
export const listDataManagers = async (allUsers = false) => {
    try {
        const queryParam = allUsers ? '?all_users=true' : '';
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers${queryParam}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Data Manager list fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Data Manager list:', error);
        throw error;
    }
};

/**
 * 특정 Data Manager의 상태 조회
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 매니저 상태 정보
 */
export const getDataManagerStatus = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                manager_id: managerId,
            }),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Data Manager ${managerId} status fetched:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to fetch Data Manager ${managerId} status:`, error);
        throw error;
    }
};

/**
 * Data Manager 삭제
 * @param {string} managerId - 삭제할 매니저 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteDataManager = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                manager_id: managerId,
            }),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Data Manager ${managerId} deleted successfully:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to delete Data Manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 전체 Data Manager 통계 조회
 * @returns {Promise<Object>} 전체 통계 정보
 */
export const getDataManagerStats = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/stats`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Data Manager stats fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Data Manager stats:', error);
        throw error;
    }
};

/**
 * Data Manager 유틸리티 함수들
 */

/**
 * 매니저 ID 유효성 검사
 * @param {string} managerId - 검사할 매니저 ID
 * @returns {boolean} 유효성 여부
 */
export const isValidManagerId = (managerId) => {
    return typeof managerId === 'string' && managerId.length > 0;
};

/**
 * 데이터셋 키 생성 (클라이언트 사이드에서 예측)
 * @param {string} datasetName - 데이터셋 이름
 * @param {string} [configName] - 설정 이름
 * @param {string} [split] - 데이터 분할
 * @returns {string} 생성된 데이터셋 키
 */
export const generateDatasetKey = (datasetName, configName = null, split = null) => {
    let key = datasetName;
    if (configName) {
        key += `__${configName}`;
    }
    if (split) {
        key += `__${split}`;
    }
    return key;
};

/**
 * 파일 키 생성 (클라이언트 사이드에서 예측)
 * @param {string} repoId - 리포지토리 ID
 * @param {string} filename - 파일명
 * @returns {string} 생성된 파일 키
 */
export const generateFileKey = (repoId, filename) => {
    return `${repoId}__${filename}`;
};

/**
 * 리소스 사용량 포맷팅 함수
 * @param {number} memoryMb - 메모리 사용량 (MB)
 * @param {number} cpuPercent - CPU 사용률 (%)
 * @returns {Object} 포맷팅된 리소스 정보
 */
export const formatResourceUsage = (memoryMb, cpuPercent) => {
    return {
        memory: {
            mb: Math.round(memoryMb * 100) / 100,
            gb: Math.round((memoryMb / 1024) * 100) / 100,
            formatted: memoryMb >= 1024
                ? `${Math.round((memoryMb / 1024) * 100) / 100} GB`
                : `${Math.round(memoryMb * 100) / 100} MB`
        },
        cpu: {
            percent: Math.round(cpuPercent * 100) / 100,
            formatted: `${Math.round(cpuPercent * 100) / 100}%`
        }
    };
};

/**
 * Huggingface 데이터셋 다운로드 및 적재
 * @param {string} managerId - 매니저 ID
 * @param {string} repoId - Huggingface 리포지토리 ID (예: "squad")
 * @param {string} [filename] - 특정 파일명 (선택사항)
 * @param {string} [split] - 데이터 분할 (예: "train")
 * @returns {Promise<Object>} 다운로드 결과
 */
export const downloadDataset = async (managerId, repoId, filename = null, split = null) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }
        if (!repoId) {
            throw new Error('Repository ID is required');
        }

        const requestBody = {
            manager_id: managerId,
            repo_id: repoId
        };

        if (filename) {
            requestBody.filename = filename;
        }
        if (split) {
            requestBody.split = split;
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/hf/download-dataset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset downloaded and loaded for manager ${managerId} from ${repoId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to download dataset for manager ${managerId} from ${repoId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 샘플 조회
 * @param {string} managerId - 매니저 ID
 * @param {number} [numSamples=10] - 조회할 샘플 개수 (기본값: 10)
 * @returns {Promise<Object>} 데이터셋 샘플 정보
 */
export const getDatasetSample = async (managerId, numSamples = 10) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId,
            num_samples: numSamples
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/dataset/sample`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset sample retrieved for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to get dataset sample for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 삭제
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 데이터셋 삭제 결과
 */
export const removeDataset = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId,
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/dataset/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset removed for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to remove dataset for manager ${managerId}:`, error);
        throw error;
    }
};
