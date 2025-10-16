'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/app/main/workflowSection/assets/PromptCreateModal.module.scss';
import {
    IoClose,
    IoCheckmark,
    IoLanguage,
    IoLockClosed,
    IoGlobe
} from 'react-icons/io5';
import { updatePrompt } from '@/app/_common/api/promptAPI';
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

interface PromptEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void; // 프롬프트 수정 성공 후 콜백
    prompt: Prompt; // 수정할 프롬프트 데이터
}

interface FormData {
    prompt_title: string;
    prompt_content: string;
    public_available: boolean;
    language: 'ko' | 'en';
}

const PromptEditModal: React.FC<PromptEditModalProps> = ({ isOpen, onClose, onSuccess, prompt }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        prompt_title: '',
        prompt_content: '',
        public_available: false,
        language: 'ko'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<FormData>>({});

    // 애니메이션 상태 관리
    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
        }
    }, [isOpen]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.keyCode === 27 && !isSubmitting) {
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
    }, [isOpen, onClose, isSubmitting]);

    // 프롬프트 데이터로 폼 초기화
    useEffect(() => {
        if (isOpen && prompt) {
            setFormData({
                prompt_title: prompt.prompt_title || '',
                prompt_content: prompt.prompt_content || '',
                public_available: prompt.public_available || false,
                language: (prompt.language as 'ko' | 'en') || 'ko'
            });
            setErrors({});
        }
    }, [isOpen, prompt]);

    // 입력 값 변경 핸들러
    const handleInputChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // 에러 상태 초기화
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    // 폼 유효성 검사
    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.prompt_title.trim()) {
            newErrors.prompt_title = '프롬프트 제목을 입력해주세요.';
        } else if (formData.prompt_title.length > 100) {
            newErrors.prompt_title = '제목은 100자를 초과할 수 없습니다.';
        }

        if (!formData.prompt_content.trim()) {
            newErrors.prompt_content = '프롬프트 내용을 입력해주세요.';
        } else if (formData.prompt_content.length > 5000) {
            newErrors.prompt_content = '내용은 5000자를 초과할 수 없습니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 프롬프트 수정 핸들러
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            const updateData = {
                prompt_uid: prompt.prompt_uid,
                ...formData
            };

            devLog.info('Updating prompt with data:', updateData);
            const response = await updatePrompt(updateData);

            if ((response as any).success) {
                devLog.info('Prompt updated successfully:', response);
                onClose();
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                throw new Error((response as any).message || '프롬프트 수정에 실패했습니다.');
            }
        } catch (error) {
            devLog.error('Failed to update prompt:', error);
            const errorMessage = error instanceof Error ? error.message : '프롬프트 수정에 실패했습니다.';

            // 에러에 따른 처리
            if (errorMessage.includes('로그인')) {
                alert('로그인이 필요합니다. 다시 로그인해주세요.');
            } else if (errorMessage.includes('유효성')) {
                alert('입력 데이터를 확인해주세요.');
            } else {
                alert(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // 배경 클릭시 모달 닫기
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={`${styles.modalOverlay} ${isAnimating ? styles.fadeIn : ''}`} onClick={handleBackdropClick}>
            <div className={`${styles.modalContainer} ${isAnimating ? styles.slideIn : ''}`}>
                {/* 모달 헤더 */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerInfo}>
                        <h2 className={styles.modalTitle}>프롬프트 편집</h2>
                        <p className={styles.modalDescription}>
                            프롬프트의 내용을 수정하고 설정을 변경할 수 있습니다.
                        </p>
                    </div>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        disabled={isSubmitting}
                        title="닫기"
                    >
                        <IoClose />
                    </button>
                </div>

                {/* 모달 바디 */}
                <form className={styles.modalBody} onSubmit={handleSubmit}>
                    {/* 제목 입력 */}
                    <div className={styles.formGroup}>
                        <label htmlFor="prompt_title" className={styles.label}>
                            프롬프트 제목 *
                        </label>
                        <input
                            id="prompt_title"
                            type="text"
                            value={formData.prompt_title}
                            onChange={(e) => handleInputChange('prompt_title', e.target.value)}
                            placeholder="프롬프트의 제목을 입력하세요"
                            className={`${styles.input} ${errors.prompt_title ? styles.error : ''}`}
                            maxLength={100}
                            disabled={isSubmitting}
                        />
                        {errors.prompt_title && (
                            <span className={styles.errorMessage}>{errors.prompt_title}</span>
                        )}
                        <span className={styles.charCount}>
                            {formData.prompt_title.length}/100
                        </span>
                    </div>

                    {/* 내용 입력 */}
                    <div className={styles.formGroup}>
                        <label htmlFor="prompt_content" className={styles.label}>
                            프롬프트 내용 *
                        </label>
                        <textarea
                            id="prompt_content"
                            value={formData.prompt_content}
                            onChange={(e) => handleInputChange('prompt_content', e.target.value)}
                            placeholder="프롬프트의 내용을 입력하세요"
                            className={`${styles.textarea} ${errors.prompt_content ? styles.error : ''}`}
                            rows={8}
                            maxLength={5000}
                            disabled={isSubmitting}
                        />
                        {errors.prompt_content && (
                            <span className={styles.errorMessage}>{errors.prompt_content}</span>
                        )}
                        <span className={styles.charCount}>
                            {formData.prompt_content.length}/5000
                        </span>
                    </div>

                    {/* 설정 옵션 */}
                    <div className={styles.optionsSection}>
                        {/* 언어 선택 */}
                        <div className={styles.optionGroup}>
                            <label className={styles.optionLabel}>
                                <IoLanguage className={styles.optionIcon} />
                                언어 설정
                            </label>
                            <div className={styles.languageButtons}>
                                <button
                                    type="button"
                                    className={`${styles.languageButton} ${formData.language === 'ko' ? styles.active : ''}`}
                                    onClick={() => handleInputChange('language', 'ko')}
                                    disabled={isSubmitting}
                                >
                                    🇰🇷 한국어
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.languageButton} ${formData.language === 'en' ? styles.active : ''}`}
                                    onClick={() => handleInputChange('language', 'en')}
                                    disabled={isSubmitting}
                                >
                                    🇺🇸 English
                                </button>
                            </div>
                        </div>

                        {/* 공개 설정 */}
                        <div className={styles.optionGroup}>
                            <label className={styles.optionLabel}>
                                {formData.public_available ? <IoGlobe className={styles.optionIcon} /> : <IoLockClosed className={styles.optionIcon} />}
                                공개 설정
                            </label>
                            <div className={styles.publicToggle}>
                                <button
                                    type="button"
                                    className={`${styles.toggleButton} ${!formData.public_available ? styles.active : ''}`}
                                    onClick={() => handleInputChange('public_available', false)}
                                    disabled={isSubmitting}
                                >
                                    <IoLockClosed className={styles.toggleIcon} />
                                    비공개
                                    <span className={styles.toggleDescription}>나만 사용 가능</span>
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.toggleButton} ${formData.public_available ? styles.active : ''}`}
                                    onClick={() => handleInputChange('public_available', true)}
                                    disabled={isSubmitting}
                                >
                                    <IoGlobe className={styles.toggleIcon} />
                                    공개
                                    <span className={styles.toggleDescription}>다른 사용자도 사용 가능</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 제출 버튼 */}
                    <div className={styles.actionButtons}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting || !formData.prompt_title.trim() || !formData.prompt_content.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className={styles.spinner}></div>
                                    수정 중...
                                </>
                            ) : (
                                <>
                                    <IoCheckmark className={styles.submitIcon} />
                                    프롬프트 수정
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default PromptEditModal;
