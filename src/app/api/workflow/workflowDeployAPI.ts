import { apiClient } from "@/app/api/apiClient";
import { API_BASE_URL } from '@/app/config.js';
import { devLog } from "@/app/_common/utils/logger";
import { excuteWorkflowRequest } from "./types";

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
    interaction_id: string = 'default',
    selectedCollections: Array<string> | null = null,
    user_id: number | string | null = null,
    additional_params: Record<string, Record<string, any>> | null = null
): Promise<excuteWorkflowRequest> => {
    try {
        const requestBody: excuteWorkflowRequest = {
            workflow_name: workflowName,
            workflow_id: workflowId,
            input_data: inputData || '',
            interaction_id: interaction_id || 'default',
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
 */
export const executeWorkflowByIdStreamDeploy = async ({
    workflowName,
    workflowId,
    inputData = '',
    interactionId = 'default',
    selectedCollections = null,
    user_id,
    additional_params = null,
    onData,
    onEnd,
    onError,
}: { workflowName: string;
    workflowId: string;
    inputData: string;
    interactionId: string;
    selectedCollections: Array<string> | null;
    user_id?: number | string | null;
    additional_params?: Record<string, Record<string, any>> | null;
    onData: (arg0: string) => void;
    onEnd: () => void;
    onError: (arg0: Error) => void; }) => {
    const requestBody: excuteWorkflowRequest = {
        workflow_name: workflowName,
        workflow_id: workflowId,
        input_data: inputData,
        interaction_id: interactionId,
    };

    try {
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
        const response = await apiClient(`${API_BASE_URL}/api/workflow/deploy/execute/based_id/stream`, {
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

        if (!response.body) {
            throw new Error('Response body is null.');
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
        onError(error as Error);
    }
};
