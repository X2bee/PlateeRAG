'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
    FiSend,
    FiMessageSquare,
    FiClock,
    FiArrowLeft,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { createNewChat, executeChatMessage } from '@/app/api/chatAPI';
import { generateInteractionId } from '@/app/api/interactionAPI';
import toast from 'react-hot-toast';

interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

interface ChatNewResponse {
    status: string;
    message: string;
    interaction_id: string;
    workflow_id: string;
    workflow_name: string;
    execution_meta: {
        interaction_id: string;
        interaction_count: number;
        workflow_id: string;
        workflow_name: string;
    };
    chat_response?: string;
    timestamp: string;
}

interface ChatExecutionResponse {
    status: string;
    message: string;
    user_input: string;
    ai_response: string;
    interaction_id: string;
    session_id: string;
    execution_meta: {
        interaction_id: string;
        interaction_count: number;
        workflow_id: string;
        workflow_name: string;
    };
    timestamp: string;
}

interface DefaultChatInterfaceProps {
    onBack?: () => void;
}

const DefaultChatInterface: React.FC<DefaultChatInterfaceProps> = ({ onBack }) => {
    const [ioLogs, setIOLogs] = useState<IOLog[]>([]);
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [pendingLogId, setPendingLogId] = useState<string | null>(null);
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [interactionId] = useState<string>(() => generateInteractionId('default_chat'));

    const messagesRef = useRef<HTMLDivElement>(null);

    // Default workflow 설정 (default_mode) - 일반 채팅용
    const defaultWorkflow = {
        id: 'default_mode',
        name: 'default_mode',
        filename: 'default_chat',
        author: 'System',
        nodeCount: 1,
        status: 'active' as const,
    };

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

        // 임시 메시지 추가
        setIOLogs((prev) => [
            ...prev,
            {
                log_id: tempId,
                workflow_name: '일반 채팅',
                workflow_id: defaultWorkflow.id,
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
            let result: ChatNewResponse | ChatExecutionResponse;

            if (isFirstMessage) {
                // workflow 검증
                if (defaultWorkflow.id !== 'default_mode' || defaultWorkflow.name !== 'default_mode') {
                    throw new Error('일반 채팅은 default_mode workflow만 사용 가능합니다.');
                }

                // 새로운 채팅 세션 생성
                result = await createNewChat({
                    interaction_id: interactionId,
                    input_data: currentMessage
                }) as ChatNewResponse;

                // 첫 번째 메시지 전송 시 현재 채팅 데이터를 localStorage에 저장
                const currentChatData = {
                    interactionId: result.interaction_id,
                    workflowId: result.workflow_id,
                    workflowName: result.workflow_name,
                    startedAt: result.timestamp || new Date().toISOString(),
                };
                localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
                setIsFirstMessage(false);
            } else {
                // workflow 검증
                if (defaultWorkflow.id !== 'default_mode' || defaultWorkflow.name !== 'default_mode') {
                    throw new Error('일반 채팅은 default_mode workflow만 사용 가능합니다.');
                }

                // 기존 채팅 세션 계속
                result = await executeChatMessage({
                    user_input: currentMessage,
                    interaction_id: interactionId,
                    workflow_id: defaultWorkflow.id,
                    workflow_name: defaultWorkflow.name
                }) as ChatExecutionResponse;
            }

            if (result.status === 'success') {
                // 결과로 임시 메시지 업데이트
                setIOLogs((prev) =>
                    prev.map((log) =>
                        String(log.log_id) === tempId
                            ? {
                                  ...log,
                                  output_data: isFirstMessage 
                                      ? (result as ChatNewResponse).chat_response || '채팅 세션이 시작되었습니다.'
                                      : (result as ChatExecutionResponse).ai_response || '',
                                  updated_at: result.timestamp || new Date().toISOString(),
                              }
                            : log,
                    ),
                );
                setPendingLogId(null);
                setTimeout(scrollToBottom, 100);
                toast.success(isFirstMessage ? '일반 채팅이 시작되었습니다!' : '메시지가 성공적으로 전송되었습니다!');
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
        } catch (err) {
            console.error('Default chat execution failed:', err);
            
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

    const handleSendMessage = async () => {
        const trimmedMessage = inputMessage.trim();
        if (!trimmedMessage || executing) return;
        
        await executeWorkflow();
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
                    {onBack && (
                        <button className={styles.backButton} onClick={onBack}>
                            <FiArrowLeft />
                        </button>
                    )}
                    <div>
                        <h2>일반 채팅</h2>
                        <p>AI와 자유롭게 대화해보세요</p>
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
                            <FiMessageSquare className={styles.emptyIcon} />
                            <h3>첫 대화를 시작해보세요!</h3>
                            <p>일반 채팅 모드가 준비되었습니다.</p>
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

                                {/* AI Response */}
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
                            일반 채팅을 실행 중입니다...
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

export default DefaultChatInterface;
