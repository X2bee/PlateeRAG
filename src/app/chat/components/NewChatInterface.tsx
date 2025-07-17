'use client';
import React, { useState, useRef } from 'react';
import {
    FiSend,
    FiArrowLeft,
    FiMessageSquare,
    FiClock,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { executeWorkflowNew, generateInteractionId, normalizeWorkflowName } from '@/app/api/interactionAPI';
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

interface NewChatInterfaceProps {
    workflow: Workflow;
    onBack: () => void;
}

const NewChatInterface: React.FC<NewChatInterfaceProps> = ({ workflow, onBack }) => {
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [interactionId] = useState<string>(() => generateInteractionId());

    const messagesRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
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

        // 첫 메시지 후에는 일반 대화 모드로 전환
        if (isFirstMessage) {
            setIsFirstMessage(false);
        }

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

        // 스크롤을 하단으로 이동
        setTimeout(scrollToBottom, 100);

        try {
            const result: any = await executeWorkflowNew({
                workflow_name: normalizeWorkflowName(workflow.name),
                workflow_id: workflow.id,
                interaction_id: interactionId,
                input_data: currentMessage,
            });

            // 첫 번째 메시지 전송 시 현재 채팅 데이터를 localStorage에 저장
            if (isFirstMessage) {
                const currentChatData = {
                    interactionId: interactionId,
                    workflowId: workflow.id,
                    workflowName: normalizeWorkflowName(workflow.name),
                    startedAt: new Date().toISOString(),
                };
                localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
                setIsFirstMessage(false);
            }

            // 결과로 임시 메시지 업데이트
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
            setPendingLogId(null);
            setTimeout(scrollToBottom, 100);
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
            setTimeout(scrollToBottom, 100);
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
                    <button className={styles.backButton} onClick={onBack}>
                        <FiArrowLeft />
                    </button>
                    <div>
                        <h2>{workflow.name}</h2>
                        <p>새로운 대화를 시작하세요</p>
                    </div>
                </div>
                <div className={styles.chatCount}>
                    <FiMessageSquare />
                    <span>{ioLogs.length}개의 대화</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatContainer}>
                <div ref={messagesRef} className={styles.messagesArea}>
                    {isFirstMessage ? (
                        <div className={styles.emptyState}>
                            <FiClock className={styles.emptyIcon} />
                            <h3>첫 대화를 시작해보세요!</h3>
                            <p>"{workflow.name}" 워크플로우가 준비되었습니다.</p>
                            <div className={styles.welcomeActions}>
                                <div className={styles.suggestionChips}>
                                    <button 
                                        className={styles.suggestionChip}
                                        onClick={() => setInputMessage('안녕하세요!')}
                                        disabled={executing}
                                    >
                                        안녕하세요!
                                    </button>
                                    <button 
                                        className={styles.suggestionChip}
                                        onClick={() => setInputMessage('도움이 필요해요')}
                                        disabled={executing}
                                    >
                                        도움이 필요해요
                                    </button>
                                    <button 
                                        className={styles.suggestionChip}
                                        onClick={() => setInputMessage('어떤 기능이 있나요?')}
                                        disabled={executing}
                                    >
                                        어떤 기능이 있나요?
                                    </button>
                                </div>
                            </div>
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
                            placeholder={isFirstMessage ? "첫 메시지를 입력하세요..." : "메시지를 입력하세요..."}
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
            </div>
        </div>
    );
};

export default NewChatInterface;
