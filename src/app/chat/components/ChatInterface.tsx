'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FiSend,
    FiArrowLeft,
    FiMessageSquare,
    FiClock,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { getWorkflowIOLogs, executeWorkflowById } from '@/app/api/workflowAPI';
import { executeChatMessage } from '@/app/api/chatAPI';
import toast from 'react-hot-toast';

interface Workflow {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    lastModified?: string;
    author: string;
    nodeCount: number;
    status: 'active' | 'draft' | 'archived';
    filename?: string;
    error?: string;
}

interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

interface ChatInterfaceProps {
    workflow: Workflow;
    onBack: () => void;
    hideBackButton?: boolean;
    existingChatData?: {
        interactionId: string;
        workflowId: string;
        workflowName: string;
    } | null;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ workflow, onBack, hideBackButton = false, existingChatData }) => {
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);

    const messagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (workflow?.id && existingChatData?.interactionId) {
            loadChatLogs();
        }
    }, [workflow?.id, existingChatData?.interactionId, existingChatData?.workflowId]);

    useEffect(() => {
        scrollToBottom();
    }, [ioLogs]);

    const scrollToBottom = () => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    };

    const loadChatLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const interactionId = existingChatData?.interactionId || 'default';
            const workflowName = existingChatData?.workflowName || workflow.name;
            const workflowId = existingChatData?.workflowId || workflow.id;
            
            const logs = await getWorkflowIOLogs(workflowName, workflowId, interactionId);
            setIOLogs((logs as any).in_out_logs || []);
            setPendingLogId(null);
        } catch (err) {
            setError('채팅 기록을 불러오는데 실패했습니다.');
            setIOLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const executeWorkflow = async () => {
        if (!inputMessage.trim()) {
            return;
        }

        setError(null);
        setExecuting(true);
        const tempId = `pending-${Date.now()}`;
        setPendingLogId(tempId);

        // 임시 메시지 추가
        setIOLogs((prev) => [
            ...prev,
            {
                log_id: tempId,
                workflow_name: workflow.name,
                workflow_id: workflow.id,
                input_data: inputMessage,
                output_data: '',
                updated_at: new Date().toISOString(),
            },
        ]);

        const currentMessage = inputMessage;
        setInputMessage('');

        try {
            // existingChatData가 있으면 해당 interaction_id 사용
            const interactionId = existingChatData?.interactionId || 'default';
            const workflowName = existingChatData?.workflowName || workflow.name;
            const workflowId = existingChatData?.workflowId || workflow.id;
            
            let result: any;
            
            // default_mode인 경우 chatAPI의 executeChatMessage 사용
            if (workflowId === 'default_mode' && workflowName === 'default_mode') {
                result = await executeChatMessage({
                    user_input: currentMessage,
                    interaction_id: interactionId,
                    workflow_id: workflowId,
                    workflow_name: workflowName
                });
                
                // 결과로 임시 메시지 업데이트 (chatAPI 응답 형식)
                setIOLogs((prev) =>
                    prev.map((log) =>
                        String(log.log_id) === tempId
                            ? {
                                  ...log,
                                  output_data: result.ai_response || '응답을 받았습니다.',
                                  updated_at: result.timestamp || new Date().toISOString(),
                              }
                            : log,
                    ),
                );
                
                toast.success('메시지가 성공적으로 전송되었습니다!');
            } else {
                // 기존 방식: executeWorkflowById 사용
                result = await executeWorkflowById(
                    workflowName,
                    workflowId,
                    currentMessage,
                    interactionId,
                );

                // 결과로 임시 메시지 업데이트 (기존 방식)
                setIOLogs((prev) =>
                    prev.map((log) =>
                        String(log.log_id) === tempId
                            ? {
                                  ...log,
                                  output_data: result.outputs
                                      ? JSON.stringify(result.outputs)
                                      : result.message || '처리 완료',
                                  updated_at: new Date().toISOString(),
                              }
                            : log,
                    ),
                );
            }
            
            setPendingLogId(null);
            
            // 기존 채팅 데이터가 있는 경우 localStorage 업데이트
            if (existingChatData) {
                const currentChatData = {
                    interactionId: existingChatData.interactionId,
                    workflowId: existingChatData.workflowId,
                    workflowName: existingChatData.workflowName,
                    startedAt: new Date().toISOString(),
                };
                localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
            }
        } catch (err) {
            // 에러로 임시 메시지 업데이트
            setIOLogs((prev) =>
                prev.map((log) =>
                    String(log.log_id) === tempId
                        ? {
                              ...log,
                              output_data: err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.',
                              updated_at: new Date().toISOString(),
                          }
                        : log,
                ),
            );
            setPendingLogId(null);
            toast.error('메시지 처리 중 오류가 발생했습니다.');
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
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    {!hideBackButton && (
                        <button className={styles.backButton} onClick={onBack}>
                            <FiArrowLeft />
                        </button>
                    )}
                    <div>
                        <h2>{workflow.name}</h2>
                        <p>{hideBackButton ? '현재 채팅을 계속하세요' : '기존 대화를 계속하세요'}</p>
                    </div>
                </div>
                <div className={styles.chatCount}>
                    <FiMessageSquare />
                    <span>{ioLogs.length}개의 대화</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatContainer}>
                {loading ? (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>채팅 기록을 불러오는 중...</p>
                    </div>
                ) : (
                    <>
                        <div ref={messagesRef} className={styles.messagesArea}>
                            {ioLogs.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FiClock className={styles.emptyIcon} />
                                    <h3>대화 기록이 없습니다</h3>
                                    <p>&quot;{workflow.name}&quot; 워크플로우의 이전 대화를 불러올 수 없습니다.</p>
                                    <p>새로운 대화를 시작해보세요.</p>
                                </div>
                            ) : (
                                ioLogs.map((log) => (
                                    <div key={log.log_id} className={styles.messageExchange}>
                                        {/* User Message */}
                                        <div className={styles.userMessage}>
                                            <div className={styles.messageContent}>
                                                {log.input_data}
                                            </div>
                                            <div className={styles.messageTime}>
                                                {formatDate(log.updated_at)}
                                            </div>
                                        </div>

                                        {/* Bot Message */}
                                        <div className={styles.botMessage}>
                                            <div className={styles.messageContent}>
                                                {String(log.log_id) === pendingLogId && executing && !log.output_data ? (
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

                        {/* Input Area */}
                        <div className={styles.inputArea}>
                            <div className={styles.inputContainer}>
                                <input
                                    type="text"
                                    placeholder="메시지를 입력하세요..."
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    disabled={executing}
                                    className={styles.messageInput}
                                />
                                <button
                                    onClick={executeWorkflow}
                                    disabled={executing || !inputMessage.trim()}
                                    className={`${styles.sendButton} ${executing || !inputMessage.trim() ? styles.disabled : ''}`}
                                >
                                    {executing ? (
                                        <div className={styles.miniSpinner}></div>
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
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatInterface;
