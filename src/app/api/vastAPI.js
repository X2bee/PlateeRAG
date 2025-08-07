import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * Vast 서비스 상태 확인 API
 * @returns {Promise<Object>} 서비스 상태
 */
export const checkVastHealth = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/vast/health`);
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
        const response = await apiClient(`${API_BASE_URL}/api/vast/search-offers`, {
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
 * @param {Object} [options.offer_info] - 특정 오퍼 정보
 * @param {string} [options.hf_hub_token] - HuggingFace 토큰
 * @param {string} [options.template_name] - 템플릿 이름 (budget, high_performance, research)
 * @param {boolean} [options.auto_destroy] - 자동 삭제 여부
 * @param {Object} [options.vllm_config] - VLLM 설정
 * @returns {Promise<Object>} 생성 결과
 */
export const createVastInstance = async (options = {}) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/vast/instances`, {
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
 * 인스턴스 목록 조회 API
 * @returns {Promise<Object>} 인스턴스 목록
 */
export const listVastInstances = async () => {
    try {
        const url = `${API_BASE_URL}/api/vast/instances`;
        const response = await apiClient(url);
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
 * 인스턴스 삭제 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const destroyVastInstance = async (instanceId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/vast/instances/${instanceId}`, {
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
 * VLLM 설정 업데이트 API
 * @param {Object} vllmConfig - VLLM 설정
 * @param {string} vllmConfig.api_base_url - VLLM API Base URL
 * @param {string} vllmConfig.model_name - VLLM 모델명
 * @returns {Promise<Object>} 설정 업데이트 결과
 */
export const updateVllmConnectionConfig = async (vllmConfig) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/vast/set-vllm`, {
            method: 'PUT',
            body: JSON.stringify(vllmConfig),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM config updated:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to update VLLM config:', error);
        throw error;
    }
};

/**
 * VLLM 다운 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} VLLM 다운 결과
 */
export const vllmDown = async (instanceId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/vast/instances/${instanceId}/vllm-down`, {
            method: 'POST',
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM down successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to down VLLM:', error);
        throw error;
    }
};

/**
 * VLLM 서비스 시작 API
 * @param {string} instanceId - 인스턴스 ID
 * @param {Object} vllmConfig - VLLM 설정
 * @param {string} vllmConfig.model_id - 모델 ID
 * @param {string} vllmConfig.host - 호스트 IP
 * @param {number} vllmConfig.port - 포트 번호
 * @param {number} vllmConfig.max_model_len - 최대 모델 길이
 * @param {number} vllmConfig.pipeline_parallel_size - 파이프라인 병렬 크기
 * @param {number} vllmConfig.tensor_parallel_size - 텐서 병렬 크기
 * @param {number} vllmConfig.gpu_memory_utilization - GPU 메모리 사용률
 * @param {string} vllmConfig.dtype - 데이터 타입
 * @param {string} vllmConfig.kv_cache_dtype - KV 캐시 데이터 타입
 * @param {string} vllmConfig.tool_call_parser - 도구 호출 파서
 * @returns {Promise<Object>} VLLM 서비스 시작 결과
 */
export const vllmServe = async (instanceId, vllmConfig) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/vast/instances/${instanceId}/vllm-serve`, {
            method: 'POST',
            body: JSON.stringify(vllmConfig),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM serve successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to serve VLLM:', error);
        throw error;
    }
};

/**
 * VLLM 헬스 체크 API
 * @param {Object} healthRequest - 헬스 체크 요청
 * @param {string} healthRequest.ip - VLLM 서비스 IP
 * @param {number} healthRequest.port - VLLM 서비스 포트
 * @returns {Promise<Object>} 헬스 체크 결과
 */
export const vllmHealthCheck = async (healthRequest) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/vast/instances/vllm-health`, {
            method: 'POST',
            body: JSON.stringify(healthRequest),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM health check successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to check VLLM health:', error);
        throw error;
    }
};

/**
 * 인스턴스 상태를 SSE로 구독
 * @param {string} instanceId - 인스턴스 ID
 * @param {Object} callbacks - 콜백 함수들
 * @param {Function} [callbacks.onStatusChange] - 상태 변경 시 호출
 * @param {Function} [callbacks.onComplete] - 인스턴스 생성 완료 시 호출
 * @param {Function} [callbacks.onError] - 에러 발생 시 호출
 * @param {Function} [callbacks.onClose] - 연결 종료 시 호출
 * @returns {EventSource} SSE 연결 객체
 */
export const subscribeToInstanceStatus = (instanceId, callbacks = {}) => {
    const { onStatusChange, onComplete, onError, onClose } = callbacks;

    // SSE 연결 생성
    const eventSource = new EventSource(
        `${API_BASE_URL}/api/vast/instances/${instanceId}/status-stream`,
        { withCredentials: true }
    );

    // 메시지 수신 처리
    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            // heartbeat 메시지는 무시
            if (data.type === 'heartbeat') {
                return;
            }

            devLog.log(`인스턴스 ${instanceId} 상태 업데이트:`, data);

            // 상태 변경 콜백 호출
            onStatusChange?.(data.status, data);

            // 완료 상태 체크
            if (data.status === 'running') {
                devLog.log(`인스턴스 ${instanceId} 생성 완료`);
                onComplete?.(data);
                eventSource.close();
            } else if (data.status === 'failed' || data.status === 'destroyed') {
                devLog.error(`인스턴스 ${instanceId} 생성 실패: ${data.status}`);
                onError?.(new Error(`인스턴스 생성 실패: ${data.status}`), data);
                eventSource.close();
            }
        } catch (error) {
            devLog.error('SSE 메시지 파싱 에러:', error);
            onError?.(error);
        }
    };

    // 에러 처리
    eventSource.onerror = (error) => {
        devLog.error(`인스턴스 ${instanceId} SSE 연결 에러:`, error);
        onError?.(error);
    };

    // 연결 종료 처리
    eventSource.addEventListener('close', () => {
        devLog.log(`인스턴스 ${instanceId} SSE 연결 종료`);
        onClose?.();
    });

    devLog.log(`인스턴스 ${instanceId} SSE 연결 시작`);
    return eventSource;
};
