'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
    FiMessageSquare,
    FiRefreshCw,
    FiUser,
    FiPlay,
} from 'react-icons/fi';
import { listInteractions } from '@/app/api/interactionAPI';
import { deleteWorkflowIOLogs, listWorkflowsDetail } from '@/app/api/workflowAPI';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/chat/assets/ChatHistory.module.scss';
import toast from 'react-hot-toast';
import HistoryModal from './HistoryModal';
import useSidebarManager from '@/app/_common/hooks/useSidebarManager';

interface ExecutionMeta {
    id: string;
    interaction_id: string;
    workflow_id: string;
    workflow_name: string;
    interaction_count: number;
    metadata: any;
    created_at: string;
    updated_at: string;
    isWorkflowDeleted?: boolean; // 워크플로우가 삭제되었는지 여부
}

interface WorkflowDetail {
    user_id?: number;
    workflow_id: string;
    workflow_name: string;
    node_count: number;
    edge_count: number;
    has_startnode: boolean;
    has_endnode: boolean;
    is_completed: boolean;
    metadata?: Record<string, any>;
}

interface ChatHistoryProps {
    onSelectChat: (executionMeta: ExecutionMeta) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectChat }) => {

    const [chatList, setChatList] = useState<ExecutionMeta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'deleted'>('active');

    // HistoryModal 상태
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedChatForHistory, setSelectedChatForHistory] = useState<ExecutionMeta | null>(null);

    useSidebarManager(isHistoryModalOpen);

    useEffect(() => {
        loadChatHistory();
    }, []);

    // 필터링된 채팅 리스트
    const filteredChatList = chatList.filter(chat => {
        switch (filterStatus) {
            case 'active':
                return !chat.isWorkflowDeleted;
            case 'deleted':
                return chat.isWorkflowDeleted;
            case 'all':
            default:
                return true;
        }
    });

    // 각 상태별 개수
    const activeChatCount = chatList.filter(chat => !chat.isWorkflowDeleted).length;
    const deletedChatCount = chatList.filter(chat => chat.isWorkflowDeleted).length;
    const totalChatCount = chatList.length;

    const loadChatHistory = async () => {
        try {
            setLoading(true);
            setError(null);

            // 채팅 기록과 워크플로우 목록을 병렬로 가져오기
            const [interactionsResult, workflowsResult] = await Promise.all([
                listInteractions({ limit: 50 }),
                listWorkflowsDetail()
            ]);


            const chatList = (interactionsResult as any).execution_meta_list || [];
            const workflows = (workflowsResult as any) || [];

            // 각 채팅 기록에 대해 해당 워크플로우가 존재하는지 확인
            const enrichedChatList = chatList.map((chat: ExecutionMeta) => {
                // default_mode인 경우는 항상 사용 가능
                if (chat.workflow_name === 'default_mode') {
                    return {
                        ...chat,
                        isWorkflowDeleted: false
                    };
                }

                const workflowExists = workflows.some((workflow: WorkflowDetail) =>
                    // workflow.workflow_id === chat.workflow_id && workflow.workflow_name === chat.workflow_name
                    workflow.workflow_name === chat.workflow_name
                );

                return {
                    ...chat,
                    isWorkflowDeleted: !workflowExists
                };
            });

            setChatList(enrichedChatList);

            devLog.log('Chat history loaded:', interactionsResult);
            devLog.log('Workflows loaded:', workflowsResult);

            const deletedCount = enrichedChatList.filter((chat: ExecutionMeta) => chat.isWorkflowDeleted).length;
            if (deletedCount > 0) {
                devLog.warn(`Found ${deletedCount} chat(s) with deleted workflows`);
            }
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

    const truncateText = (text: string, maxLength: number = 15) => {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
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

    const handleDeleteChat = async (chat: ExecutionMeta) => {
        // 삭제 확인
        const confirmDelete = () => new Promise((resolve) => {
            toast((t) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                        <strong>"{chat.workflow_name}"</strong> 채팅을 정말 삭제하시겠습니까?
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(false);
                            }}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#6b7280',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                        <button
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(true);
                            }}
                            style={{
                                padding: '4px 12px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            삭제
                        </button>
                    </div>
                </div>
            ), {
                duration: Infinity,
                style: {
                    maxWidth: '400px',
                },
            });
        });

        try {
            const shouldDelete = await confirmDelete();
            if (!shouldDelete) return;

            // 삭제 API 호출
            await deleteWorkflowIOLogs(
                chat.workflow_name,
                chat.workflow_id,
                chat.interaction_id
            );

            toast.success(`"${chat.workflow_name}" 채팅이 삭제되었습니다.`);

            // 채팅 목록 새로고침
            await loadChatHistory();
        } catch (error) {
            devLog.error('Failed to delete chat:', error);
            toast.error('채팅 삭제에 실패했습니다.');
        }
    };

    const handleContinueChat = (chat: ExecutionMeta) => {
        // 워크플로우가 삭제된 경우 대화를 계속할 수 없음
        if (chat.isWorkflowDeleted) {
            toast.error('원본 워크플로우가 삭제되어 대화를 계속할 수 없습니다.');
            return;
        }

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

    const handleViewChatHistory = (chat: ExecutionMeta) => {
        setSelectedChatForHistory(chat);
        setIsHistoryModalOpen(true);
    };

    const handleCloseHistoryModal = () => {
        setIsHistoryModalOpen(false);
        setSelectedChatForHistory(null);
    };

    return (
        <>
            <div className={styles.chatContainer}>
                <div className={styles.workflowSection}>
                    <div className={styles.container}>
                        <div className={styles.header}>
                            <div className={styles.headerInfo}>
                                <h2>채팅 기록</h2>
                                <p>이전 대화를 선택하여 계속하거나 새로운 창에서 열어보세요.</p>
                            </div>

                            <div className={styles.headerControls}>
                                <div className={styles.filterTabs}>
                                    <button
                                        className={`${styles.filterTab} ${filterStatus === 'all' ? styles.active : ''}`}
                                        onClick={() => setFilterStatus('all')}
                                    >
                                        전체 ({totalChatCount})
                                    </button>
                                    <button
                                        className={`${styles.filterTab} ${filterStatus === 'active' ? styles.active : ''}`}
                                        onClick={() => setFilterStatus('active')}
                                    >
                                        활성 ({activeChatCount})
                                    </button>
                                    <button
                                        className={`${styles.filterTab} ${filterStatus === 'deleted' ? styles.active : ''}`}
                                        onClick={() => setFilterStatus('deleted')}
                                    >
                                        사용불가 ({deletedChatCount})
                                    </button>
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

                            {!loading && !error && filteredChatList.length === 0 && (
                                <div className={styles.emptyState}>
                                    <FiMessageSquare className={styles.emptyIcon} />
                                    {filterStatus === 'active' && (
                                        <>
                                            <h3>활성 채팅 기록이 없습니다</h3>
                                            <p>사용 가능한 채팅 기록이 없습니다.</p>
                                        </>
                                    )}
                                    {filterStatus === 'deleted' && (
                                        <>
                                            <h3>사용 불가능한 채팅 기록이 없습니다</h3>
                                            <p>원본 워크플로우가 삭제된 채팅이 없습니다.</p>
                                        </>
                                    )}
                                    {filterStatus === 'all' && (
                                        <>
                                            <h3>아직 채팅 기록이 없습니다</h3>
                                            <p>새로운 대화를 시작해보세요!</p>
                                        </>
                                    )}
                                </div>
                            )}

                            {!loading && !error && filteredChatList.length > 0 && (
                                <div className={styles.chatGrid}>
                                    {filteredChatList.map((chat) => (
                                        <div key={chat.id} className={styles.chatCard}>
                                            <div className={styles.cardHeader}>
                                                <h3 className={`${styles.workflowName} ${chat.isWorkflowDeleted ? styles.deletedWorkflow : ''}`}>
                                                    {truncateText(chat.metadata.placeholder || chat.workflow_name)}
                                                    {chat.isWorkflowDeleted && (
                                                        <span className={styles.deletedBadge}>원본 워크플로우 삭제됨</span>
                                                    )}
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
                                                        {chat.workflow_name === 'default_mode' ? '일반 채팅' : chat.workflow_name}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className={styles.cardActions}>
                                                <button
                                                    onClick={() => handleDeleteChat(chat)}
                                                    className={styles.selectButton}
                                                >
                                                    삭제
                                                </button>
                                                <button
                                                    onClick={() => chat.isWorkflowDeleted ? handleViewChatHistory(chat) : handleContinueChat(chat)}
                                                    className={`${styles.continueButton} ${chat.isWorkflowDeleted ? styles.viewHistoryButton : ''}`}
                                                    title={chat.isWorkflowDeleted ? '채팅 기록 보기' : '대화 계속하기'}
                                                >
                                                    <FiPlay />
                                                    {chat.isWorkflowDeleted ? '채팅 기록 보기' : '대화 계속하기'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* History Modal */}
            {selectedChatForHistory && (
                <HistoryModal
                    isOpen={isHistoryModalOpen}
                    onClose={handleCloseHistoryModal}
                    workflowId={selectedChatForHistory.workflow_id}
                    workflowName={selectedChatForHistory.workflow_name}
                    interactionId={selectedChatForHistory.interaction_id}
                />
            )}
        </>
    );
};

export default ChatHistory;
