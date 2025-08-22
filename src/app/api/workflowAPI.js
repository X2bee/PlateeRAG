import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from './apiClient';

/**
 * 워크플로우 데이터를 백엔드 서버에 저장합니다.
 * @param {string} workflowName - 워크플로우 식별자 (파일명으로 사용됨)
 * @param {Object} workflowContent - 저장할 워크플로우 데이터 (노드, 엣지, 뷰 정보 포함)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const saveWorkflow = async (workflowName, workflowContent) => {
    try {
        devLog.log('SaveWorkflow called with:');
        devLog.log('- workflowName (name):', workflowName);
        devLog.log('- workflowContent.id:', workflowContent.id);
        devLog.log(
            '- Full workflowContent keys:',
            Object.keys(workflowContent),
        );

        // apiClient가 자동으로 Authorization header와 X-User-ID header를 추가합니다
        const response = await apiClient(`${API_BASE_URL}/api/workflow/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                workflow_name: workflowName,
                content: workflowContent,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        return result;
    } catch (error) {
        devLog.error('Failed to save workflow:', error);
        throw error;
    }
};

/**
 * 백엔드에서 저장된 워크플로우 목록을 가져옵니다.
 * @returns {Promise<Array<string>>} 워크플로우 파일명 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listWorkflows = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/workflow/list`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.workflows || [];
    } catch (error) {
        devLog.error('Failed to list workflows:', error);
        throw error;
    }
};

/**
 * 백엔드에서 저장된 워크플로우들의 상세 정보를 가져옵니다.
 * @returns {Promise<Array<Object>>} 워크플로우 상세 정보 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listWorkflowsDetail = async () => {
    try {
        // apiClient가 자동으로 Authorization header와 X-User-ID header를 추가합니다
        const response = await apiClient(`${API_BASE_URL}/api/workflow/list/detail`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.workflows || [];
    } catch (error) {
        devLog.error('Failed to list workflow details:', error);
        throw error;
    }
};

/**
 * 백엔드에서 특정 워크플로우를 로드합니다.
 * @param {string} workflowId - 로드할 워크플로우 ID (.json 확장자 포함/제외 모두 가능)
 * @returns {Promise<Object>} 워크플로우 데이터 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const loadWorkflow = async (workflowId) => {
    try {
        // .json 확장자가 포함되어 있으면 제거
        const cleanWorkflowId = workflowId.endsWith('.json')
            ? workflowId.slice(0, -5)
            : workflowId;

        devLog.log('Loading workflow with cleaned ID:', cleanWorkflowId);

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/load/${encodeURIComponent(cleanWorkflowId)}`,
        );

        devLog.log('Workflow load response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow load error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const workflowData = await response.json();
        devLog.log('Successfully loaded workflow data:', workflowData);
        return workflowData;
    } catch (error) {
        devLog.error('Failed to load workflow:', error);
        devLog.error('Workflow ID that failed:', workflowId);
        throw error;
    }
};

/**
 * 백엔드에서 특정 워크플로우를 삭제합니다.
 * @param {string} workflowId - 삭제할 워크플로우 ID (.json 확장자 제외)
 * @returns {Promise<Object>} 삭제 결과 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflow = async (workflowId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/delete/${encodeURIComponent(workflowId)}`,
            {
                method: 'DELETE',
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result;
    } catch (error) {
        devLog.error('Failed to delete workflow:', error);
        throw error;
    }
};

/**
 * 워크플로우 목록과 세부 정보를 가져옵니다.
 * @returns {Promise<Object>} 워크플로우 목록을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowList = async () => {
    try {
        // apiClient가 자동으로 Authorization header와 X-User-ID header를 추가합니다
        const response = await apiClient(`${API_BASE_URL}/api/workflow/list/detail`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Workflow list retrieved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get workflow list:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 성능 모니터링 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 성능 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowPerformance = async (workflowName, workflowId) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/performance?${params}`,
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
        devLog.log('Workflow performance data retrieved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get workflow performance:', error);
        throw error;
    }
};

/**
 * 워크플로우 내 각 노드별 로그 개수를 조회합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 노드별 로그 개수 데이터
 */
export const getWorkflowNodeCounts = async (workflowName, workflowId) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/performance/counts/${workflowName}/${workflowId}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        devLog.error('Failed to get node log counts:', error);
        throw error;
    }
};

/**
 * 파이 차트 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {number} limit - 분석할 최근 로그 개수
 * @returns {Promise<Object>} 파이 차트 데이터
 */
export const getPieChartData = async (workflowName, workflowId, limit) => {
    try {
        const params = new URLSearchParams({ limit });
        const response = await apiClient(`${API_BASE_URL}/api/performance/charts/pie/${workflowName}/${workflowId}?${params}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        devLog.error('Failed to get pie chart data:', error);
        throw error;
    }
};

/**
 * 바 차트 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {number} limit - 분석할 최근 로그 개수
 * @returns {Promise<Object>} 바 차트 데이터
 */
export const getBarChartData = async (workflowName, workflowId, limit) => {
    try {
        const params = new URLSearchParams({ limit });
        const response = await apiClient(`${API_BASE_URL}/api/performance/charts/bar/${workflowName}/${workflowId}?${params}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        devLog.error('Failed to get bar chart data:', error);
        throw error;
    }
};

/**
 * 라인 차트 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} workflowId - 워크플로우 ID
 * @param {number} limit - 분석할 최근 로그 개수
 * @returns {Promise<Object>} 라인 차트 데이터
 */
export const getLineChartData = async (workflowName, workflowId, limit) => {
    try {
        const params = new URLSearchParams({ limit });
        const response = await apiClient(`${API_BASE_URL}/api/performance/charts/line/${workflowName}/${workflowId}?${params}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        devLog.error('Failed to get line chart data:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 실행 기록 데이터를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} interactionId - 상호작용 ID (선택사항, 기본값: "default")
 * @returns {Promise<Object>} 실행 기록 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowIOLogs = async (workflowName, workflowId, interactionId = 'default') => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
            interaction_id: interactionId,
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/io_logs?${params}`,
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
        devLog.log('Workflow IO logs retrieved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to get workflow IO logs:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 실행 기록 데이터를 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} interactionId - 상호작용 ID (기본값: "default")
 * @returns {Promise<Object>} 삭제 결과 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowIOLogs = async (workflowName, workflowId, interactionId = 'default') => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
            interaction_id: interactionId,
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/io_logs?${params}`,
            {
                method: 'DELETE',
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
        devLog.log('Workflow IO logs deleted successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to delete workflow IO logs:', error);
        throw error;
    }
};

/**
 * 워크플로우 이름과 ID를 기반으로 워크플로우를 실행합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} inputData - 실행에 사용할 입력 데이터 (선택사항)
 * @param {string} interaction_id - 상호작용 ID (기본값: 'default')
 * @param {Array<string>|null} selectedCollections - 선택된 컬렉션 배열 (선택사항)
 * @returns {Promise<Object>} 실행 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const executeWorkflowById = async (
    workflowName,
    workflowId,
    inputData = '',
    interaction_id = 'default',
    selectedCollections = null,
    additional_params = null,
) => {
    try {
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

        // additional_params가 있으면 추가
        if (additional_params && typeof additional_params === 'object') {
            requestBody.additional_params = additional_params;
        }

        const response = await apiClient(`${API_BASE_URL}/api/workflow/execute/based_id`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        devLog.log('Workflow executed successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to execute workflow:', error);
        throw error;
    }
};

/**
 * ID 기반 워크플로우를 스트리밍 방식으로 실행하고, 수신되는 데이터를 콜백으로 처리합니다.
 * @param {object} params - 실행에 필요한 파라미터 객체.
 * @param {string} params.workflowName - 워크플로우 이름.
 * @param {string} params.workflowId - 워크플로우 ID.
 * @param {string} params.inputData - 사용자 입력 데이터.
 * @param {string} params.interactionId - 상호작용 ID.
 * @param {Array<string>|null} params.selectedCollections - 선택된 컬렉션.
 * @param {function(string): void} params.onData - 데이터 조각(chunk)을 수신할 때마다 호출될 콜백.
 * @param {function(): void} params.onEnd - 스트림이 정상적으로 종료될 때 호출될 콜백.
 * @param {function(Error): void} params.onError - 오류 발생 시 호출될 콜백.
 */
export const executeWorkflowByIdStream = async ({
    workflowName,
    workflowId,
    inputData = '',
    interactionId = 'default',
    selectedCollections = null,
    additional_params = null,
    onData,
    onEnd,
    onError,
}) => {
    const requestBody = {
        workflow_name: workflowName,
        workflow_id: workflowId,
        input_data: inputData,
        interaction_id: interactionId,
        selected_collections: selectedCollections,
    };

    // additional_params가 있으면 추가
    if (additional_params && typeof additional_params === 'object') {
        requestBody.additional_params = additional_params;
    }

    try {
        const response = await apiClient(`${API_BASE_URL}/api/workflow/execute/based_id/stream`, {
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
    } catch (error) {
        devLog.error('Failed to execute streaming workflow:', error);
        onError(error);
    }
};

/**
 * 워크플로우의 성능 데이터를 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @returns {Promise<Object>} 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowPerformance = async (workflowName, workflowId) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            workflow_id: workflowId,
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/performance?${params}`,
            {
                method: 'DELETE',
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
        devLog.log('Workflow performance data deleted successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to delete workflow performance data:', error);
        throw error;
    }
};

/**
 * 워크플로우를 테스터로 실행하며 실시간 진행 상황을 SSE로 스트리밍합니다.
 * @param {Object} testerRequest - 테스터 실행 요청 객체
 * @param {string} testerRequest.workflowName - 워크플로우 이름
 * @param {string} testerRequest.workflowId - 워크플로우 ID
 * @param {Array<Object>} testerRequest.testCases - 테스트 케이스 배열
 * @param {number} testerRequest.batchSize - 배치 크기 (기본값: 5)
 * @param {string} testerRequest.interactionId - 상호작용 ID (기본값: 'tester_test')
 * @param {Array<string>|null} testerRequest.selectedCollections - 선택된 컬렉션
 * @param {boolean} testerRequest.llmEvalEnabled - LLM 평가 활성화 여부 (기본값: false)
 * @param {string} testerRequest.llmEvalType - LLM 평가 종류 ('vLLM' | 'OpenAI')
 * @param {string} testerRequest.llmEvalModel - LLM 평가 모델명
 * @param {function(Object): void} onMessage - SSE 메시지를 수신할 때마다 호출될 콜백
 * @param {function(): void} onEnd - 스트림이 정상적으로 종료될 때 호출될 콜백
 * @param {function(Error): void} onError - 오류 발생 시 호출될 콜백
 * @returns {Promise<void>} 스트리밍 완료 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const executeWorkflowTesterStream = async ({
    workflowName,
    workflowId,
    testCases,
    batchSize = 5,
    interactionId = 'tester_test',
    selectedCollections = null,
    llmEvalEnabled = false,
    llmEvalType = 'OpenAI',
    llmEvalModel = 'gpt-4o',
    onMessage,
    onEnd,
    onError
}) => {
    try {
        devLog.log('테스터 스트리밍 실행 시작:', {
            workflowName,
            workflowId,
            testCaseCount: testCases.length,
            batchSize
        });

        // 요청 데이터 구성
        const requestBody = {
            workflow_name: workflowName,
            workflow_id: workflowId,
            test_cases: testCases.map(testCase => ({
                id: testCase.id,
                input: testCase.input,
                expected_output: testCase.expectedOutput || null
            })),
            batch_size: batchSize,
            interaction_id: interactionId,
            selected_collections: selectedCollections,
            llm_eval_enabled: llmEvalEnabled,
            llm_eval_type: llmEvalType,
            llm_eval_model: llmEvalModel
        };

        // SSE 스트리밍 API 호출
        const response = await apiClient(`${API_BASE_URL}/api/workflow/execute/tester/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        // 누적 버퍼 추가 - 불완전한 데이터를 저장
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                onEnd();
                break;
            }

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // 완전한 라인들을 찾아서 처리
            let lines = buffer.split('\n\n');

            // 마지막 라인은 불완전할 수 있으므로 버퍼에 보관
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() && line.startsWith('data: ')) {
                    const jsonData = line.substring(6).trim();
                    if (jsonData) {
                        try {
                            const parsedData = JSON.parse(jsonData);

                            // 메시지 타입에 따른 처리
                            switch (parsedData.type) {
                            case 'tester_start':
                                devLog.log('테스터 시작:', parsedData);
                                onMessage(parsedData);
                                break;
                            case 'group_start':
                                devLog.log(`테스터 그룹 ${parsedData.group_number} 시작`);
                                onMessage(parsedData);
                                break;
                            case 'test_result':
                                onMessage(parsedData);
                                break;
                            case 'progress':
                                devLog.log(`진행률: ${parsedData.progress}% (${parsedData.completed_count}/${parsedData.total_count})`);
                                onMessage(parsedData);
                                break;
                            case 'eval_start':
                                devLog.log('LLM 평가 시작:', parsedData);
                                onMessage(parsedData);
                                break;
                            case 'eval_result':
                                devLog.log(`LLM 평가 결과: 테스트 ${parsedData.test_id}, 점수: ${parsedData.llm_eval_score}`);
                                onMessage(parsedData);
                                break;
                            case 'eval_error':
                                devLog.error(`LLM 평가 오류: 테스트 ${parsedData.test_id}`, parsedData.error);
                                onMessage(parsedData);
                                break;
                            case 'eval_complete':
                                devLog.log('LLM 평가 완료:', parsedData);
                                onMessage(parsedData);
                                break;
                            case 'tester_complete':
                                devLog.log('테스터 완료:', parsedData);
                                onMessage(parsedData);
                                onEnd();
                                return;
                            case 'error':
                                devLog.error('테스터 실행 오류:', parsedData);
                                throw new Error(parsedData.error || parsedData.message);
                            default:
                                onMessage(parsedData);
                                break;
                        }
                        } catch (parseError) {
                            devLog.error('SSE 데이터 파싱 실패:', jsonData, parseError);
                        }
                    }
                }
            }
        }
    } catch (error) {
        devLog.error('테스터 스트리밍 실행 실패:', error);
        onError(error);
    }
};

/**
 * 특정 워크플로우의 테스터 실행 IO 로그를 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @returns {Promise<Object>} interaction_batch_id별로 그룹화된 IO 로그 데이터
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const getWorkflowTesterIOLogs = async (workflowName) => {
    try {
        devLog.log('getWorkflowTesterIOLogs called with:');
        devLog.log('- workflowName:', workflowName);

        const response = await apiClient(`${API_BASE_URL}/api/workflow/tester/io_logs?workflow_name=${encodeURIComponent(workflowName)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tester IO logs retrieved successfully:', {
            workflowName: result.workflow_name,
            batchGroupsCount: result.response_data_list?.length || 0
        });

        return result;
    } catch (error) {
        devLog.error('Failed to get workflow tester IO logs:', error);
        throw error;
    }
};

/**
 * 특정 워크플로우의 테스터 실행 IO 로그를 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string} interactionBatchId - 삭제할 interaction_batch_id
 * @returns {Promise<Object>} 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowTesterIOLogs = async (workflowName, interactionBatchId) => {
    try {
        devLog.log('deleteWorkflowTesterIOLogs called with:');
        devLog.log('- workflowName:', workflowName);
        devLog.log('- interactionBatchId:', interactionBatchId);

        const params = new URLSearchParams({
            workflow_name: workflowName,
            interaction_batch_id: interactionBatchId,
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/tester/io_logs?${params}`,
            {
                method: 'DELETE',
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
        devLog.log('Tester IO logs deleted successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to delete workflow tester IO logs:', error);
        throw error;
    }
};
