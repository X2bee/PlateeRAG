import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';
import { validateWorkflowName } from '@/app/_common/utils/workflowStorage';
import { runWorkflowStream } from '@/app/_common/api/workflow/workflowWebsocketClient';

/**
 * 워크플로우 데이터를 백엔드 서버에 저장합니다.
 * @param {string} workflowName - 워크플로우 식별자 (파일명으로 사용됨)
 * @param {Object} workflowContent - 저장할 워크플로우 데이터 (노드, 엣지, 뷰 정보 포함)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const saveWorkflow = async (workflowName, workflowContent, userId = null) => {
    try {
        // workflowName 유효성 검사 및 안전한 이름으로 변환
        workflowName = validateWorkflowName(workflowName);

        devLog.log('SaveWorkflow called with:');
        devLog.log('- workflowName (name):', workflowName);
        devLog.log('- workflowContent.id:', workflowContent.id);
        devLog.log('- userId:', userId);
        devLog.log(
            '- Full workflowContent keys:',
            Object.keys(workflowContent),
        );

        const requestBody = {
            workflow_name: workflowName,
            content: workflowContent,
        };

        if (userId !== null && (typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId)))) {
            requestBody.user_id = userId;
        }

        // apiClient가 자동으로 Authorization header와 X-User-ID header를 추가합니다
        const response = await apiClient(`${API_BASE_URL}/api/workflow/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
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
        devLog.error('WorkflowName that caused error:', workflowName);
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
 * @param {string} workflow_name - 로드할 워크플로우 ID (.json 확장자 포함/제외 모두 가능)
 * @returns {Promise<Object>} 워크플로우 데이터 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const loadWorkflow = async (workflow_name, user_id) => {
    try {
        // .json 확장자가 포함되어 있으면 제거
        const cleanWorkflowName = workflow_name.endsWith('.json')
            ? workflow_name.slice(0, -5)
            : workflow_name;

        devLog.log('Loading workflow with cleaned ID:', cleanWorkflowName);

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/load/${encodeURIComponent(cleanWorkflowName)}?user_id=${user_id}`,
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
        devLog.error('Workflow ID that failed:', workflow_name);
        throw error;
    }
};

/**
 * 백엔드에서 특정 워크플로우를 복제합니다.
 * @param {string} workflowName - 복제할 워크플로우 ID
 * @param {string|number} user_id - 원본 워크플로우의 사용자 ID
 * @returns {Promise<Object>} 복제 결과 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const duplicateWorkflow = async (workflowName, user_id) => {
    try {
        devLog.log('Duplicating workflow with ID:', workflowName);
        devLog.log('Original user ID:', user_id);

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/duplicate/${encodeURIComponent(workflowName)}?user_id=${user_id}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow duplicate response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow duplicate error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully duplicated workflow:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to duplicate workflow:', error);
        devLog.error('Workflow name that failed:', workflowName);
        throw error;
    }
};

/**
 * 백엔드에서 특정 워크플로우의 공유 설정을 업데이트합니다.
 * @param {string} workflowName - 업데이트할 워크플로우 이름
 * @param {Object} updateDict - 업데이트할 설정 딕셔너리
 * @param {boolean|null} updateDict.is_shared - 공유 여부
 * @param {string|null} updateDict.share_group - 공유 그룹
 * @param {boolean} updateDict.enable_deploy - 배포 활성화 여부
 * @returns {Promise<Object>} 업데이트 결과 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const updateWorkflow = async (workflowName, updateDict) => {
    try {
        devLog.log('Updating workflow with name:', workflowName);
        devLog.log('Update data:', updateDict);

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/update/${encodeURIComponent(workflowName)}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateDict),
            }
        );

        devLog.log('Workflow update response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow update error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully updated workflow:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to update workflow:', error);
        devLog.error('Workflow name that failed:', workflowName);
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
 * 특정 워크플로우의 실행 기록 데이터를 가져옵니다.
 * @param {string} IOID - 평가할 IO 로그 ID
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} interactionId - 상호작용 ID (선택사항, 기본값: "default")
 * @param {number} rating - 평가 점수 (1~5)
 * @returns {Promise<Object>} 실행 기록 데이터를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const rateWorkflowIOLog = async (IOID, workflowName, workflowId, interactionId = 'default', rating = 3) => {
    try {
        const params = new URLSearchParams({
            io_id: IOID,
            workflow_name: workflowName,
            workflow_id: workflowId,
            interaction_id: interactionId,
            rating: rating,
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/io_log/rating?${params}`,
            {
                method: 'POST',
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
 * @param {number|null} user_id - 워크플로우 작성자의 사용자 ID (선택사항)
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
    user_id = null,
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

        // user_id가 있으면 추가
        if (user_id !== null && user_id !== undefined) {
            requestBody.user_id = user_id;
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
 * @param {number|null} params.user_id - 워크플로우 작성자의 사용자 ID.
 * @param {function(string): void} params.onData - 데이터 조각(chunk)을 수신할 때마다 호출될 콜백.
 * @param {function(): void} params.onEnd - 스트림이 정상적으로 종료될 때 호출될 콜백.
 * @param {function(Error): void} params.onError - 오류 발생 시 호출될 콜백.
 * @param {function(): void} [params.onStart] - 스트림 시작 이벤트 수신 시 호출될 콜백.
 * @param {string|null} [params.sessionId] - 기존 WebSocket 세션이 있다면 재사용할 세션 ID.
 * @param {function(any): void} [params.onReady] - ready 이벤트를 수신했을 때 호출될 콜백.
 * @param {function(string, any): void} [params.onSessionEstablished] - 세션 ID가 확정되었을 때 호출될 콜백.
 * @returns {import('./workflowWebsocketClient').WorkflowStreamHandle} WebSocket 스트림 핸들
 */
export const executeWorkflowByIdStream = ({
    workflowName,
    workflowId,
    inputData = '',
    interactionId = 'default',
    selectedCollections = null,
    additional_params = null,
    user_id = null,
    onData,
    onEnd,
    onError,
    onStart,
    sessionId = null,
    onReady,
    onSessionEstablished,
}) => {
    const payload = {
        workflow_name: workflowName,
        workflow_id: workflowId,
        input_data: inputData,
        interaction_id: interactionId,
        selected_collections: selectedCollections,
    };

    if (user_id !== null && user_id !== undefined) {
        payload.user_id = user_id;
    }

    if (additional_params && typeof additional_params === 'object') {
        payload.additional_params = additional_params;
    }

    const normalizeContent = (content) => {
        if (content === null || content === undefined) return '';
        if (typeof content === 'string') return content;
        if (typeof content === 'object') return JSON.stringify(content);
        return String(content);
    };

    return runWorkflowStream({
        mode: 'execute',
        payload,
        sessionId,
        onSessionEstablished: (establishedSessionId, content) => {
            devLog.log('Workflow WS session established', establishedSessionId);
            onSessionEstablished?.(establishedSessionId, content);
        },
        callbacks: {
            onReady: (content) => {
                devLog.log('Workflow WS ready', content);
                onReady?.(content);
            },
            onStart: () => {
                devLog.log('Workflow WS start event received');
                onStart?.();
            },
            onData: (content) => {
                if (onData) {
                    try {
                        onData(normalizeContent(content));
                    } catch (err) {
                        devLog.error('Workflow WS onData handler error', err);
                    }
                }
            },
            onEnd: () => {
                devLog.log('Workflow WS end event received');
                onEnd?.();
            },
            onError: (error) => {
                devLog.error('Workflow WS error', error);
                onError?.(error);
            },
        },
    });
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

/**
 * 특정 워크플로우의 버전 목록을 가져옵니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {string|number} userId - 워크플로우 소유자의 사용자 ID
 * @returns {Promise<Array<Object>>} 워크플로우 버전 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listWorkflowVersions = async (workflowName, userId) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            user_id: userId
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/version/list?${params}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow version list response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to fetch workflow versions');
        }

        const result = await response.json();
        devLog.log('Successfully retrieved workflow versions:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to list workflow versions:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('User ID that failed:', userId);
        throw error;
    }
};

/**
 * 워크플로우의 현재 사용 버전을 변경합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {number} version - 변경할 버전 번호
 * @returns {Promise<Object>} 버전 변경 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const updateWorkflowVersion = async (workflowName, version) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            version: version
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/version/change?${params}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow version change response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to change workflow version');
        }

        const result = await response.json();
        devLog.log('Successfully changed workflow version:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to change workflow version:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Version that failed:', version);
        throw error;
    }
};

/**
 * 워크플로우 버전의 라벨 이름을 변경합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {number} version - 변경할 버전 번호
 * @param {string} newVersionLabel - 새로운 버전 라벨
 * @returns {Promise<Object>} 버전 라벨 변경 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const updateWorkflowVersionLabel = async (workflowName, version, newVersionLabel) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            version: version,
            new_version_label: newVersionLabel
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/version/label-name?${params}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow version label change response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to change workflow version label');
        }

        const result = await response.json();
        devLog.log('Successfully changed workflow version label:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to change workflow version label:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Version that failed:', version);
        devLog.error('New version label that failed:', newVersionLabel);
        throw error;
    }
};

/**
 * 워크플로우의 특정 버전을 삭제합니다.
 * @param {string} workflowName - 워크플로우 이름
 * @param {number} version - 삭제할 버전 번호
 * @returns {Promise<Object>} 버전 삭제 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteWorkflowVersion = async (workflowName, version) => {
    try {
        const params = new URLSearchParams({
            workflow_name: workflowName,
            version: version
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/delete/version?${params}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow version delete response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete workflow version');
        }

        const result = await response.json();
        devLog.log('Successfully deleted workflow version:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to delete workflow version:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Version that failed:', version);
        throw error;
    }
};

/**
 * 워크플로우 이름을 변경합니다.
 * @param {string} oldName - 기존 워크플로우 이름
 * @param {string} newName - 새로운 워크플로우 이름
 * @returns {Promise<Object>} 이름 변경 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const renameWorkflow = async (oldName, newName) => {
    try {
        const params = new URLSearchParams({
            old_name: oldName,
            new_name: newName
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/rename/workflow?${params}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow rename response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to rename workflow');
        }

        const result = await response.json();
        devLog.log('Successfully renamed workflow:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to rename workflow:', error);
        devLog.error('Old workflow name that failed:', oldName);
        devLog.error('New workflow name that failed:', newName);
        throw error;
    }
};

/**
 * 워크플로우를 스토어에 업로드합니다.
 * @param {string} workflowName - 업로드할 워크플로우 이름
 * @param {string} workflowUploadName - 업로드될 워크플로우 이름
 * @param {string} description - 워크플로우 설명
 * @param {Array<string>} tags - 워크플로우 태그 배열
 * @returns {Promise<Object>} 업로드 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const uploadWorkflowToStore = async (workflowName, workflowUploadName, description, tags) => {
    try {
        const params = new URLSearchParams({
            workflow_upload_name: workflowUploadName,
            description: description || '',
            tags: JSON.stringify(tags || [])
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/workflow/store/upload/${encodeURIComponent(workflowName)}?${params}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Workflow upload response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Workflow upload error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully uploaded workflow to store:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to upload workflow to store:', error);
        devLog.error('Workflow name that failed:', workflowName);
        devLog.error('Upload name that failed:', workflowUploadName);
        throw error;
    }
};
