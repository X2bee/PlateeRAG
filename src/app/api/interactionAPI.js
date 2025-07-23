import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * ExecutionMeta 정보들을 리스트 형태로 반환합니다.
 * @param {Object} filters - 필터링 옵션
 * @param {string} [filters.interaction_id] - 특정 상호작용 ID로 필터링 (선택적)
 * @param {string} [filters.workflow_id] - 특정 워크플로우 ID로 필터링 (선택적)
 * @param {number} [filters.limit=100] - 반환할 최대 레코드 수 (기본값: 100)
 * @returns {Promise<Object>} ExecutionMeta 데이터 리스트를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listInteractions = async (filters = {}) => {
    try {
        const { interaction_id, workflow_id, limit = 100 } = filters;

        // URL 파라미터 구성
        const params = new URLSearchParams();
        if (interaction_id) params.append('interaction_id', interaction_id);
        if (workflow_id) params.append('workflow_id', workflow_id);
        params.append('limit', limit.toString());

        const response = await apiClient(
            `${API_BASE_URL}/api/interaction/list?${params}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Interaction list retrieved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to list interactions:', error);
        throw error;
    }
};

/**
 * 특정 workflow_id에 대한 모든 상호작용을 조회합니다.
 * @param {string} workflow_id - 워크플로우 ID
 * @param {number} [limit=100] - 반환할 최대 레코드 수
 * @returns {Promise<Object>} 해당 워크플로우의 상호작용 리스트
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowInteractions = async (workflow_id, limit = 100) => {
    try {
        if (!workflow_id) {
            throw new Error('workflow_id는 필수 파라미터입니다.');
        }

        return await listInteractions({ workflow_id, limit });
    } catch (error) {
        devLog.error('Failed to get workflow interactions:', error);
        throw error;
    }
};

/**
 * 특정 interaction_id에 대한 상호작용 정보를 조회합니다.
 * @param {string} interaction_id - 상호작용 ID
 * @returns {Promise<Object>} 해당 상호작용의 정보
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getInteractionById = async (interaction_id) => {
    try {
        if (!interaction_id) {
            throw new Error('interaction_id는 필수 파라미터입니다.');
        }

        return await listInteractions({ interaction_id, limit: 1 });
    } catch (error) {
        devLog.error('Failed to get interaction by ID:', error);
        throw error;
    }
};

/**
 * 고유한 interaction_id를 생성합니다.
 * @param {string} [prefix='chat'] - ID 접두사
 * @returns {string} 생성된 고유 interaction_id
 */
export const generateInteractionId = (prefix = 'chat') => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
};

/**
 * 워크플로우 이름에서 .json 확장자를 제거합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @returns {string} 확장자가 제거된 워크플로우 이름
 */
export const normalizeWorkflowName = (workflowName) => {
    return workflowName.replace('.json', '');
};
