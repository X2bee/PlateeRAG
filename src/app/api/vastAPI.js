import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { authenticatedFetch } from '@/app/api/authAPI';

/**
 * Vast 서비스 상태 확인 API
 * @returns {Promise<Object>} 서비스 상태
 */
export const checkVastHealth = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/health`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast health check successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to check vast health:', error);
        throw error;
    }
};

/**
 * Vast 설정 조회 API
 * @returns {Promise<Object>} 현재 Vast 설정
 */
export const getVastConfig = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/config`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast config retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get vast config:', error);
        throw error;
    }
};

/**
 * Vast 설정 업데이트 API
 * @param {Object} configUpdates - 업데이트할 설정
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateVastConfig = async (configUpdates) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/config`, {
            method: 'POST',
            body: JSON.stringify({ config_updates: configUpdates }),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast config updated:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to update vast config:', error);
        throw error;
    }
};

/**
 * 사용 가능한 오퍼 검색 API
 * @returns {Promise<Object>} 오퍼 목록
 */
export const searchVastOffers = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/offers`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast offers retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to search vast offers:', error);
        throw error;
    }
};

/**
 * 새 인스턴스 생성 API
 * @param {Object} options - 인스턴스 생성 옵션
 * @param {string} [options.offer_id] - 특정 오퍼 ID
 * @param {boolean} [options.auto_destroy] - 자동 삭제 여부
 * @returns {Promise<Object>} 생성 결과
 */
export const createVastInstance = async (options = {}) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances`, {
            method: 'POST',
            body: JSON.stringify(options),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instance created:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to create vast instance:', error);
        throw error;
    }
};

/**
 * vLLM 자동 실행 API
 * @returns {Promise<Object>} 실행 결과
 */
export const autoRunVLLM = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/auto-run`, {
            method: 'POST',
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('vLLM auto run successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to auto run vLLM:', error);
        throw error;
    }
};

/**
 * 인스턴스 목록 조회 API
 * @returns {Promise<Object>} 인스턴스 목록
 */
export const listVastInstances = async () => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instances listed:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to list vast instances:', error);
        throw error;
    }
};

/**
 * 인스턴스 상태 조회 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 인스턴스 상태
 */
export const getVastInstanceStatus = async (instanceId) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instance status retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get vast instance status:', error);
        throw error;
    }
};

/**
 * 인스턴스 설정 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 설정 결과
 */
export const setupVastInstance = async (instanceId) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}/setup`, {
            method: 'POST',
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instance setup initiated:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to setup vast instance:', error);
        throw error;
    }
};

/**
 * 인스턴스 로그 조회 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 로그 정보
 */
export const getVastInstanceLogs = async (instanceId) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}/logs`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instance logs retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get vast instance logs:', error);
        throw error;
    }
};

/**
 * 포트 매핑 조회 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 포트 매핑 정보
 */
export const getVastPortMappings = async (instanceId) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}/ports`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast port mappings retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get vast port mappings:', error);
        throw error;
    }
};

/**
 * SSH 명령 실행 API
 * @param {string} instanceId - 인스턴스 ID
 * @param {string} command - 실행할 명령
 * @returns {Promise<Object>} 명령 실행 결과
 */
export const executeVastSSHCommand = async (instanceId, command) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}/execute`, {
            method: 'POST',
            body: JSON.stringify({ command }),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('SSH command executed:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to execute SSH command:', error);
        throw error;
    }
};

/**
 * 인스턴스 삭제 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const destroyVastInstance = async (instanceId) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}`, {
            method: 'DELETE',
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instance destroyed:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to destroy vast instance:', error);
        throw error;
    }
};

/**
 * 인스턴스 실행 히스토리 조회 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 실행 히스토리
 */
export const getVastInstanceHistory = async (instanceId) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}/history`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast instance history retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get vast instance history:', error);
        throw error;
    }
};

/**
 * 인스턴스 상태를 주기적으로 확인하는 폴링 함수
 * @param {string} instanceId - 인스턴스 ID
 * @param {function} onStatusUpdate - 상태 업데이트 콜백
 * @param {number} interval - 폴링 간격 (기본값: 5초)
 * @returns {function} 폴링 중지 함수
 */
export const pollVastInstanceStatus = (instanceId, onStatusUpdate, interval = 5000) => {
    const pollStatus = async () => {
        try {
            const status = await getVastInstanceStatus(instanceId);
            onStatusUpdate(status);
        } catch (error) {
            devLog.error('Status polling error:', error);
            onStatusUpdate({ error: error.message });
        }
    };

    // 즉시 한 번 실행
    pollStatus();

    // 주기적 실행
    const intervalId = setInterval(pollStatus, interval);

    // 폴링 중지 함수 반환
    return () => clearInterval(intervalId);
};

/**
 * 여러 인스턴스의 상태를 일괄 조회
 * @param {string[]} instanceIds - 인스턴스 ID 배열
 * @returns {Promise<Object[]>} 인스턴스 상태 배열
 */
export const getBatchVastInstanceStatus = async (instanceIds) => {
    try {
        const statusPromises = instanceIds.map(id => getVastInstanceStatus(id));
        const results = await Promise.allSettled(statusPromises);

        return results.map((result, index) => ({
            instanceId: instanceIds[index],
            ...(result.status === 'fulfilled' ? result.value : { error: result.reason.message })
        }));
    } catch (error) {
        devLog.error('Failed to get batch instance status:', error);
        throw error;
    }
};

/**
 * 인스턴스가 준비될 때까지 대기하는 함수
 * @param {string} instanceId - 인스턴스 ID
 * @param {number} maxAttempts - 최대 시도 횟수 (기본값: 60)
 * @param {number} interval - 확인 간격 (기본값: 10초)
 * @returns {Promise<Object>} 준비된 인스턴스 상태
 */
export const waitForVastInstanceReady = async (instanceId, maxAttempts = 60, interval = 10000) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const status = await getVastInstanceStatus(instanceId);

            if (status.status === 'running' && status.urls && Object.keys(status.urls).length > 0) {
                devLog.log(`Instance ${instanceId} is ready after ${attempt} attempts`);
                return status;
            }

            devLog.log(`Instance ${instanceId} not ready yet (attempt ${attempt}/${maxAttempts}), status: ${status.status}`);

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval));
            }
        } catch (error) {
            devLog.error(`Error checking instance status (attempt ${attempt}):`, error);

            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, interval));
            } else {
                throw error;
            }
        }
    }

    throw new Error(`Instance ${instanceId} did not become ready within ${maxAttempts} attempts`);
};
