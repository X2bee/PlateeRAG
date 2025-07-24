'use client';
import React, { useState, useEffect } from 'react';
import { FiX, FiMessageSquare } from 'react-icons/fi';
import { getWorkflowIOLogs } from '@/app/api/workflowAPI';
import { MessageRenderer } from '@/app/_common/components/ChatParser';
import styles from '@/app/chat/assets/HistoryModal.module.scss';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    workflowId: string;
    workflowName: string;
    interactionId: string;
}

// ChatInterface.tsx와 동일한 IOLog 타입
interface IOLog {
    log_id: number | string;
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    output_data: string;
    updated_at: string;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
    isOpen,
    onClose,
    workflowId,
    workflowName,
    interactionId
}) => {
    const [logs, setLogs] = useState<IOLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && workflowId && workflowName && interactionId) {
            loadChatLogs();
        } else {
            // 모달이 닫힐 때 상태 초기화
            setLogs([]);
            setError(null);
        }
    }, [isOpen, workflowId, workflowName, interactionId]);

    const loadChatLogs = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[HistoryModal] Loading chat logs:', {
                workflowId,
                workflowName,
                interactionId
            });

            const result = await getWorkflowIOLogs(workflowName, workflowId, interactionId);
            console.log('[HistoryModal] API result:', result);

            if (result && (result as any).in_out_logs) {
                setLogs((result as any).in_out_logs);
                console.log('[HistoryModal] Logs loaded:', (result as any).in_out_logs);
            } else {
                setLogs([]);
                console.log('[HistoryModal] No logs found in response');
            }
        } catch (err) {
            setError('채팅 기록을 불러오는데 실패했습니다.');
            console.error('[HistoryModal] Failed to load chat logs:', err);
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

    const renderMessageContent = (content: string, isUserMessage: boolean = false) => {
        if (!content) return null;

        return (
            <MessageRenderer
                content={content}
                isUserMessage={isUserMessage}
            />
        );
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                        <h2>채팅 기록</h2>
                        <p>{workflowName === 'default_mode' ? '일반 채팅' : workflowName}</p>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading && (
                        <div className={styles.loadingState}>
                            <div className={styles.loadingSpinner}></div>
                            <p>채팅 기록을 불러오는 중...</p>
                        </div>
                    )}

                    {error && (
                        <div className={styles.errorState}>
                            <p>{error}</p>
                            <button onClick={loadChatLogs} className={styles.retryButton}>
                                다시 시도
                            </button>
                        </div>
                    )}

                    {!loading && !error && logs.length === 0 && (
                        <div className={styles.emptyState}>
                            <FiMessageSquare className={styles.emptyIcon} />
                            <h3>채팅 기록이 없습니다</h3>
                            <p>이 대화에 대한 기록을 찾을 수 없습니다.</p>
                        </div>
                    )}

                    {!loading && !error && logs.length > 0 && (
                        <div className={styles.chatContainer}>
                            <div className={styles.messagesArea}>
                                {logs.map((log) => (
                                    <div key={log.log_id} className={styles.messageExchange}>
                                        {/* 사용자 메시지 */}
                                        <div className={styles.userMessage}>
                                            <div className={styles.messageContent}>
                                                {renderMessageContent(log.input_data, true)}
                                            </div>
                                            <div className={styles.messageTime}>
                                                {formatDate(log.updated_at)}
                                            </div>
                                        </div>

                                        {/* AI 응답 */}
                                        {log.output_data && (
                                            <div className={styles.botMessage}>
                                                <div className={styles.messageContent}>
                                                    {renderMessageContent(log.output_data)}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HistoryModal;
