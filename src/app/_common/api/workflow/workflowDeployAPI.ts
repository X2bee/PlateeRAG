import { apiClient } from "@/app/_common/api/helper/apiClient";
import { API_BASE_URL } from '@/app/config.js';
import { devLog } from "@/app/_common/utils/logger";
import { excuteWorkflowRequest } from "./types";
import { runWorkflowStream } from "@/app/_common/api/workflow/workflowWebsocketClient";

/**
 * 랜덤 8자리 영어+숫자 문자열 생성
 */
const generateRandomId = (): string => {
    try {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const shuffled = chars.split('').sort(() => Math.random() - 0.5).join('');
        return `deploy_${shuffled.slice(0, 8)}`;
    } catch (error) {
        devLog.error('Failed to generate random ID:', error);
        return 'deploy';
    }
};

/**
 * 백엔드에서 특정 워크플로우를 로드합니다.
 * @param {string} workflowId - 로드할 워크플로우 ID (.json 확장자 포함/제외 모두 가능)
 * @returns {Promise<Object>} 워크플로우 데이터 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const loadWorkflow = async (workflowId: string, user_id?: number | string | null): Promise<object> => {
    try {
        // .json 확장자가 포함되어 있으면 제거
        const cleanWorkflowId = workflowId.endsWith('.json')
            ? workflowId.slice(0, -5)
            : workflowId;

        devLog.log('Loading workflow with cleaned ID:', cleanWorkflowId);

        const response = await fetch(
            `${API_BASE_URL}/api/workflow/deploy/load/${user_id}/${encodeURIComponent(cleanWorkflowId)}`,
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
 * 워크플로우 이름과 ID를 기반으로 워크플로우를 실행합니다.
 * @param {string} workflowName - 워크플로우 이름 (.json 확장자 제외)
 * @param {string} workflowId - 워크플로우 ID
 * @param {string} inputData - 실행에 사용할 입력 데이터 (선택사항)
 * @param {string} interaction_id - 상호작용 ID (기본값: 'default')
 * @param {Array<string>|null} selectedCollections - 선택된 컬렉션 배열 (선택사항)
 * @returns {Promise<Object>} 실행 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const executeWorkflowByIdDeploy = async (
    workflowName: string,
    workflowId: string,
    inputData: string = '',
    interaction_id: string = '',
    selectedCollections: Array<string> | null = null,
    user_id: number | string | null = null,
    additional_params: Record<string, Record<string, any>> | null = null
): Promise<excuteWorkflowRequest> => {
    try {
        const requestBody: excuteWorkflowRequest = {
        workflow_name: workflowName,
        workflow_id: workflowId,
        input_data: inputData || '',
        interaction_id: generateRandomId(),
    };

        // selectedCollections가 배열이면 그대로 사용, 아니면 null
        if (selectedCollections && Array.isArray(selectedCollections) && selectedCollections.length > 0) {
            requestBody.selected_collections = selectedCollections;
        }

        if(user_id && user_id !== null && user_id !== undefined) {
            requestBody.user_id = user_id;
        }

        // additional_params가 있으면 추가
        if (additional_params && typeof additional_params === 'object') {
            requestBody.additional_params = additional_params;
        }

        const response = await apiClient(`${API_BASE_URL}/api/workflow/deploy/execute/based_id`, {
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
 * @param {function(): void} [params.onStart] - 스트림 시작 이벤트 수신 시 호출될 콜백.
 * @param {string|null} [params.sessionId] - 기존 WebSocket 세션이 있다면 재사용할 세션 ID.
 * @param {function(any): void} [params.onReady] - ready 이벤트를 수신했을 때 호출될 콜백.
 * @param {function(string, any): void} [params.onSessionEstablished] - 세션 ID가 확정되었을 때 호출될 콜백.
 * @returns {import('./workflowWebsocketClient').WorkflowStreamHandle} WebSocket 스트림 핸들
 */
export const executeWorkflowByIdStreamDeploy = ({
    workflowName,
    workflowId,
    inputData = '',
    interactionId = '',
    selectedCollections = null,
    user_id,
    additional_params = null,
    onData,
    onEnd,
    onError,
    onStart,
    sessionId = null,
    onReady,
    onSessionEstablished,
}: {
    workflowName: string;
    workflowId: string;
    inputData: string;
    interactionId: string;
    selectedCollections: Array<string> | null;
    user_id?: number | string | null;
    additional_params?: Record<string, Record<string, any>> | null;
    onData: (chunk: string) => void;
    onEnd: () => void;
    onError: (error: Error) => void;
    onStart?: () => void;
    sessionId?: string | null;
    onReady?: (content: any) => void;
    onSessionEstablished?: (sessionId: string, content: any) => void;
}) => {
    const payload: excuteWorkflowRequest = {
        workflow_name: workflowName,
        workflow_id: workflowId,
        input_data: inputData || '',
        interaction_id: interactionId || generateRandomId(),
        selected_collections: selectedCollections ?? null,
    };

    if (user_id !== null && user_id !== undefined) {
        payload.user_id = user_id;
    }

    if (additional_params && typeof additional_params === 'object') {
        payload.additional_params = additional_params;
    }

    const normalizeContent = (content: unknown): string => {
        if (content === null || content === undefined) return '';
        if (typeof content === 'string') return content;
        if (typeof content === 'object') return JSON.stringify(content);
        return String(content);
    };

    return runWorkflowStream({
        mode: 'deploy',
        payload,
        sessionId,
        onSessionEstablished: (establishedSessionId, content) => {
            devLog.log('Deploy workflow WS session established', establishedSessionId);
            onSessionEstablished?.(establishedSessionId, content);
        },
        callbacks: {
            onReady: (content) => {
                devLog.log('Deploy workflow WS ready', content);
                onReady?.(content);
            },
            onStart: () => {
                devLog.log('Deploy workflow WS start event received');
                onStart?.();
            },
            onData: (content) => {
                try {
                    onData(normalizeContent(content));
                } catch (err) {
                    devLog.error('Deploy workflow WS onData handler error', err);
                }
            },
            onEnd: () => {
                devLog.log('Deploy workflow WS end event received');
                onEnd();
            },
            onError: (error) => {
                devLog.error('Deploy workflow WS error', error);
                onError(error);
            },
        },
    });
};
