'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../assets/PromptExpandModal.module.scss';
import {
    IoClose,
    IoCopy,
    IoCalendar,
    IoPerson,
    IoLanguage,
    IoCheckmark
} from 'react-icons/io5';

interface Prompt {
    id: number;
    prompt_uid: string;
    prompt_title: string;
    prompt_content: string;
    public_available: boolean;
    is_template: boolean;
    language: string;
    user_id?: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
}

interface PromptExpandModalProps {
    prompt: Prompt;
    isOpen: boolean;
    onClose: () => void;
}

const PromptExpandModal: React.FC<PromptExpandModalProps> = ({ prompt, isOpen, onClose }) => {
    const [copied, setCopied] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);

    // 애니메이션 상태 관리
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.keyCode === 27) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            // 배경 스크롤 방지
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    // 프롬프트 복사 핸들러
    const handleCopyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(prompt.prompt_content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy prompt:', err);
        }
    };

    // 배경 클릭시 모달 닫기
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={`${styles.modalOverlay} ${isAnimating ? styles.fadeIn : ''}`} onClick={handleBackdropClick}>
            <div className={`${styles.modalContainer} ${isAnimating ? styles.slideIn : ''}`}>
                {/* 모달 헤더 */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.promptTitle}>{prompt.prompt_title}</h2>
                        <div className={styles.promptMeta}>
                            <div className={styles.metaItem}>
                                <IoLanguage className={styles.metaIcon} />
                                <span>{prompt.language.toUpperCase()}</span>
                            </div>
                            <div className={styles.metaItem}>
                                <IoCalendar className={styles.metaIcon} />
                                <span>{formatDate(prompt.created_at)}</span>
                            </div>
                            {prompt.user_id && (
                                <div className={styles.metaItem}>
                                    <IoPerson className={styles.metaIcon} />
                                    <span>{prompt.user_id}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        title="닫기"
                    >
                        <IoClose />
                    </button>
                </div>

                {/* 모달 바디 */}
                <div className={styles.modalBody}>
                    <div className={styles.contentSection}>
                        <div className={styles.sectionHeader}>
                            <h3>프롬프트 내용</h3>
                            <button
                                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                                onClick={handleCopyPrompt}
                                title="프롬프트 복사"
                            >
                                {copied ? (
                                    <>
                                        <IoCheckmark className={styles.copyIcon} />
                                        복사됨
                                    </>
                                ) : (
                                    <>
                                        <IoCopy className={styles.copyIcon} />
                                        복사
                                    </>
                                )}
                            </button>
                        </div>
                        <div className={styles.promptContent}>
                            {prompt.prompt_content}
                        </div>
                    </div>

                    {/* 추가 정보 섹션 */}
                    <div className={styles.infoSection}>
                        <h3>추가 정보</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>문자수:</span>
                                <span className={styles.infoValue}>{prompt.prompt_content.length}자</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>템플릿:</span>
                                <span className={styles.infoValue}>
                                    {prompt.is_template ? '예' : '아니오'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>공개 상태:</span>
                                <span className={styles.infoValue}>
                                    {prompt.public_available ? '공개' : '비공개'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default PromptExpandModal;
