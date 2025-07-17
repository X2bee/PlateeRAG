'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
    FiSend,
    FiMessageSquare,
    FiClock,
    FiArrowLeft,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { executeWorkflowNew, generateInteractionId, normalizeWorkflowName } from '@/app/api/interactionAPI';
import toast from 'react-hot-toast';

interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
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
    const [interactionId] = useState<string>(() => generateInteractionId());

    const messagesRef = useRef<HTMLDivElement>(null);

    // Default workflow 설정 (default_mode)
    const defaultWorkflow = {
        id: 'default_chat',
        name: '일반_채팅',
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

    const executeWorkflow = async (inputData: string) => {
        try {
            setExecuting(true);
            setError(null);
            
            const tempLogId = `temp_${Date.now()}`;
            const tempLog: IOLog = {
                log_id: tempLogId,
                workflow_name: defaultWorkflow.name,
                workflow_id: defaultWorkflow.id,
                input_data: inputData,
                output_data: '',
                updated_at: new Date().toISOString()
            };
            
            setIOLogs(prev => [...prev, tempLog]);
            setPendingLogId(tempLogId);
            scrollToBottom();
            
            const result = await executeWorkflowNew({
                workflow_name: normalizeWorkflowName(defaultWorkflow.name),
                workflow_id: defaultWorkflow.id,
                input_data: inputData,
                interaction_id: interactionId
            });
            
            if ((result as any).success && (result as any).data) {
                const newLog: IOLog = {
                    log_id: (result as any).data.log_id || Date.now(),
                    workflow_name: defaultWorkflow.name,
                    workflow_id: defaultWorkflow.id,
                    input_data: inputData,
                    output_data: (result as any).data.output_data || '',
                    updated_at: new Date().toISOString()
                };
                
                setIOLogs(prev => prev.map(log => 
                    log.log_id === tempLogId ? newLog : log
                ));
                
                // 첫 번째 메시지 후 현재 채팅 데이터 저장
                if (isFirstMessage) {
                    const currentChatData = {
                        interactionId: interactionId,
                        workflowId: defaultWorkflow.id,
                        workflowName: defaultWorkflow.name,
                        startedAt: new Date().toISOString(),
                    };
                    localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
                    setIsFirstMessage(false);
                }
                
                toast.success('메시지가 성공적으로 전송되었습니다!');
            } else {
                throw new Error((result as any).error || 'Unknown error occurred');
            }
        } catch (err) {
            console.error('Workflow execution failed:', err);
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
