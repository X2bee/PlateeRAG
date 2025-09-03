'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    FiMessageSquare,
    FiSend,
    FiClock,
    FiTrash2,
} from 'react-icons/fi';
import {
    getWorkflowIOLogs,
    executeWorkflowById,
    deleteWorkflowIOLogs,
} from '@/app/api/workflow/workflowAPI';
import toast from 'react-hot-toast';
import styles from '@/app/admin/assets/playground/Executor.module.scss';
import {
    showLogDeleteConfirm,
    showDeleteSuccessToast,
    showDeleteErrorToast
} from '@/app/_common/utils/toastUtils';

interface Workflow {
    workflow_name: string;
    workflow_id: string;
    node_count: number;
    updated_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
}

interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

interface WorkflowPartsProps {
    workflow: Workflow | null;
}

const Executor: React.FC<WorkflowPartsProps> = ({ workflow }) => {
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(
        null,
    );
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [executorLoading, setExecutorLoading] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [deletingLogs, setDeletingLogs] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);

    const executorMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadExecutorLogs(workflow);
    }, [workflow]);

    useEffect(() => {
        scrollToBottom();
    }, [ioLogs]);

    const scrollToBottom = () => {
        if (executorMessagesRef.current) {
            executorMessagesRef.current.scrollTop =
                executorMessagesRef.current.scrollHeight;
        }
    };

    const loadExecutorLogs = async (workflow: Workflow | null) => {
        if (workflow) {
            try {
                setExecutorLoading(true);
                setError(null);
                const workflowName = workflow.workflow_name.replace('.json', '');
                const logs = await getWorkflowIOLogs(
                    workflowName,
                    workflow.workflow_id,
                );
                setIOLogs((logs as any).in_out_logs || []);
                setSelectedWorkflow(workflow);
                setPendingLogId(null); // 기존 임시 메시지 제거
            } catch (err) {
                setError('실행 로그를 불러오는데 실패했습니다.');
                setIOLogs([]);
            } finally {
                setExecutorLoading(false);
            }
        } else {
            setIOLogs([]);
            setSelectedWorkflow(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    // Handle log deletion with Toast confirmation (exactly like CompletedWorkflows)
    const clearWorkflowLogs = async () => {
        if (!selectedWorkflow) {
            return;
        }

        const workflowName = selectedWorkflow.workflow_name.replace('.json', '');

        showLogDeleteConfirm(
            'Execution Logs',
            workflowName,
            async () => {
                try {
                    setDeletingLogs(true);
                    setError(null);

                    const result = await deleteWorkflowIOLogs(
                        workflowName,
                        selectedWorkflow.workflow_id
                    );

                    // 성공 시 로그 목록 초기화
                    setIOLogs([]);
                    setPendingLogId(null);

                    // 성공 토스트 메시지
                    const deletedCount = (result as any).deleted_count || 0;
                    showDeleteSuccessToast({
                        itemName: workflowName,
                        itemType: 'execution logs',
                        count: deletedCount,
                        customMessage: `"${workflowName}" 워크플로우의 실행 로그가 성공적으로 삭제되었습니다! (${deletedCount}개 로그 제거됨)`,
                    });
                } catch (error) {
                    console.error('Failed to delete logs:', error);
                    setError('로그 삭제에 실패했습니다.');
                    showDeleteErrorToast({
                        itemName: workflowName,
                        itemType: 'execution logs',
                        error: error instanceof Error ? error : 'Unknown error',
                        customMessage: `실행 로그 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
                    });
                } finally {
                    setDeletingLogs(false);
                }
            }
        );
    };

    const executeWorkflow = async () => {
        if (!selectedWorkflow || !inputMessage.trim()) {
            return;
        }
        setError(null);
        setExecuting(true);
        const tempId = `pending-${Date.now()}`;
        setPendingLogId(tempId);
        setIOLogs((prev) => [
            ...prev,
            {
                log_id: tempId,
                workflow_name: selectedWorkflow.workflow_name.replace('.json', ''),
                workflow_id: selectedWorkflow.workflow_id,
                input_data: inputMessage,
                output_data: '',
                updated_at: new Date().toISOString(),
            },
        ]);
        setInputMessage('');
        try {
            const workflowName = selectedWorkflow.workflow_name.replace('.json', '');
            const result: any = await executeWorkflowById(
                workflowName,
                selectedWorkflow.workflow_id,
                inputMessage,
                'default', // interaction_id
                null, // selectedCollections - Executor에서는 컬렉션을 사용하지 않음
                null, // additional_params
                null, // user_id - admin에서는 현재 로그인한 사용자
            );
            setIOLogs((prev) =>
                prev.map((log) =>
                    String(log.log_id) === tempId
                        ? {
                              ...log,
                              output_data: result.outputs
                                  ? JSON.stringify(result.outputs)
                                  : result.message || '성공',
                              updated_at: new Date().toISOString(),
                          }
                        : log,
                ),
            );
            setPendingLogId(null);
        } catch (err) {
            setIOLogs((prev) =>
                prev.map((log) =>
                    String(log.log_id) === tempId
                        ? {
                              ...log,
                              output_data:
                                  err instanceof Error ? err.message : '실패',
                              updated_at: new Date().toISOString(),
                          }
                        : log,
                ),
            );
            setPendingLogId(null);
        } finally {
            setExecuting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey && !executing) {
            e.preventDefault();
            executeWorkflow();
        }
    };

    return (
        <>
            <div className={styles.executorPanel}>
                {!selectedWorkflow ? (
                    <div className={styles.placeholder}>
                        <h3>워크플로우를 선택하세요</h3>
                        <p>
                            왼쪽에서 워크플로우를 선택하면 실행 로그와 채팅
                            인터페이스가 표시됩니다.
                        </p>
                    </div>
                ) : executorLoading ? (
                    <div className={styles.executorLoading}>
                        <div className={styles.loadingSpinner}></div>
                        <span>실행 로그를 불러오는 중...</span>
                    </div>
                ) : (
                    <div className={styles.executorData}>
                        <div className={styles.executorHeader}>
                            <h3>
                                {selectedWorkflow.workflow_name.replace('.json', '')}{' '}
                                - 테스트 로그
                            </h3>
                            <div className={styles.headerActions}>
                                <div className={styles.logCount}>
                                    <FiMessageSquare />
                                    <span>{ioLogs.length}개의 로그</span>
                                </div>
                                {ioLogs.length > 0 && (
                                    <button
                                        className={styles.clearLogsBtn}
                                        onClick={clearWorkflowLogs}
                                        disabled={deletingLogs}
                                        title="로그 초기화"
                                    >
                                        <FiTrash2 />
                                        {deletingLogs ? '삭제 중...' : '로그 초기화'}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className={styles.executorContainer}>
                            <div
                                ref={executorMessagesRef}
                                className={styles.executorMessages}
                            >
                                {ioLogs.length === 0 ? (
                                    <div className={styles.emptyexecutorState}>
                                        <FiClock className={styles.emptyIcon} />
                                        <p>테스트를 실행한 기록이 없습니다.</p>
                                        <p>아래 채팅에서 테스트를 진행해 보세요.</p>
                                    </div>
                                ) : (
                                    ioLogs.map((log) => (
                                        <div
                                            key={log.log_id}
                                            className={styles.executorExchange}
                                        >
                                            <div className={styles.userMessage}>
                                                <div
                                                    className={
                                                        styles.messageContent
                                                    }
                                                >
                                                    {log.input_data}
                                                </div>
                                                <div
                                                    className={
                                                        styles.messageTime
                                                    }
                                                >
                                                    {formatDate(log.updated_at)}
                                                </div>
                                            </div>
                                            <div className={styles.botMessage}>
                                                <div
                                                    className={
                                                        styles.messageContent
                                                    }
                                                >
                                                    {String(log.log_id) ===
                                                        pendingLogId &&
                                                    executing &&
                                                    !log.output_data ? (
                                                        <div className={styles.typingIndicator}>
                                                            <span></span>
                                                            <span></span>
                                                            <span></span>
                                                        </div>
                                                    ) : (
                                                        log.output_data
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={styles.executorInputArea}>
                                <div className={styles.inputContainer}>
                                    <input
                                        type="text"
                                        placeholder="메시지를 입력하세요..."
                                        value={inputMessage}
                                        onChange={(e) =>
                                            setInputMessage(e.target.value)
                                        }
                                        onKeyPress={handleKeyPress}
                                        disabled={executing}
                                        className={styles.executorInput}
                                    />
                                    <button
                                        onClick={executeWorkflow}
                                        disabled={
                                            executing || !inputMessage.trim()
                                        }
                                        className={`${styles.sendButton} ${executing || !inputMessage.trim() ? styles.disabled : styles.active}`}
                                    >
                                        {executing ? (
                                            <div
                                                className={styles.loadingSpinner}
                                            ></div>
                                        ) : (
                                            <FiSend />
                                        )}
                                    </button>
                                </div>
                                {executing && (
                                    <p className={styles.executingNote}>
                                        워크플로우를 실행 중입니다...
                                    </p>
                                )}
                                {error && (
                                    <p className={styles.errorNote}>{error}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default Executor;
