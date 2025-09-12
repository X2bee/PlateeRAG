import { useState, useCallback, useRef } from 'react';
import { showLoadingToastKo, showErrorToastKo, dismissToastKo } from '@/app/_common/utils/toastUtilsKo';
import { executeWorkflowById, executeWorkflowByIdStream } from '@/app/api/workflow/workflowAPI';
import { executeWorkflowByIdDeploy, executeWorkflowByIdStreamDeploy } from '@/app/api/workflow/workflowDeployAPI';
import { generateInteractionId } from '@/app/api/interactionAPI';
import { isStreamingWorkflowFromWorkflow } from '@/app/_common/utils/isStreamingWorkflow';
import { WorkflowData } from '@/app/canvas/types';
import { IOLog } from '../components/types';
import { devLog } from '@/app/_common/utils/logger';
import { SessionManager } from '../utils/sessionManager';

interface SessionData {
    sessionId: string;
    messages: IOLog[];
    workflow?: any;
    createdAt: string;
    lastActiveAt: string;
    interactionId?: string;
}

interface UseSessionWorkflowExecutionProps {
    sessionId: string;
    sessionData: SessionData;
    setSessionData: (data: SessionData) => void;
    setIOLogs: React.Dispatch<React.SetStateAction<IOLog[]>>;
    scrollToBottom: () => void;
    saveSessionToStorage: (data: SessionData) => void;
}

interface UseSessionWorkflowExecutionReturn {
    executing: boolean;
    error: string | null;
    pendingLogId: string | null;
    executeWorkflow: (inputMessage: string) => Promise<void>;
}

export const useSessionWorkflowExecution = ({
    sessionId,
    sessionData,
    setSessionData,
    setIOLogs,
    scrollToBottom,
    saveSessionToStorage
}: UseSessionWorkflowExecutionProps): UseSessionWorkflowExecutionReturn => {
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);

    const executeWorkflow = useCallback(async (inputMessage: string) => {
        devLog.log('Session workflow execution started:', sessionId, inputMessage);

        if (executing) {
            dismissToastKo();
            showLoadingToastKo('이전 작업이 완료될 때까지 잠시만 기다려주세요.');
            return;
        }

        if (!inputMessage.trim()) return;

        setExecuting(true);
        setError(null);
        const tempId = `session-${sessionId}-${Date.now()}`;
        setPendingLogId(tempId);

        // 현재 워크플로우 정보 (기본값은 일반 채팅)
        const workflow = sessionData.workflow || {
            id: "default_mode",
            name: "일반 채팅",
            description: "기본 대화 모드",
            author: "system",
            nodeCount: 0,
            status: 'active' as const,
        };

        // 사용자 메시지를 먼저 로그에 추가
        const userLog: IOLog = {
            log_id: tempId,
            workflow_name: workflow.name,
            workflow_id: workflow.id,
            input_data: inputMessage,
            output_data: '',
            updated_at: new Date().toISOString(),
        };

        setIOLogs((prev) => [...prev, userLog]);

        try {
            // 세션용 상호작용 ID 생성 또는 기존 것 사용
            let interactionId = sessionData.interactionId;
            if (!interactionId) {
                interactionId = `session-${sessionId}-${generateInteractionId()}`;
                // 세션 데이터에 interactionId 저장
                const updatedSessionData = {
                    ...sessionData,
                    interactionId,
                };
                setSessionData(updatedSessionData);
                saveSessionToStorage(updatedSessionData);
            }

            // 스트리밍 여부 확인 (기본 채팅은 항상 스트리밍)
            let isStreaming = true;
            if (workflow.name !== 'default_mode') {
                // 실제 워크플로우의 경우 스트리밍 여부 확인
                let workflowData = null;
                try {
                    const storedWorkflowData = localStorage.getItem('workflowContentDetail');
                    if (storedWorkflowData) {
                        workflowData = JSON.parse(storedWorkflowData);
                        isStreaming = await isStreamingWorkflowFromWorkflow(workflowData);
                    }
                } catch (error) {
                    devLog.warn('Failed to load workflow data:', error);
                    isStreaming = false;
                }
            }

            if (isStreaming) {
                // 스트리밍 실행
                const streamParams = {
                    workflowName: workflow.name,
                    workflowId: workflow.id,
                    inputData: inputMessage,
                    interactionId,
                    selectedCollections: [],
                    additional_params: null,
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
                    onEnd: () => {
                        setPendingLogId(null);
                        // 최종 로그를 세션 데이터에 저장
                        setIOLogs((currentLogs) => {
                            const finalLog = currentLogs.find(log => String(log.log_id) === tempId);
                            if (finalLog) {
                                const updatedSessionData: SessionData = {
                                    ...sessionData,
                                    messages: [...sessionData.messages, finalLog],
                                    lastActiveAt: new Date().toISOString(),
                                    interactionId,
                                };
                                setSessionData(updatedSessionData);
                                SessionManager.saveSessionData(updatedSessionData);
                            }
                            return currentLogs;
                        });
                    },
                    onError: (err: Error) => { 
                        throw err; 
                    },
                };

                await executeWorkflowByIdStream({
                    ...streamParams,
                    user_id: null,
                });
            } else {
                // 일반 실행
                const result = await executeWorkflowById(
                    workflow.name,
                    workflow.id,
                    inputMessage,
                    interactionId,
                    [], // selectedCollections
                    null, // additionalParams
                    null // user_id
                );

                let finalOutput = '처리 완료';
                
                if (result && typeof result === 'object') {
                    const resultObj = result as any;
                    if (resultObj.outputs && Array.isArray(resultObj.outputs) && resultObj.outputs.length > 0) {
                        try {
                            finalOutput = JSON.stringify(resultObj.outputs[0], null, 2);
                        } catch (error) {
                            finalOutput = String(resultObj.outputs[0]) || '출력 데이터';
                        }
                    } else if (resultObj.message) {
                        finalOutput = String(resultObj.message);
                    } else if (resultObj.result) {
                        finalOutput = String(resultObj.result);
                    }
                } else if (typeof result === 'string') {
                    finalOutput = result;
                }

                setIOLogs((prev) =>
                    prev.map((log) =>
                        String(log.log_id) === tempId
                            ? { ...log, output_data: finalOutput }
                            : log
                    )
                );

                // 세션 데이터 업데이트 및 저장
                const completedLog = { ...userLog, output_data: finalOutput };
                const updatedSessionData: SessionData = {
                    ...sessionData,
                    messages: [...sessionData.messages, completedLog],
                    lastActiveAt: new Date().toISOString(),
                    interactionId,
                };
                
                setSessionData(updatedSessionData);
                SessionManager.saveSessionData(updatedSessionData);
                setPendingLogId(null);
            }

        } catch (err: any) {
            const errorMessage = err.message || '메시지 처리 중 오류 발생';
            
            setIOLogs((prev) =>
                prev.map((log) =>
                    String(log.log_id) === tempId
                        ? { ...log, output_data: `❌ 오류: ${errorMessage}` }
                        : log
                )
            );
            
            setError(errorMessage);
            setPendingLogId(null);
            showErrorToastKo(errorMessage);
            devLog.error('Session workflow execution error:', err);

        } finally {
            dismissToastKo();
            setExecuting(false);
        }
    }, [
        executing,
        sessionId,
        sessionData,
        setSessionData,
        setIOLogs,
        scrollToBottom,
        saveSessionToStorage
    ]);

    return {
        executing,
        error,
        pendingLogId,
        executeWorkflow
    };
};