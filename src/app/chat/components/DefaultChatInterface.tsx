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
        setTimeout(() => {
            if (messagesRef.current) {
                messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
            }
        }, 100);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        
        if (diffMinutes < 1) {
            return '방금 전';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}분 전`;
        } else {
            return date.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
    };

    /**
     * 일반 채팅을 시작하는 메서드 (첫 번째 메시지)
     */
    const startDefaultChat = async (inputData: string) => {
        try {
            setExecuting(true);
            setError(null);
            
            // workflow 검증
            if (defaultWorkflow.id !== 'default_mode' || defaultWorkflow.name !== 'default_mode') {
                throw new Error('일반 채팅은 default_mode workflow만 사용 가능합니다.');
            }
            
            const tempLogId = `temp_${Date.now()}`;
            const tempLog: IOLog = {
                log_id: tempLogId,
                workflow_name: '일반 채팅',
                workflow_id: defaultWorkflow.id,
                input_data: inputData,
                output_data: '',
                updated_at: new Date().toISOString()
            };
            
            setIOLogs(prev => [...prev, tempLog]);
            setPendingLogId(tempLogId);
            scrollToBottom();
            
            // 새로운 채팅 세션 생성
            const result = await createNewChat({
                interaction_id: interactionId,
                input_data: inputData
            }) as ChatNewResponse;
            
            if (result.status === 'success') {
                const newLog: IOLog = {
                    log_id: Date.now(),
                    workflow_name: '일반 채팅',
                    workflow_id: result.workflow_id,
                    input_data: inputData,
                    output_data: result.chat_response || '채팅 세션이 시작되었습니다.',
                    updated_at: result.timestamp || new Date().toISOString()
                };
                
                setIOLogs(prev => prev.map(log => 
                    log.log_id === tempLogId ? newLog : log
                ));
                
                // 첫 번째 메시지 후 현재 채팅 데이터 저장
                const currentChatData = {
                    interactionId: result.interaction_id,
                    workflowId: result.workflow_id,
                    workflowName: result.workflow_name,
                    startedAt: result.timestamp || new Date().toISOString(),
                };
                localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
                setIsFirstMessage(false);
                
                toast.success('일반 채팅이 시작되었습니다!');
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
        } catch (err) {
            console.error('Default chat start failed:', err);
            setError('일반 채팅 시작에 실패했습니다. 다시 시도해주세요.');
            
            // 실패한 임시 로그 제거
            setIOLogs(prev => prev.filter(log => log.log_id !== pendingLogId));
            
            toast.error('일반 채팅 시작에 실패했습니다.');
        } finally {
            setExecuting(false);
            setPendingLogId(null);
            scrollToBottom();
        }
    };

    /**
     * 일반 채팅을 이어나가는 메서드 (후속 메시지들)
     */
    const continueDefaultChat = async (inputData: string) => {
        try {
            setExecuting(true);
            setError(null);
            
            // workflow 검증
            if (defaultWorkflow.id !== 'default_mode' || defaultWorkflow.name !== 'default_mode') {
                throw new Error('일반 채팅은 default_mode workflow만 사용 가능합니다.');
            }
            
            const tempLogId = `temp_${Date.now()}`;
            const tempLog: IOLog = {
                log_id: tempLogId,
                workflow_name: '일반 채팅',
                workflow_id: defaultWorkflow.id,
                input_data: inputData,
                output_data: '',
                updated_at: new Date().toISOString()
            };
            
            setIOLogs(prev => [...prev, tempLog]);
            setPendingLogId(tempLogId);
            scrollToBottom();
            
            // 기존 채팅 세션 계속
            const result = await executeChatMessage({
                user_input: inputData,
                interaction_id: interactionId,
                workflow_id: defaultWorkflow.id,
                workflow_name: defaultWorkflow.name
            }) as ChatExecutionResponse;
            
            if (result.status === 'success') {
                const newLog: IOLog = {
                    log_id: Date.now(),
                    workflow_name: '일반 채팅',
                    workflow_id: result.execution_meta.workflow_id,
                    input_data: inputData,
                    output_data: result.ai_response || '',
                    updated_at: result.timestamp || new Date().toISOString()
                };
                
                setIOLogs(prev => prev.map(log => 
                    log.log_id === tempLogId ? newLog : log
                ));
                
                toast.success('메시지가 성공적으로 전송되었습니다!');
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
        } catch (err) {
            console.error('Default chat continuation failed:', err);
            setError('메시지 전송에 실패했습니다. 다시 시도해주세요.');
            
            // 실패한 임시 로그 제거
            setIOLogs(prev => prev.filter(log => log.log_id !== pendingLogId));
            
            toast.error('메시지 전송에 실패했습니다.');
        } finally {
            setExecuting(false);
            setPendingLogId(null);
            scrollToBottom();
        }
    };

    const executeWorkflow = async (inputData: string) => {
        // 첫 번째 메시지인지 확인하여 적절한 메서드 호출
        if (isFirstMessage) {
            await startDefaultChat(inputData);
        } else {
            await continueDefaultChat(inputData);
        }
    };

    const handleSendMessage = async () => {
        const trimmedMessage = inputMessage.trim();
        if (!trimmedMessage || executing) return;
        
        setInputMessage('');
        await executeWorkflow(trimmedMessage);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
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
                    {ioLogs.length === 0 ? (
                        <div className={styles.welcomeMessage}>
                            <FiMessageSquare className={styles.welcomeIcon} />
                            <h3>AI와 대화를 시작해보세요!</h3>
                            <p>아래 입력창에 메시지를 입력하고 전송하세요.</p>
                        </div>
                    ) : (
                        ioLogs.map((log) => (
                            <div key={log.log_id} className={styles.messageGroup}>
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
                                <div className={styles.aiMessage}>
                                    <div className={styles.messageContent}>
                                        {pendingLogId === log.log_id ? (
                                            <div className={styles.loadingDots}>
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        ) : (
                                            log.output_data || '응답을 기다리는 중...'
                                        )}
                                    </div>
                                    {log.output_data && (
                                        <div className={styles.messageTime}>
                                            {formatDate(log.updated_at)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {error && (
                    <div className={styles.errorMessage}>
                        {error}
                    </div>
                )}

                {/* Input Area */}
                <div className={styles.inputArea}>
                    <div className={styles.inputContainer}>
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="메시지를 입력하세요..."
                            className={styles.messageInput}
                            disabled={executing}
                            rows={1}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputMessage.trim() || executing}
                            className={`${styles.sendButton} ${executing ? styles.sending : ''}`}
                        >
                            <FiSend />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefaultChatInterface;
