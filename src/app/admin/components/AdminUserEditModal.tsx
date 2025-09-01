'use client';

import React, { useState, useEffect } from 'react';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminUserEditModal.module.scss';

interface User {
    id: number;
    email: string;
    username: string;
    full_name: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
    is_admin: boolean;
    user_type: 'superuser' | 'admin' | 'standard';
    groups: string[] | null;
    last_login?: string | null;
    password_hash: string;
    preferences?: any;
}

interface AdminUserEditModalProps {
    user: User | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (userData: Partial<User>) => Promise<void>;
}

const AdminUserEditModal: React.FC<AdminUserEditModalProps> = ({
    user,
    isOpen,
    onClose,
    onSave
}) => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        full_name: '',
        user_type: 'standard' as 'superuser' | 'admin' | 'standard',
        preferences: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [showPasswordChange, setShowPasswordChange] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // 사용자 데이터가 변경될 때 폼 데이터 업데이트
    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                username: user.username || '',
                full_name: user.full_name || '',
                user_type: user.user_type,
                preferences: user.preferences ? JSON.stringify(user.preferences, null, 2) : ''
            });
            setErrors({});
            setShowPasswordChange(false);
            setNewPassword('');
            setConfirmPassword('');
        }
    }, [user]);

    // 폼 필드 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // 에러 메시지 제거
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // 비밀번호 변경 토글 핸들러
    const handlePasswordChangeToggle = () => {
        setShowPasswordChange(!showPasswordChange);
        setNewPassword('');
        setConfirmPassword('');
        // 비밀번호 관련 에러 제거
        setErrors(prev => ({
            ...prev,
            newPassword: '',
            confirmPassword: ''
        }));
    };

    // 비밀번호 입력 핸들러
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'newPassword') {
            setNewPassword(value);
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }

        // 에러 메시지 제거
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // 폼 유효성 검사
    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};

        if (!formData.email.trim()) {
            newErrors.email = '이메일은 필수입니다.';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '유효한 이메일 형식이 아닙니다.';
        }

        if (!formData.username.trim()) {
            newErrors.username = '사용자명은 필수입니다.';
        }

        if (formData.preferences) {
            try {
                JSON.parse(formData.preferences);
            } catch (error) {
                newErrors.preferences = '유효한 JSON 형식이 아닙니다.';
            }
        }

        // 비밀번호 변경이 활성화된 경우
        if (showPasswordChange) {
            if (!newPassword.trim()) {
                newErrors.newPassword = '새 비밀번호를 입력해주세요.';
            } else if (newPassword.length < 6) {
                newErrors.newPassword = '비밀번호는 최소 6자 이상이어야 합니다.';
            }

            if (!confirmPassword.trim()) {
                newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
            } else if (newPassword !== confirmPassword) {
                newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // 저장 핸들러
    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            // user_type에 따라 is_admin 자동 설정
            const isAdmin = formData.user_type === 'superuser' || formData.user_type === 'admin';

            const updateData: Partial<User> = {
                email: formData.email.trim(),
                username: formData.username.trim(),
                full_name: formData.full_name.trim() || null,
                is_admin: isAdmin,
                user_type: formData.user_type,
                preferences: formData.preferences ? JSON.parse(formData.preferences) : null
            };

            if (showPasswordChange && newPassword) {
                updateData.password_hash = newPassword;
            }

            await onSave(updateData);
            onClose();
        } catch (error) {
            devLog.error('Failed to save user:', error);
            // 에러는 부모 컴포넌트에서 처리
        } finally {
            setLoading(false);
        }
    };

    // 모달이 열려있지 않으면 렌더링하지 않음
    if (!isOpen || !user) {
        return null;
    }

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>사용자 편집</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                        <label htmlFor="email">이메일 *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={errors.email ? styles.inputError : ''}
                            disabled={loading}
                        />
                        {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="username">사용자명 *</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className={errors.username ? styles.inputError : ''}
                            disabled={loading}
                        />
                        {errors.username && <span className={styles.errorMessage}>{errors.username}</span>}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="full_name">이름</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="user_type">사용자 유형</label>
                            <select
                                id="user_type"
                                name="user_type"
                                value={formData.user_type}
                                onChange={handleInputChange}
                                disabled={loading}
                            >
                                <option value="standard">일반 사용자</option>
                                <option value="admin">관리자</option>
                                <option value="superuser">최고 관리자</option>
                            </select>
                        </div>

                        <div className={styles.passwordButtonGroup}>
                            <button
                                type="button"
                                className={styles.passwordToggleButton}
                                onClick={handlePasswordChangeToggle}
                                disabled={loading}
                            >
                                {showPasswordChange ? '비밀번호 변경 취소' : '비밀번호 변경'}
                            </button>
                        </div>
                    </div>

                    {/* 비밀번호 변경 필드들 */}
                    {showPasswordChange && (
                        <div className={styles.passwordFields}>
                            <div className={styles.formGroup}>
                                <label htmlFor="newPassword">새 비밀번호 *</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    className={errors.newPassword ? styles.inputError : ''}
                                    disabled={loading}
                                    placeholder="새 비밀번호를 입력하세요"
                                />
                                {errors.newPassword && <span className={styles.errorMessage}>{errors.newPassword}</span>}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword">비밀번호 확인 *</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={handlePasswordChange}
                                    className={errors.confirmPassword ? styles.inputError : ''}
                                    disabled={loading}
                                    placeholder="비밀번호를 다시 입력하세요"
                                />
                                {errors.confirmPassword && <span className={styles.errorMessage}>{errors.confirmPassword}</span>}
                            </div>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label htmlFor="preferences">환경설정 (JSON)</label>
                        <textarea
                            id="preferences"
                            name="preferences"
                            value={formData.preferences}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder='{"mobile_phone_number": "010-1234-5678"}'
                            className={errors.preferences ? styles.inputError : ''}
                            disabled={loading}
                        />
                        {errors.preferences && <span className={styles.errorMessage}>{errors.preferences}</span>}
                    </div>

                    <div className={styles.userInfo}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>ID:</span>
                            <span className={styles.infoValue}>{user.id}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>생성일:</span>
                            <span className={styles.infoValue}>
                                {new Date(user.created_at).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>수정일:</span>
                            <span className={styles.infoValue}>
                                {new Date(user.updated_at).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        {user.last_login && (
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>마지막 로그인:</span>
                                <span className={styles.infoValue}>
                                    {new Date(user.last_login).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    <button
                        className={styles.cancelButton}
                        onClick={onClose}
                        disabled={loading}
                    >
                        취소
                    </button>
                    <button
                        className={styles.saveButton}
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminUserEditModal;
