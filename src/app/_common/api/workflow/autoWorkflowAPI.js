import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * Agent 노드 정보 조회 (기존 API 패턴 사용)
 * @param {string} agentNodeId - Agent 노드 ID
 * @returns {Promise<Object>} Agent 노드 정보와 호환 가능한 노드들
 */
export const getAgentNodeInfo = async (agentNodeId) => {
    try {
        devLog.log('Agent 노드 정보 조회:', agentNodeId);
        
        // 기존 API 패턴 사용: /api/editor/{node_id}/info
        const response = await apiClient(`${API_BASE_URL}/api/editor/${agentNodeId}/info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('Agent 노드 정보 조회 성공:', result);
        return result;
    } catch (error) {
        devLog.error('Agent 노드 정보 조회 실패:', error);
        throw error;
    }
};

// 이제 백엔드에서 처리하므로 프론트엔드 로직은 간소화됨

/**
 * 워크플로우 자동생성 (사용자 요구사항 기반) - 로드용
 * @param {Object} generationRequest - 생성 요청 데이터
 * @param {string} generationRequest.agent_node_id - Agent 노드 ID
 * @param {string} generationRequest.user_requirements - 사용자 요구사항
 * @param {string} generationRequest.workflow_name - 워크플로우 이름 (선택사항)
 * @param {string} generationRequest.selected_model - 선택된 모델 (선택사항)
 * @param {Object} generationRequest.context - 추가 컨텍스트
 * @returns {Promise<Object>} 생성된 워크플로우 데이터 (저장되지 않음, 로드용)
 */
export const generateWorkflowWithAI = async (generationRequest) => {
    try {
        devLog.log('=== 백엔드 워크플로우 자동생성 요청 ===');
        devLog.log('Agent 노드 ID:', generationRequest.agent_node_id);
        devLog.log('사용자 요구사항:', generationRequest.user_requirements);
        devLog.log('워크플로우 이름:', generationRequest.workflow_name);
        
        // 백엔드 API 호출 (범용적 로직 사용)
        const response = await apiClient(`${API_BASE_URL}/api/workflow/auto-generation/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agent_node_id: generationRequest.agent_node_id,
                user_requirements: generationRequest.user_requirements,
                workflow_name: generationRequest.workflow_name,
                selected_model: generationRequest.selected_model,
                context: generationRequest.context || {}
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.detail || `HTTP error! status: ${response.status}`);
        }

        devLog.log('=== 백엔드 워크플로우 자동생성 성공 ===');
        devLog.log('생성 결과:', result);
        devLog.log('생성된 노드 수:', result.generated_nodes_count);
        devLog.log('생성된 엣지 수:', result.generated_edges_count);
        devLog.log('성공 메시지:', result.message);
        
        return {
            success: result.success,
            message: result.message,
            workflow_data: result.workflow_data,
            workflow_name: result.workflow_name, // 백엔드에서 생성된/지정된 워크플로우 이름 전달
            generated_nodes_count: result.generated_nodes_count,
            generated_edges_count: result.generated_edges_count
        };
    } catch (error) {
        devLog.error('백엔드 워크플로우 자동생성 실패:', error);
        throw error;
    }
};


/**
 * 사용 가능한 Agent 노드 목록 조회
 * @returns {Promise<Array>} Agent 노드 목록
 */
export const getAvailableAgentNodes = async () => {
    try {
        devLog.log('사용 가능한 Agent 노드 목록 조회');
        
        const response = await apiClient(`${API_BASE_URL}/api/node/get`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const nodes = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        devLog.log('전체 노드 응답 구조:', nodes);
        devLog.log('전체 카테고리 수:', nodes.length);

        // Agent 노드만 필터링 - 중첩된 구조 처리
        const agentNodes = [];
        
        // 카테고리별로 순회
        nodes.forEach(category => {
            devLog.log('카테고리:', category.categoryName, '함수 수:', category.functions?.length || 0);
            
            if (category.functions) {
                category.functions.forEach(func => {
                    devLog.log('함수:', func.functionName, '노드 수:', func.nodes?.length || 0);
                    
                    // agents 함수의 모든 노드들을 Agent 노드로 간주
                    if (func.functionId === 'agents' && func.nodes) {
                        devLog.log('agents 함수 발견, 노드 수:', func.nodes.length);
                        func.nodes.forEach(node => {
                            devLog.log('Agent 노드 발견:', node.nodeName, node.id);
                            agentNodes.push(node);
                        });
                    }
                });
            }
        });

        devLog.log('Agent 노드 목록 조회 성공:', agentNodes.length);
        devLog.log('Agent 노드 목록:', agentNodes);
        return agentNodes;
    } catch (error) {
        devLog.error('Agent 노드 목록 조회 실패:', error);
        throw error;
    }
};

/**
 * 모든 노드 정보 조회 (시작/종료 노드 찾기용)
 * @returns {Promise<Array>} 모든 노드 정보
 */
export const getAllNodes = async () => {
    try {
        devLog.log('모든 노드 정보 조회');
        
        const response = await apiClient(`${API_BASE_URL}/api/node/get`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const nodes = await response.json();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return nodes;
    } catch (error) {
        devLog.error('모든 노드 정보 조회 실패:', error);
        throw error;
    }
};
