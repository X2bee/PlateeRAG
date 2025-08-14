// Workflow Execution API - All workflow execution operations
import { devLog } from '@/app/_common/utils/logger';
import { withErrorHandler } from '@/app/_common/utils/apiErrorHandler';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '../apiClient';

/**
 * 워크플로우 이름과 ID를 기반으로 워크플로우를 실행합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} inputData - 실행에 사용할 입력 데이터 (선택사항)
 * @param {string} interaction_id - 상호작용 ID (기본값: 'default')
 * @param {Array<string>|null} selectedCollections - 선택된 컬렉션 배열 (선택사항)
 * @param {Object|null} additional_params - 추가 파라미터 (선택사항)
 * @param {boolean} isDeploy - 배포된 워크플로우 실행 여부 (기본값: false)
 * @param {number|string|null} user_id - 사용자 ID (배포용)
 * @returns {Promise<Object>} 실행 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _executeWorkflowById = async (
    workflowName,
    workflowId,
    inputData = '',
    interaction_id = 'default',
    selectedCollections = null,
    additional_params = null,
    isDeploy = false,
    user_id = null,
) => {
    const requestBody = {
        workflow_name: workflowName,
        workflow_id: workflowId,
        input_data: inputData || '',
        interaction_id: interaction_id || 'default',
    };

    // selectedCollections가 배열이면 그대로 사용, 아니면 null
    if (selectedCollections && Array.isArray(selectedCollections) && selectedCollections.length > 0) {
        requestBody.selected_collections = selectedCollections;
    }

    // 배포용 user_id 추가
    if (isDeploy && user_id && user_id !== null && user_id !== undefined) {
        requestBody.user_id = user_id;
    }

    // additional_params가 있으면 추가
    if (additional_params && typeof additional_params === 'object') {
        requestBody.additional_params = additional_params;
    }

    // URL 선택 (배포용 또는 일반용)
    const endpoint = isDeploy 
        ? `${API_BASE_URL}/api/workflow/deploy/execute/based_id`
        : `${API_BASE_URL}/api/workflow/execute/based_id`;

    const response = await apiClient(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    devLog.log('Workflow executed successfully:', result);
    return result;
};

export const executeWorkflowById = withErrorHandler(_executeWorkflowById, 'Failed to execute workflow');

/**
 * 배포된 워크플로우를 실행합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} inputData - 입력 데이터
 * @param {string} interaction_id - 상호작용 ID
 * @param {Array<string>|null} selectedCollections - 선택된 컬렉션
 * @param {number|string|null} user_id - 사용자 ID
 * @param {Object|null} additional_params - 추가 파라미터
 * @returns {Promise<Object>} 실행 결과
 */
export const executeWorkflowByIdDeploy = (
    workflowName,
    workflowId,
    inputData = '',
    interaction_id = 'default',
    selectedCollections = null,
    user_id = null,
    additional_params = null
) => executeWorkflowById(workflowName, workflowId, inputData, interaction_id, selectedCollections, additional_params, true, user_id);

/**
 * ID 기반 워크플로우를 스트리밍 방식으로 실행하고, 수신되는 데이터를 콜백으로 처리합니다.
 * @param {object} params - 실행에 필요한 파라미터 객체.
 * @param {string} params.workflowName - 워크플로우 이름.
 * @param {string} params.workflowId - 워크플로우 ID.
 * @param {string} params.inputData - 사용자 입력 데이터.
 * @param {string} params.interactionId - 상호작용 ID.
 * @param {Array<string>|null} params.selectedCollections - 선택된 컬렉션.
 * @param {Object|null} params.additional_params - 추가 파라미터.
 * @param {boolean} params.isDeploy - 배포된 워크플로우 실행 여부.
 * @param {number|string|null} params.user_id - 사용자 ID (배포용).
 * @param {function(string): void} params.onData - 데이터 조각(chunk)을 수신할 때마다 호출될 콜백.
 * @param {function(): void} params.onEnd - 스트림이 정상적으로 종료될 때 호출될 콜백.
 * @param {function(Error): void} params.onError - 오류 발생 시 호출될 콜백.
 */
const _executeWorkflowByIdStream = async ({
    workflowName,
    workflowId,
    inputData = '',
    interactionId = 'default',
    selectedCollections = null,
    additional_params = null,
    isDeploy = false,
    user_id = null,
    onData,
    onEnd,
    onError,
}) => {
    const requestBody = {
        workflow_name: workflowName,
        workflow_id: workflowId,
        input_data: inputData,
        interaction_id: interactionId,
    };

    // selectedCollections 처리
    if (selectedCollections && Array.isArray(selectedCollections) && selectedCollections.length > 0) {
        requestBody.selected_collections = selectedCollections;
    }

    // 배포용 user_id 추가
    if (isDeploy && user_id && user_id !== null && user_id !== undefined) {
        requestBody.user_id = user_id;
    }

    // additional_params가 있으면 추가
    if (additional_params && typeof additional_params === 'object') {
        requestBody.additional_params = additional_params;
    }

    // URL 선택 (배포용 또는 일반용)
    const endpoint = isDeploy 
        ? `${API_BASE_URL}/api/workflow/deploy/execute/based_id/stream`
        : `${API_BASE_URL}/api/workflow/execute/based_id/stream`;

    const response = await apiClient(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            onEnd();
            break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n\n');
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonData = line.substring(6);
                try {
                    const parsedData = JSON.parse(jsonData);
                    if (parsedData.type === 'data') {
                        onData(parsedData.content);
                    } else if (parsedData.type === 'end') {
                        onEnd();
                        return;
                    } else if (parsedData.type === 'error') {
                        throw new Error(parsedData.detail);
                    }
                } catch (e) {
                    devLog.error('Failed to parse stream data chunk:', jsonData, e);
                }
            }
        }
    }
};

export const executeWorkflowByIdStream = withErrorHandler(_executeWorkflowByIdStream, 'Failed to execute streaming workflow');

/**
 * 배포된 워크플로우를 스트리밍 방식으로 실행합니다.
 * @param {object} params - 실행 파라미터
 * @returns {Promise<void>}
 */
export const executeWorkflowByIdStreamDeploy = (params) => {
    return executeWorkflowByIdStream({
        ...params,
        isDeploy: true,
    });
};

/**
 * 워크플로우를 배치로 실행합니다.
 * @param {Object} batchRequest - 배치 실행 요청 객체
 * @param {string} batchRequest.workflowName - 워크플로우 이름
 * @param {string} batchRequest.workflowId - 워크플로우 ID
 * @param {Array} batchRequest.testCases - 테스트 케이스 배열
 * @param {number} batchRequest.batchSize - 배치 사이즈
 * @param {string} batchRequest.interactionId - 상호작용 ID
 * @param {Array<string>|null} batchRequest.selectedCollections - 선택된 컬렉션
 * @returns {Promise<Object>} 배치 실행 결과
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _executeWorkflowBatch = async (batchRequest) => {
    devLog.log('배치 실행 시작:', {
        workflowName: batchRequest.workflowName,
        workflowId: batchRequest.workflowId,
        testCaseCount: batchRequest.testCases.length,
        batchSize: batchRequest.batchSize
    });

    // 요청 데이터 구성 (백엔드 API 스펙에 맞춤)
    const requestBody = {
        workflow_name: batchRequest.workflowName,
        workflow_id: batchRequest.workflowId,
        test_cases: batchRequest.testCases.map(testCase => ({
            id: testCase.id,
            input: testCase.input,
            expected_output: testCase.expectedOutput || null
        })),
        batch_size: batchRequest.batchSize || 5,
        interaction_id: batchRequest.interactionId || 'batch_test',
        selected_collections: batchRequest.selectedCollections || null
    };

    // API 호출
    const response = await apiClient(`${API_BASE_URL}/api/workflow/execute/batch`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    devLog.log('배치 실행 완료:', {
        batchId: result.batch_id,
        totalCount: result.total_count,
        successCount: result.success_count,
        errorCount: result.error_count,
        totalExecutionTime: `${result.total_execution_time}ms`
    });

    return result;
};

export const executeWorkflowBatch = withErrorHandler(_executeWorkflowBatch, 'Failed to execute batch workflow');

/**
 * 배치 실행 상태를 조회합니다.
 * @param {string} batchId - 배치 ID
 * @returns {Promise<Object>} 배치 상태 정보
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
const _getBatchStatus = async (batchId) => {
    const response = await apiClient(`${API_BASE_URL}/api/workflow/batch/status/${batchId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
};

export const getBatchStatus = withErrorHandler(_getBatchStatus, 'Failed to get batch status');