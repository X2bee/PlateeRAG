'use client';
import React from 'react';
import { createPortal } from 'react-dom';
import styles from './AdminPromptExpandModal.module.scss';
import { IoCopy, IoClose, IoCalendar, IoPerson, IoCheckmark } from 'react-icons/io5';
import { showCopySuccessToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';

interface Prompt {
    id: number;
    prompt_uid: string;
    prompt_title: string;
    prompt_content: string;
    public_available: boolean;
    is_template: boolean;
    language: string;
    user_id?: string;
    username?: string;
    full_name?: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
}

interface AdminPromptExpandModalProps {
    prompt: Prompt;
    isOpen: boolean;
    onClose: () => void;
}

const AdminPromptExpandModal: React.FC<AdminPromptExpandModalProps> = ({ prompt, isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(prompt.prompt_content);
            showCopySuccessToastKo('클립보드에 복사되었습니다!');
            devLog.info(`Copied prompt (admin): ${prompt.prompt_title}`);
        } catch (err) {
            devLog.error('Failed to copy prompt (admin):', err);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const modalContent = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>{prompt.prompt_title}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        <IoClose />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.badgeSection}>
                        <span className={`${styles.badge} ${styles.language}`}>
                            {prompt.language.toUpperCase()}
                        </span>
                        {prompt.is_template && (
                            <span className={`${styles.badge} ${styles.template}`}>
                                템플릿
                            </span>
                        )}
                        {prompt.public_available ? (
                            <span className={`${styles.badge} ${styles.public}`}>
                                공개
                            </span>
                        ) : (
                            <span className={`${styles.badge} ${styles.private}`}>
                                비공개
                            </span>
                        )}
                    </div>

                    <div className={styles.contentSection}>
                        <div className={styles.sectionHeader}>
                            <h3 className={styles.sectionTitle}>프롬프트 내용</h3>
                            <button className={styles.copyButton} onClick={handleCopy}>
                                <IoCopy className={styles.copyIcon} />
                                복사
                            </button>
                        </div>
                        <div className={styles.contentBox}>
                            {prompt.prompt_content}
                        </div>
                    </div>

                    <div className={styles.metaSection}>
                        <h3 className={styles.sectionTitle}>상세 정보</h3>
                        <div className={styles.metaGrid}>
                            {prompt.user_id && (
                                <div className={styles.metaItem}>
                                    <div className={styles.metaLabel}>
                                        <IoPerson className={styles.metaIcon} />
                                        사용자 ID
                                    </div>
                                    <div className={styles.metaValue}>{prompt.user_id}</div>
                                </div>
                            )}
                            {prompt.username && (
                                <div className={styles.metaItem}>
                                    <div className={styles.metaLabel}>
                                        <IoPerson className={styles.metaIcon} />
                                        사용자명
                                    </div>
                                    <div className={styles.metaValue}>{prompt.username}</div>
                                </div>
                            )}
                            {prompt.full_name && (
                                <div className={styles.metaItem}>
                                    <div className={styles.metaLabel}>
                                        <IoPerson className={styles.metaIcon} />
                                        이름
                                    </div>
                                    <div className={styles.metaValue}>{prompt.full_name}</div>
                                </div>
                            )}
                            <div className={styles.metaItem}>
                                <div className={styles.metaLabel}>
                                    <IoCalendar className={styles.metaIcon} />
                                    생성일
                                </div>
                                <div className={styles.metaValue}>{formatDate(prompt.created_at)}</div>
                            </div>
                            <div className={styles.metaItem}>
                                <div className={styles.metaLabel}>
                                    <IoCalendar className={styles.metaIcon} />
                                    수정일
                                </div>
                                <div className={styles.metaValue}>{formatDate(prompt.updated_at)}</div>
                            </div>
                            <div className={styles.metaItem}>
                                <div className={styles.metaLabel}>문자 수</div>
                                <div className={styles.metaValue}>{prompt.prompt_content.length.toLocaleString()}</div>
                            </div>
                            <div className={styles.metaItem}>
                                <div className={styles.metaLabel}>
                                    <IoCheckmark className={styles.metaIcon} />
                                    템플릿
                                </div>
                                <div className={styles.metaValue}>
                                    {prompt.is_template ? '예' : '아니오'}
                                </div>
                            </div>
                            <div className={styles.metaItem}>
                                <div className={styles.metaLabel}>
                                    <IoCheckmark className={styles.metaIcon} />
                                    공개
                                </div>
                                <div className={styles.metaValue}>
                                    {prompt.public_available ? '예' : '아니오'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button className={styles.closeFooterButton} onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AdminPromptExpandModal;
