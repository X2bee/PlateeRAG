'use client';
import React, { useState } from 'react';
import {
    FiSend,
    FiMessageSquare,
    FiClock,
    FiArrowLeft,
} from 'react-icons/fi';
import styles from '@/app/chat/assets/ChatInterface.module.scss';
import { createNewChat } from '@/app/api/chatAPI';
import { generateInteractionId } from '@/app/api/interactionAPI';
import toast from 'react-hot-toast';

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

interface DefaultChatInterfaceProps {
    onBack?: () => void;
    onChatStarted?: () => void;
}

const DefaultChatInterface: React.FC<DefaultChatInterfaceProps> = ({ onBack, onChatStarted }) => {
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [interactionId] = useState<string>(() => generateInteractionId('default_chat'));

    const defaultWorkflow = {
        id: 'default_mode',
        name: 'default_mode',
        filename: 'default_chat',
        author: 'System',
        nodeCount: 1,
        status: 'active' as const,
    };

    const executeWorkflow = async () => {
        if (!inputMessage.trim()) {
            return;
        }

        setError(null);
        setExecuting(true);

        const currentMessage = inputMessage;
        setInputMessage('');

        try {
            // workflow 검증
            if (defaultWorkflow.id !== 'default_mode' || defaultWorkflow.name !== 'default_mode') {
                throw new Error('일반 채팅은 default_mode workflow만 사용 가능합니다.');
            }

            // 새로운 채팅 세션 생성
            const result = await createNewChat({
                interaction_id: interactionId,
                input_data: currentMessage
            }) as ChatNewResponse;

            if (result.status === 'success') {
                // 현재 채팅 데이터를 localStorage에 저장
                const currentChatData = {
                    interactionId: result.interaction_id,
                    workflowId: result.workflow_id,
                    workflowName: result.workflow_name,
                    startedAt: result.timestamp || new Date().toISOString(),
                };
                localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
                
                // 채팅 시작 후 CurrentChatInterface로 전환하도록 부모에게 알림
                if (onChatStarted) {
                    onChatStarted();
                }
            } else {
                throw new Error(result.message || 'Unknown error occurred');
            }
        } catch (err) {
            console.error('Default chat execution failed:', err);
            setError(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
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
                    {onBack && (
                        <button className={styles.backButton} onClick={onBack}>
                            <FiArrowLeft />
                        </button>
                    )}
                    <div>
                        <h2>일반 채팅</h2>
                        <p>자유롭게 대화를 시작하세요</p>
                    </div>
                </div>
                <div className={styles.chatCount}>
                    <FiMessageSquare />
                    <span>새 채팅</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatContainer}>
                <div className={styles.messagesArea}>
                    <div className={styles.emptyState}>
                        <FiClock className={styles.emptyIcon} />
                        <h3>첫 대화를 시작해보세요!</h3>
                        <p>일반 채팅 모드로 자유롭게 대화할 수 있습니다.</p>
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
                </div>

                {/* Input Area */}
                <div className={styles.inputArea}>
                    <div className={styles.inputContainer}>
                        <input
                            type="text"
                            placeholder="첫 메시지를 입력하세요..."
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
                            채팅을 시작하는 중입니다...
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
