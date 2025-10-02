'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/manager/assets/ManagerWorkflowLogsContent.module.scss';

interface ManagerWorkflowChatLogsDetailModalProps {
    isOpen: boolean;
    content: string | null;
    onClose: () => void;
}

const ManagerWorkflowChatLogsDetailModal: React.FC<ManagerWorkflowChatLogsDetailModalProps> = ({
    isOpen,
    content,
    onClose
}) => {
    const handleCopy = async () => {
        if (content) {
            try {
                await navigator.clipboard.writeText(content);
                // 복사 성공 피드백을 위해 간단한 알림
                alert('내용이 복사되었습니다.');
            } catch (err) {
                console.error('복사 실패:', err);
                alert('복사에 실패했습니다.');
            }
        }
    };

    if (!isOpen || !content) return null;

    return createPortal(
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h4>전체 내용</h4>
                    <button className={styles.modalCloseButton} onClick={onClose}>
                        ×
                    </button>
                </div>
                <div className={styles.modalBody}>
                    <pre className={styles.modalText}>{content}</pre>
                </div>
                <div className={styles.modalFooter}>
                    <button
                        className={styles.copyButton}
                        onClick={handleCopy}
                        title="복사"
                    >
                        복사
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ManagerWorkflowChatLogsDetailModal;
