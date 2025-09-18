import { useState, useCallback, useRef } from 'react';
import { showLoadingToastKo, showErrorToastKo, dismissToastKo } from '@/app/_common/utils/toastUtilsKo';
import { executeWorkflowById, executeWorkflowByIdStream } from '@/app/_common/api/workflow/workflowAPI';
import { executeWorkflowByIdDeploy, executeWorkflowByIdStreamDeploy } from '@/app/_common/api/workflow/workflowDeployAPI';
import { generateInteractionId } from '@/app/_common/api/interactionAPI';
import { isStreamingWorkflowFromWorkflow } from '@/app/_common/utils/isStreamingWorkflow';
import { WorkflowData } from '@/app/canvas/types';
import { IOLog } from '../components/types';
import { devLog } from '@/app/_common/utils/logger';

interface UseWorkflowExecutionProps {
    workflow: any;
    existingChatData?: {
        interactionId: string;
        workflowId: string;
        workflowName: string;
    } | null;
    workflowContentDetail: WorkflowData | null;
    selectedCollection: string[];
    getValidAdditionalParams: () => Record<string, Record<string, any>> | null;
    user_id?: number | string;
    setIOLogs: React.Dispatch<React.SetStateAction<IOLog[]>>;
    scrollToBottom: () => void;
}

interface UseWorkflowExecutionReturn {
    executing: boolean;
    error: string | null;
    pendingLogId: string | null;
    executeWorkflow: (messageOverride?: string, inputMessage?: string) => Promise<void>;
    executeWorkflowDeploy: (messageOverride?: string, inputMessage?: string) => Promise<void>;
}

export const useWorkflowExecution = ({
    workflow,
    existingChatData,
    workflowContentDetail,
    selectedCollection,
    getValidAdditionalParams,
    user_id,
    setIOLogs,
    scrollToBottom
}: UseWorkflowExecutionProps): UseWorkflowExecutionReturn => {
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);

    // 공통 실행 로직
    const executeWorkflowCommon = useCallback(async (
        messageOverride: string | undefined,
        inputMessage: string | undefined,
        isDeploy: boolean = false
    ) => {
        devLog.log(`${isDeploy ? 'executeWorkflowDeploy' : 'executeWorkflow'} called`);

        if (executing) {
            dismissToastKo();
            showLoadingToastKo('이전 작업이 완료될 때까지 잠시만 기다려주세요.');
            return;
        }

        const currentMessage = messageOverride || inputMessage || '';
        if (!currentMessage.trim()) return;


        setExecuting(true);
        setError(null);
        const tempId = `pending-${Date.now()}`;
        setPendingLogId(tempId);

        setIOLogs((prev) => [
            ...prev,
            {
                log_id: tempId,
                workflow_name: workflow.name,
                workflow_id: workflow.id,
                input_data: currentMessage,
                output_data: '',
                updated_at: new Date().toISOString(),
            },
        ]);

        try {
            let isStreaming: boolean;
            if (workflow.name === 'default_mode') {
                isStreaming = true;
            } else {
                let workflowData = null;

                // localStorage에서 workflowContentDetail 가져오기 시도
                try {
                    const storedWorkflowData = localStorage.getItem('workflowContentDetail');
                    if (storedWorkflowData) {
                        workflowData = JSON.parse(storedWorkflowData);
                    }
                } catch (error) {
                    console.warn('Failed to load workflow data from localStorage:', error);
                }

                // state의 workflowContentDetail 사용
                if (!workflowData && workflowContentDetail) {
                    workflowData = workflowContentDetail;
                }

                if (!workflowData) {
                    throw new Error("워크플로우 데이터가 로드되지 않았습니다.");
                }

                isStreaming = await isStreamingWorkflowFromWorkflow(workflowData);
            }

            const { interactionId, workflowId, workflowName } = existingChatData || {
                interactionId: generateInteractionId(),
                workflowId: workflow.id,
                workflowName: workflow.name
            };

            if (!interactionId || !workflowId || !workflowName) {
                throw new Error("채팅 세션 정보가 유효하지 않습니다.");
            }

            if (isStreaming) {
                const streamParams = {
                    workflowName,
                    workflowId,
                    inputData: currentMessage,
                    interactionId,
                    selectedCollections: selectedCollection,
                    additional_params: getValidAdditionalParams(),
                    onData: (chunk: string) => {
                        setIOLogs((prev) =>
                            prev.map((log) =>
                                String(log.log_id) === tempId
                                    ? { ...log, output_data: (log.output_data || '') + chunk }
                                    : log
                            )
                        );
                        scrollToBottom();
                    },
                    onEnd: () => setPendingLogId(null),
                    onError: (err: Error) => { throw err; },
                };

                if (isDeploy) {
                    await executeWorkflowByIdStreamDeploy({
                        ...streamParams,
                        user_id: user_id,
                    });
                } else {
                    await executeWorkflowByIdStream({
                        ...streamParams,
                        user_id: user_id ? Number(user_id) : null,
                    });
                }
            } else {
                let result: any;
                if (isDeploy) {
                    result = await executeWorkflowByIdDeploy(
                        workflowName,
                        workflowId,
                        currentMessage,
                        interactionId,
                        selectedCollection,
                        user_id,
                        getValidAdditionalParams()
                    );
                } else {
                    result = await executeWorkflowById(
                        workflowName,
                        workflowId,
                        currentMessage,
                        interactionId,
                        selectedCollection,
                        getValidAdditionalParams() as any,
                        user_id ? Number(user_id) : null
                    );
                }

                setIOLogs((prev) =>
                    prev.map((log) =>
                        String(log.log_id) === tempId
                            ? {
                                ...log,
                                output_data: result.outputs
                                    ? JSON.stringify(result.outputs[0], null, 2)
                                    : result.message || '처리 완료'
                            }
                            : log
                    )
                );
                setPendingLogId(null);
            }
        } catch (err: any) {
            setIOLogs((prev) =>
                prev.map((log) =>
                    String(log.log_id) === tempId
                        ? { ...log, output_data: err.message || '메시지 처리 중 오류 발생' }
                        : log
                )
            );
            setPendingLogId(null);
            showErrorToastKo(err.message || '메시지 처리 중 오류가 발생했습니다.');
        } finally {
            dismissToastKo();
            setExecuting(false);
            // 실행 완료 후 스크롤은 ChatInterface에서 처리
        }
    }, [
        executing,
        workflow,
        existingChatData,
        workflowContentDetail,
        selectedCollection,
        getValidAdditionalParams,
        user_id,
        setIOLogs,
        scrollToBottom
    ]);

    const executeWorkflow = useCallback(async (messageOverride?: string, inputMessage?: string) => {
        await executeWorkflowCommon(messageOverride, inputMessage, false);
    }, [executeWorkflowCommon]);

    const executeWorkflowDeploy = useCallback(async (messageOverride?: string, inputMessage?: string) => {
        await executeWorkflowCommon(messageOverride, inputMessage, true);
    }, [executeWorkflowCommon]);

    return {
        executing,
        error,
        pendingLogId,
        executeWorkflow,
        executeWorkflowDeploy
    };
};
