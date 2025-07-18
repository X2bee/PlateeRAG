'use client';
import React, { useState } from 'react';
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

interface NewChatInterfaceProps {
    workflow: Workflow;
    onBack: () => void;
    onChatStarted?: () => void; // 채팅 시작 후 호출될 콜백
}

const NewChatInterface: React.FC<NewChatInterfaceProps> = ({ workflow, onBack, onChatStarted }) => {
    const [executing, setExecuting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [interactionId] = useState<string>(() => generateInteractionId());

    const executeWorkflow = async () => {
        if (!inputMessage.trim()) {
            return;
        }

        setError(null);
        setExecuting(true);

        const currentMessage = inputMessage;
        setInputMessage('');

        try {
            const result: any = await executeWorkflowNew({
                workflow_name: normalizeWorkflowName(workflow.name),
                workflow_id: workflow.id,
                interaction_id: interactionId,
                input_data: currentMessage,
            });

            // 현재 채팅 데이터를 localStorage에 저장
            const currentChatData = {
                interactionId: interactionId,
                workflowId: workflow.id,
                workflowName: normalizeWorkflowName(workflow.name),
                startedAt: new Date().toISOString(),
            };
            localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
            
            // 채팅 시작 후 CurrentChatInterface로 전환하도록 부모에게 알림
            if (onChatStarted) {
                onChatStarted();
            }
        } catch (err) {
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
                    <span>새 채팅</span>
                </div>
            </div>

            {/* Chat Area */}
            <div className={styles.chatContainer}>
                <div className={styles.messagesArea}>
                    <div className={styles.emptyState}>
                        <FiClock className={styles.emptyIcon} />
                        <h3>첫 대화를 시작해보세요!</h3>
                        <p>&quot;{workflow.name}&quot; 워크플로우가 준비되었습니다.</p>
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
