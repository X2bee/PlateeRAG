'use client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './AdminPromptCreateModal.module.scss';
import { IoClose, IoCheckmark } from 'react-icons/io5';
import { createPrompt } from '@/app/admin/api/prompt';
import { devLog } from '@/app/_common/utils/logger';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';

interface AdminPromptCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const AdminPromptCreateModal: React.FC<AdminPromptCreateModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        prompt_title: '',
        prompt_content: '',
        language: 'ko' as 'ko' | 'en',
        public_available: false,
        is_template: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.prompt_title.trim()) {
            newErrors.prompt_title = '프롬프트 제목을 입력해주세요.';
        } else if (formData.prompt_title.length > 100) {
            newErrors.prompt_title = '프롬프트 제목은 100자를 초과할 수 없습니다.';
        }

        if (!formData.prompt_content.trim()) {
            newErrors.prompt_content = '프롬프트 내용을 입력해주세요.';
        } else if (formData.prompt_content.length > 5000) {
            newErrors.prompt_content = '프롬프트 내용은 5000자를 초과할 수 없습니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await createPrompt({
                prompt_title: formData.prompt_title.trim(),
                prompt_content: formData.prompt_content.trim(),
                language: formData.language,
                public_available: formData.public_available,
                is_template: formData.is_template,
            });

            devLog.info('Prompt created successfully (admin):', formData.prompt_title);
            showSuccessToastKo('프롬프트가 성공적으로 생성되었습니다!');

            // Reset form
            setFormData({
                prompt_title: '',
                prompt_content: '',
                language: 'ko',
                public_available: false,
                is_template: false,
            });
            setErrors({});

            onSuccess();
            onClose();
        } catch (error) {
            devLog.error('Failed to create prompt (admin):', error);
            const errorMessage = error instanceof Error ? error.message : '프롬프트 생성에 실패했습니다.';
            showErrorToastKo(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleCheckboxChange = (name: 'public_available' | 'is_template') => {
        setFormData(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const handleLanguageChange = (language: 'ko' | 'en') => {
        setFormData(prev => ({ ...prev, language }));
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setFormData({
                prompt_title: '',
                prompt_content: '',
                language: 'ko',
                public_available: false,
                is_template: false,
            });
            setErrors({});
            onClose();
        }
    };

    const modalContent = (
        <div className={styles.modalOverlay} onClick={handleClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>새 프롬프트 생성 (관리자)</h2>
                    <button className={styles.closeButton} onClick={handleClose} disabled={isSubmitting}>
                        <IoClose />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.modalBody}>
                        {/* 좌측 컬럼 */}
                        <div>
                            {/* 제목 입력 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>
                                    프롬프트 제목 <span className={styles.required}>*</span>
                                </label>
                                <input
                                    type="text"
                                    name="prompt_title"
                                    value={formData.prompt_title}
                                    onChange={handleInputChange}
                                    className={`${styles.input} ${errors.prompt_title ? styles.error : ''}`}
                                    placeholder="프롬프트 제목을 입력하세요 (최대 100자)"
                                    maxLength={100}
                                    disabled={isSubmitting}
                                />
                                {errors.prompt_title && (
                                    <div className={styles.errorMessage}>{errors.prompt_title}</div>
                                )}
                                <div className={styles.charCount}>
                                    {formData.prompt_title.length} / 100
                                </div>
                            </div>

                            {/* 내용 입력 */}
                            <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                                <label className={styles.label}>
                                    프롬프트 내용 <span className={styles.required}>*</span>
                                </label>
                                <textarea
                                    name="prompt_content"
                                    value={formData.prompt_content}
                                    onChange={handleInputChange}
                                    className={`${styles.textarea} ${errors.prompt_content ? styles.error : ''}`}
                                    placeholder="프롬프트 내용을 입력하세요 (최대 5000자)"
                                    rows={10}
                                    maxLength={5000}
                                    disabled={isSubmitting}
                                />
                                {errors.prompt_content && (
                                    <div className={styles.errorMessage}>{errors.prompt_content}</div>
                                )}
                                <div className={styles.charCount}>
                                    {formData.prompt_content.length} / 5000
                                </div>
                            </div>
                        </div>

                        {/* 우측 컬럼 */}
                        <div>
                            {/* 언어 선택 */}
                            <div className={styles.formGroup}>
                                <label className={styles.label}>언어</label>
                                <div className={styles.languageButtons}>
                                    <button
                                        type="button"
                                        className={`${styles.languageButton} ${formData.language === 'ko' ? styles.active : ''}`}
                                        onClick={() => handleLanguageChange('ko')}
                                        disabled={isSubmitting}
                                    >
                                        🇰🇷 한국어
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.languageButton} ${formData.language === 'en' ? styles.active : ''}`}
                                        onClick={() => handleLanguageChange('en')}
                                        disabled={isSubmitting}
                                    >
                                        🇺🇸 English
                                    </button>
                                </div>
                            </div>

                            {/* 공개 여부 */}
                            <div className={styles.formGroup} style={{ marginTop: '20px' }}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.public_available}
                                        onChange={() => handleCheckboxChange('public_available')}
                                        className={styles.checkbox}
                                        disabled={isSubmitting}
                                    />
                                    <span className={styles.checkboxText}>
                                        {formData.public_available && <IoCheckmark className={styles.checkIcon} />}
                                    </span>
                                    <span>공개 프롬프트로 설정</span>
                                </label>
                                <div className={styles.helpText}>
                                    공개 프롬프트는 모든 사용자가 볼 수 있습니다.
                                </div>
                            </div>

                            {/* 템플릿 여부 (Admin only) */}
                            <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                                <label className={styles.checkboxLabel}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_template}
                                        onChange={() => handleCheckboxChange('is_template')}
                                        className={styles.checkbox}
                                        disabled={isSubmitting}
                                    />
                                    <span className={styles.checkboxText}>
                                        {formData.is_template && <IoCheckmark className={styles.checkIcon} />}
                                    </span>
                                    <span>템플릿으로 설정</span>
                                </label>
                                <div className={styles.helpText}>
                                    템플릿 프롬프트는 시스템에서 제공하는 기본 템플릿으로 표시됩니다.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <button
                            type="button"
                            className={styles.cancelButton}
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '생성 중...' : '생성'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AdminPromptCreateModal;
