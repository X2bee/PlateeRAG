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
 * @param {Object} [options.offer_info] - 특정 오퍼 정보
 * @param {string} [options.hf_hub_token] - HuggingFace 토큰
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
 * 인스턴스 목록 조회 API
 * @returns {Promise<Object>} 인스턴스 목록
 */
export const listVastInstances = async () => {
    try {
        const url = `${API_BASE_URL}/api/vast/instances`;
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
 * VLLM 설정 업데이트 API
 * @param {Object} vllmConfig - VLLM 설정
 * @param {string} vllmConfig.api_base_url - VLLM API Base URL
 * @param {string} vllmConfig.model_name - VLLM 모델명
 * @returns {Promise<Object>} 설정 업데이트 결과
 */
export const setVllmConfig = async (vllmConfig) => {
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/api/vast/set-vllm`, {
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
