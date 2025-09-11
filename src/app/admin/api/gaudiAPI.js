import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/api/helper/apiClient';

/**
 * Gaudi 서비스 상태 확인 API
 * @returns {Promise<Object>} HPU 리소스 상태 및 VLLM 인스턴스 현황
 */
export const checkGaudiHealth = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/health`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Gaudi health check successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to check Gaudi health:', error);
        throw error;
    }
};

/**
 * 사용 가능한 HPU 조회 API
 * @returns {Promise<Object>} 사용 가능한 HPU 목록과 추천사항
 */
export const getAvailableHPUs = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/resource/available-hpus`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Available HPUs retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get available HPUs:', error);
        throw error;
    }
};

/**
 * HPU 할당 가능성 확인 API
 * @param {Object} allocationRequest - 할당 요청
 * @param {number} allocationRequest.required_hpus - 필요한 HPU 개수
 * @param {boolean} [allocationRequest.prefer_consecutive] - 연속된 HPU 선호 여부
 * @returns {Promise<Object>} 할당 가능성 결과
 */
export const checkHPUAllocation = async (allocationRequest) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/resource/check-allocation`, {
            method: 'POST',
            body: JSON.stringify(allocationRequest),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('HPU allocation check result:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to check HPU allocation:', error);
        throw error;
    }
};

/**
 * VLLM 자동 할당 시작 API
 * @param {Object} vllmConfig - VLLM 설정
 * @param {string} vllmConfig.model_name - 모델명
 * @param {number} vllmConfig.max_model_len - 최대 모델 길이
 * @param {string} vllmConfig.host - 호스트 IP
 * @param {number} vllmConfig.port - 포트 번호
 * @param {string} vllmConfig.dtype - 데이터 타입
 * @param {number} vllmConfig.hpu_memory_utilization - HPU 메모리 사용률
 * @param {number} vllmConfig.tensor_parallel_size - 텐서 병렬 크기
 * @param {string} [vllmConfig.tool_call_parser] - 도구 호출 파서
 * @param {boolean} [vllmConfig.trust_remote_code] - 원격 코드 신뢰 여부
 * @param {boolean} [vllmConfig.enable_lora] - LoRA 어댑터 지원
 * @param {Object} allocationRequest - 할당 요청
 * @param {number} allocationRequest.required_hpus - 필요한 HPU 개수
 * @param {boolean} [allocationRequest.prefer_consecutive] - 연속된 HPU 선호 여부
 * @returns {Promise<Object>} VLLM 인스턴스 정보
 */
export const startVLLMAutoAllocation = async (vllmConfig, allocationRequest) => {
    try {
        const requestBody = {
            ...vllmConfig,
            ...allocationRequest
        };

        const response = await apiClient(`${API_BASE_URL}/api/gaudi/vllm/start-auto`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM auto allocation started:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to start VLLM with auto allocation:', error);
        throw error;
    }
};

/**
 * VLLM 수동 할당 시작 API
 * @param {Object} vllmConfig - VLLM 설정
 * @param {string} vllmConfig.model_name - 모델명
 * @param {number} vllmConfig.max_model_len - 최대 모델 길이
 * @param {string} vllmConfig.host - 호스트 IP
 * @param {number} vllmConfig.port - 포트 번호
 * @param {string} vllmConfig.dtype - 데이터 타입
 * @param {number} vllmConfig.hpu_memory_utilization - HPU 메모리 사용률
 * @param {number} vllmConfig.tensor_parallel_size - 텐서 병렬 크기
 * @param {string} [vllmConfig.tool_call_parser] - 도구 호출 파서
 * @param {boolean} [vllmConfig.trust_remote_code] - 원격 코드 신뢰 여부
 * @param {boolean} [vllmConfig.enable_lora] - LoRA 어댑터 지원
 * @param {Object} allocationRequest - 할당 요청
 * @param {number[]} allocationRequest.device_ids - 사용할 HPU 장치 ID 목록
 * @returns {Promise<Object>} VLLM 인스턴스 정보
 */
export const startVLLMManualAllocation = async (vllmConfig, allocationRequest) => {
    try {
        const requestBody = {
            ...vllmConfig,
            ...allocationRequest
        };

        const response = await apiClient(`${API_BASE_URL}/api/gaudi/vllm/start-manual`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM manual allocation started:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to start VLLM with manual allocation:', error);
        throw error;
    }
};

/**
 * VLLM 인스턴스 목록 조회 API
 * @returns {Promise<Object>} 실행 중인 VLLM 인스턴스 목록
 */
export const listVLLMInstances = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/vllm/instances`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM instances listed:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to list VLLM instances:', error);
        throw error;
    }
};

/**
 * VLLM 인스턴스 상태 조회 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 인스턴스 상세 상태
 */
export const getVLLMInstanceStatus = async (instanceId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/vllm/${instanceId}/status`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM instance status retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get VLLM instance status:', error);
        throw error;
    }
};

/**
 * VLLM 인스턴스 중지 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 중지 결과
 */
export const stopVLLMInstance = async (instanceId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/vllm/${instanceId}/stop`, {
            method: 'POST',
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM instance stopped:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to stop VLLM instance:', error);
        throw error;
    }
};

/**
 * 모든 VLLM 인스턴스 중지 API
 * @returns {Promise<Object>} 일괄 중지 결과
 */
export const stopAllVLLMInstances = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/vllm/stop-all`, {
            method: 'POST',
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('All VLLM instances stopped:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to stop all VLLM instances:', error);
        throw error;
    }
};

/**
 * VLLM 인스턴스 헬스 체크 API
 * @param {string} instanceId - 인스턴스 ID
 * @returns {Promise<Object>} 헬스 체크 결과
 */
export const vllmInstanceHealthCheck = async (instanceId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/vllm/${instanceId}/health-check`, {
            method: 'POST',
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('VLLM instance health check successful:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to check VLLM instance health:', error);
        throw error;
    }
};

/**
 * 추천 모델 목록 조회 API
 * @returns {Promise<Object>} Gaudi HPU에 최적화된 추천 모델 목록
 */
export const getRecommendedModels = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/gaudi/models/recommended`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Recommended models retrieved:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get recommended models:', error);
        throw error;
    }
};

/**
 * VLLM 설정 검증 및 추천 헬퍼 함수
 * @param {Object} vllmConfig - VLLM 설정
 * @param {number} availableHPUs - 사용 가능한 HPU 개수
 * @returns {Object} 검증 결과 및 추천사항
 */
export const validateVLLMConfig = (vllmConfig, availableHPUs) => {
    const validation = {
        isValid: true,
        warnings: [],
        recommendations: [],
        adjustedConfig: { ...vllmConfig }
    };

    // 텐서 병렬 크기 검증
    if (vllmConfig.tensor_parallel_size > availableHPUs) {
        validation.isValid = false;
        validation.warnings.push(`요청된 텐서 병렬 크기(${vllmConfig.tensor_parallel_size})가 사용 가능한 HPU 개수(${availableHPUs})를 초과합니다.`);
        validation.adjustedConfig.tensor_parallel_size = availableHPUs;
        validation.recommendations.push(`텐서 병렬 크기를 ${availableHPUs}로 조정하는 것을 권장합니다.`);
    }

    // 메모리 사용률 검증
    if (vllmConfig.hpu_memory_utilization > 0.95) {
        validation.warnings.push('HPU 메모리 사용률이 95%를 초과합니다. 안정성을 위해 90% 이하로 설정하는 것을 권장합니다.');
        validation.adjustedConfig.hpu_memory_utilization = 0.9;
        validation.recommendations.push('HPU 메모리 사용률을 90%로 조정하는 것을 권장합니다.');
    }

    // 모델 길이와 메모리 사용률 관계 검증
    if (vllmConfig.max_model_len > 8192 && vllmConfig.hpu_memory_utilization > 0.8) {
        validation.warnings.push('긴 모델 길이와 높은 메모리 사용률 조합으로 인해 메모리 부족이 발생할 수 있습니다.');
        validation.recommendations.push('메모리 사용률을 70-80%로 낮추거나 모델 길이를 줄이는 것을 권장합니다.');
    }

    // 데이터 타입 검증
    const supportedDTypes = ['bfloat16', 'float16', 'auto'];
    if (!supportedDTypes.includes(vllmConfig.dtype)) {
        validation.warnings.push(`지원되지 않는 데이터 타입: ${vllmConfig.dtype}. bfloat16을 권장합니다.`);
        validation.adjustedConfig.dtype = 'bfloat16';
        validation.recommendations.push('Gaudi HPU에서는 bfloat16이 최적화되어 있습니다.');
    }

    return validation;
};

/**
 * HPU 리소스 사용량 모니터링 헬퍼 함수
 * @param {Object[]} instances - VLLM 인스턴스 목록
 * @returns {Object} 리소스 사용량 통계
 */
export const getHPUResourceStats = (instances) => {
    const stats = {
        totalInstances: instances.length,
        totalAllocatedHPUs: 0,
        hpuUtilization: {},
        modelDistribution: {},
        averageUptime: 0
    };

    let totalUptime = 0;

    instances.forEach(instance => {
        stats.totalAllocatedHPUs += instance.allocated_hpus.length;

        instance.allocated_hpus.forEach(hpuId => {
            stats.hpuUtilization[hpuId] = {
                instance_id: instance.instance_id,
                model_name: instance.model_name,
                uptime: instance.uptime
            };
        });

        if (stats.modelDistribution[instance.model_name]) {
            stats.modelDistribution[instance.model_name]++;
        } else {
            stats.modelDistribution[instance.model_name] = 1;
        }

        totalUptime += instance.uptime || 0;
    });

    if (instances.length > 0) {
        stats.averageUptime = totalUptime / instances.length;
    }

    return stats;
};

/**
 * 인스턴스 상태 변경 리스너 (polling 방식)
 * @param {string[]} instanceIds - 모니터링할 인스턴스 ID 목록
 * @param {Object} callbacks - 콜백 함수들
 * @param {Function} [callbacks.onStatusChange] - 상태 변경 시 호출
 * @param {Function} [callbacks.onError] - 에러 발생 시 호출
 * @param {number} [interval=5000] - 폴링 간격 (밀리초)
 * @returns {Object} 폴링 제어 객체 (start, stop 메서드 포함)
 */
export const createInstanceMonitor = (instanceIds, callbacks = {}, interval = 5000) => {
    const { onStatusChange, onError } = callbacks;
    let intervalId = null;
    let previousStates = {};

    const pollInstances = async () => {
        try {
            const instances = await listVLLMInstances();
            const currentStates = {};

            instances.forEach(instance => {
                if (instanceIds.includes(instance.instance_id)) {
                    currentStates[instance.instance_id] = {
                        status: instance.status,
                        uptime: instance.uptime,
                        allocated_hpus: instance.allocated_hpus
                    };

                    // 상태 변경 감지
                    const prevState = previousStates[instance.instance_id];
                    if (!prevState || prevState.status !== instance.status) {
                        devLog.log(`인스턴스 ${instance.instance_id} 상태 변경: ${prevState?.status || 'unknown'} -> ${instance.status}`);
                        onStatusChange?.(instance.instance_id, instance.status, instance);
                    }
                }
            });

            previousStates = currentStates;
        } catch (error) {
            devLog.error('인스턴스 모니터링 에러:', error);
            onError?.(error);
        }
    };

    return {
        start: () => {
            if (!intervalId) {
                pollInstances(); // 즉시 한 번 실행
                intervalId = setInterval(pollInstances, interval);
                devLog.log('인스턴스 모니터링 시작');
            }
        },
        stop: () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
                devLog.log('인스턴스 모니터링 중지');
            }
        },
        isRunning: () => intervalId !== null
    };
};

/**
 * 빠른 설정 템플릿
 */
export const VLLM_CONFIG_TEMPLATES = {
    // 소형 모델용 (단일 HPU)
    small: {
        max_model_len: 2048,
        dtype: 'bfloat16',
        hpu_memory_utilization: 0.8,
        tensor_parallel_size: 1,
        trust_remote_code: true,
        tool_call_parser: 'hermes'
    },
    // 중형 모델용 (2개 HPU)
    medium: {
        max_model_len: 4096,
        dtype: 'bfloat16',
        hpu_memory_utilization: 0.9,
        tensor_parallel_size: 2,
        trust_remote_code: true,
        tool_call_parser: 'hermes'
    },
    // 대형 모델용 (4개 HPU)
    large: {
        max_model_len: 8192,
        dtype: 'bfloat16',
        hpu_memory_utilization: 0.9,
        tensor_parallel_size: 4,
        trust_remote_code: true,
        enable_lora: true,
        tool_call_parser: 'hermes'
    },
    // 최고성능 (8개 HPU)
    xlarge: {
        max_model_len: 16384,
        dtype: 'bfloat16',
        hpu_memory_utilization: 0.95,
        tensor_parallel_size: 8,
        trust_remote_code: true,
        enable_lora: true,
        tool_call_parser: 'hermes'
    }
};
