'use client';
import React, { useState, useEffect } from 'react';
import {
    FiMessageSquare,
    FiRefreshCw,
    FiUser,
    FiPlay,
} from 'react-icons/fi';
import { listInteractions } from '@/app/api/interactionAPI';
import { devLog } from '@/app/utils/logger';
import styles from '@/app/chat/assets/ChatHistory.module.scss';
import toast from 'react-hot-toast';

interface ExecutionMeta {
    id: string;
    interaction_id: string;
    workflow_id: string;
    workflow_name: string;
    interaction_count: number;
    metadata: any;
    created_at: string;
    updated_at: string;
}

interface ChatHistoryProps {
    onSelectChat: (executionMeta: ExecutionMeta) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectChat }) => {
    const [chatList, setChatList] = useState<ExecutionMeta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadChatHistory();
    }, []);

    const loadChatHistory = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await listInteractions({ limit: 50 });
            setChatList((result as any).execution_meta_list || []);
            
            devLog.log('Chat history loaded:', result);
        } catch (err) {
            setError('채팅 기록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load chat history:', err);
            toast.error('채팅 기록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return date.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else if (diffDays === 1) {
            return '어제';
        } else if (diffDays < 7) {
            return `${diffDays}일 전`;
        } else {
            return date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const handleChatSelect = (chat: ExecutionMeta) => {
        // 선택한 채팅을 현재 채팅으로 설정
        const currentChatData = {
            interactionId: chat.interaction_id,
            workflowId: chat.workflow_id,
            workflowName: chat.workflow_name,
            startedAt: chat.created_at,
        };
        localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
        
        onSelectChat(chat);
        toast.success(`"${chat.workflow_name}" 대화를 현재 채팅으로 설정했습니다!`);
    };

    const handleContinueChat = (chat: ExecutionMeta) => {
        // 채팅을 현재 채팅으로 설정
        const currentChatData = {
            interactionId: chat.interaction_id,
            workflowId: chat.workflow_id,
            workflowName: chat.workflow_name,
            startedAt: chat.created_at,
        };
        localStorage.setItem('currentChatData', JSON.stringify(currentChatData));
        
        // onSelectChat을 통해 부모 컴포넌트에서 current-chat 모드로 변경
        onSelectChat(chat);
        toast.success(`"${chat.workflow_name}" 대화를 현재 채팅으로 설정했습니다!`);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerInfo}>
                    <h2>기존 채팅 불러오기</h2>
                    <p>이전 대화를 선택하여 계속하거나 새로운 창에서 열어보세요.</p>
                </div>
                <button
                    onClick={loadChatHistory}
                    className={`${styles.refreshButton} ${loading ? styles.loading : ''}`}
                    disabled={loading}
                    title="새로고침"
                >
                    <FiRefreshCw />
                    {loading ? '로딩 중...' : '새로고침'}
                </button>
            </div>

            <div className={styles.content}>
                {loading && (
                    <div className={styles.loadingState}>
                        <div className={styles.loadingSpinner}></div>
                        <p>채팅 기록을 불러오는 중...</p>
                    </div>
                )}

                {error && (
                    <div className={styles.errorState}>
                        <p>{error}</p>
                        <button onClick={loadChatHistory} className={styles.retryButton}>
                            다시 시도
                        </button>
                    </div>
                )}

                {!loading && !error && chatList.length === 0 && (
                    <div className={styles.emptyState}>
                        <FiMessageSquare className={styles.emptyIcon} />
                        <h3>아직 채팅 기록이 없습니다</h3>
                        <p>새로운 대화를 시작해보세요!</p>
                    </div>
                )}

                {!loading && !error && chatList.length > 0 && (
                    <div className={styles.chatGrid}>
                        {chatList.map((chat) => (
                            <div key={chat.id} className={styles.chatCard}>
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.workflowName}>
                                        {chat.metadata.placeholder || chat.workflow_name}
                                    </h3>
                                    <span className={styles.chatDate}>
                                        {formatDate(chat.updated_at)}
                                    </span>
                                </div>
                                
                                <div className={styles.cardMeta}>
                                    <div className={styles.metaItem}>
                                        <FiMessageSquare />
                                        <span>{chat.interaction_count}회 대화</span>
                                    </div>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span className={styles.interactionId}>
                                            {chat.workflow_name}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        onClick={() => handleChatSelect(chat)}
                                        className={styles.selectButton}
                                    >
                                        선택
                                    </button>
                                    <button
                                        onClick={() => handleContinueChat(chat)}
                                        className={styles.continueButton}
                                    >
                                        <FiPlay />
                                        대화 계속하기
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatHistory;
