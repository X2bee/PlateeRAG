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
 * GPU 오퍼 검색 API
 * @param {Object} searchParams - 검색 파라미터
 * @param {string} [searchParams.gpu_name] - GPU 모델명
 * @param {number} [searchParams.max_price] - 최대 시간당 가격
 * @param {number} [searchParams.min_gpu_ram] - 최소 GPU RAM (GB)
 * @param {number} [searchParams.num_gpus] - GPU 개수
 * @param {boolean} [searchParams.rentable] - 렌트 가능 여부
 * @param {string} [searchParams.sort_by] - 정렬 기준 (price, gpu_ram, num_gpus)
 * @param {number} [searchParams.limit] - 결과 제한 개수
 * @returns {Promise<Object>} 오퍼 검색 결과
 */
export const searchVastOffers = async (searchParams = {}) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/search-offers`, {
            method: 'POST',
            body: JSON.stringify(searchParams),
        });
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
 * @param {string} [options.template_name] - 템플릿 이름 (budget, high_performance, research)
 * @param {boolean} [options.auto_destroy] - 자동 삭제 여부
 * @param {Object} [options.vllm_config] - VLLM 설정
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
 * VLLM 설정 및 실행 API
 * @param {string} instanceId - 인스턴스 ID
 * @param {Object} setupConfig - 설정 옵션
 * @param {string} [setupConfig.script_directory] - 스크립트 디렉토리 경로
 * @param {string} [setupConfig.hf_token] - HuggingFace 토큰
 * @param {string} [setupConfig.main_script] - 메인 스크립트 파일명
 * @param {string} [setupConfig.log_file] - 로그 파일 경로
 * @param {boolean} [setupConfig.install_requirements] - requirements.txt 설치 여부
 * @param {Object} setupConfig.vllm_config - VLLM 설정
 * @param {Object} [setupConfig.additional_env_vars] - 추가 환경변수
 * @returns {Promise<Object>} 설정 결과
 */
export const setupVLLM = async (instanceId, setupConfig) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}/setup-vllm`, {
            method: 'POST',
            body: JSON.stringify(setupConfig),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM setup successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to setup VLLM:', error);
        throw error;
    }
};

/**
 * 인스턴스 목록 조회 API
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.status_filter] - 상태별 필터링
 * @param {boolean} [options.include_destroyed] - 삭제된 인스턴스 포함
 * @param {string} [options.sort_by] - 정렬 기준 (created_at, cost)
 * @returns {Promise<Object>} 인스턴스 목록
 */
export const listVastInstances = async (options = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (options.status_filter) queryParams.append('status_filter', options.status_filter);
        if (options.include_destroyed) queryParams.append('include_destroyed', options.include_destroyed);
        if (options.sort_by) queryParams.append('sort_by', options.sort_by);

        const url = `${API_BASE_URL}/api/vast/instances${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await authenticatedFetch(url);
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
 * SSH 명령 실행 API
 * @param {string} instanceId - 인스턴스 ID
 * @param {string} command - 실행할 명령
 * @param {Object} [options] - 실행 옵션
 * @param {string} [options.working_directory] - 작업 디렉토리
 * @param {Object} [options.environment_vars] - 환경변수
 * @param {boolean} [options.background] - 백그라운드 실행 여부
 * @param {number} [options.timeout] - 타임아웃 (초)
 * @returns {Promise<Object>} 명령 실행 결과
 */
export const executeVastSSHCommand = async (instanceId, command, options = {}) => {
    try {
        const requestBody = {
            command,
            ...options
        };

        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/instances/${instanceId}/execute`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
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
 * 로그 조회 API
 * @param {string} instanceId - 인스턴스 ID
 * @param {Object} [options] - 조회 옵션
 * @param {string} [options.log_file] - 로그 파일 경로
 * @param {number} [options.lines] - 읽을 줄 수
 * @returns {Promise<Object>} 로그 정보
 */
export const getVastInstanceLogs = async (instanceId, options = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (options.log_file) queryParams.append('log_file', options.log_file);
        if (options.lines) queryParams.append('lines', options.lines);

        const url = `${API_BASE_URL}/api/vast/instances/${instanceId}/logs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await authenticatedFetch(url);
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
 * 프로세스 상태 조회 API
 * @param {string} instanceId - 인스턴스 ID
 * @param {string} [processName] - 특정 프로세스 이름
 * @returns {Promise<Object>} 프로세스 정보
 */
export const getVastProcesses = async (instanceId, processName = null) => {
    try {
        const queryParams = new URLSearchParams();
        if (processName) queryParams.append('process_name', processName);

        const url = `${API_BASE_URL}/api/vast/instances/${instanceId}/processes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        const response = await authenticatedFetch(url);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Vast processes retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get vast processes:', error);
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
