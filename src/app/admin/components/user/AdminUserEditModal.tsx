'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { devLog } from '@/app/_common/utils/logger';
import { getAllGroupsList } from '@/app/admin/api/group';
import { addUserGroup, removeUserGroup, updateUserAvailableAdminSections } from '@/app/admin/api/users';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
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
    available_admin_sections?: string[];
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

    // 그룹 관련 상태
    const [allGroups, setAllGroups] = useState<string[]>([]);
    const [loadingGroups, setLoadingGroups] = useState(false);
    const [adminGroups, setAdminGroups] = useState<Set<string>>(new Set());

    // Admin Section 관련 상태
    const [availableAdminSections, setAvailableAdminSections] = useState<string[]>([]);
    const [isGroupAdminExpanded, setIsGroupAdminExpanded] = useState(false);
    const [isAdminSectionExpanded, setIsAdminSectionExpanded] = useState(false);
    const availableSectionOptions = [
        // User Management
        "users", "user-create", "group-permissions",
        // Workflow Management
        "workflow-management", "workflow-monitoring", "node-management",
        "chat-monitoring", "user-token-dashboard", "prompt-store",
        // System Settings
        "system-config", "system-settings",
        // System Monitoring
        "system-monitor", "system-health", "backend-logs",
        // Data Management
        "database", "storage", "backup",
        // Security
        "security-settings", "audit-logs", "error-logs",
        // MCP
        "mcp-market",
    ];

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

            // 사용자의 admin 그룹 목록 추출
            if (user.groups && Array.isArray(user.groups)) {
                const adminGroupSet = new Set<string>();
                user.groups.forEach(group => {
                    if (group.endsWith('__admin__')) {
                        const baseGroup = group.replace('__admin__', '');
                        adminGroupSet.add(baseGroup);
                    }
                });
                setAdminGroups(adminGroupSet);
            } else {
                setAdminGroups(new Set());
            }

            // 사용자의 available admin sections 설정
            setAvailableAdminSections(user.available_admin_sections || []);
        }
    }, [user]);

    // 전체 그룹 목록 로드
    useEffect(() => {
        const loadGroups = async () => {
            try {
                setLoadingGroups(true);
                const groups = await getAllGroupsList();
                // __admin__ 접미사가 붙은 그룹 제외하고 기본 그룹만 필터링
                const baseGroups = groups.filter((g: string) => !g.endsWith('__admin__') && g !== 'none');
                setAllGroups(baseGroups);
            } catch (error) {
                devLog.error('Failed to load groups:', error);
                setAllGroups([]);
            } finally {
                setLoadingGroups(false);
            }
        };

        if (isOpen) {
            loadGroups();
        }
    }, [isOpen]);

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

    // 그룹 admin 권한 토글 핸들러
    const handleToggleGroupAdmin = async (groupName: string) => {
        if (!user) return;

        const adminGroupName = `${groupName}__admin__`;
        const isCurrentlyAdmin = adminGroups.has(groupName);

        try {
            if (isCurrentlyAdmin) {
                // admin 권한 제거
                await removeUserGroup({
                    id: user.id,
                    group_name: adminGroupName
                });

                setAdminGroups(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(groupName);
                    return newSet;
                });

                showSuccessToastKo(`${groupName} 조직의 관리자 권한이 제거되었습니다.`);
            } else {
                // admin 권한 부여
                await addUserGroup({
                    id: user.id,
                    group_name: adminGroupName
                });

                setAdminGroups(prev => {
                    const newSet = new Set(prev);
                    newSet.add(groupName);
                    return newSet;
                });

                showSuccessToastKo(`${groupName} 조직의 관리자 권한이 부여되었습니다.`);
            }
        } catch (error) {
            devLog.error('Failed to toggle group admin permission:', error);
            showErrorToastKo('그룹 권한 변경에 실패했습니다.');
        }
    };

    // Admin Section 토글 핸들러
    const handleToggleAdminSection = (section: string) => {
        setAvailableAdminSections(prev => {
            if (prev.includes(section)) {
                return prev.filter(s => s !== section);
            } else {
                return [...prev, section];
            }
        });
    };

    // Admin Section 저장 핸들러
    const handleSaveAdminSections = async () => {
        if (!user) return;

        try {
            setLoading(true);
            await updateUserAvailableAdminSections({
                id: user.id,
                available_admin_sections: availableAdminSections
            });
            showSuccessToastKo('관리자 섹션 접근 권한이 저장되었습니다.');
        } catch (error) {
            devLog.error('Failed to update admin sections:', error);
            showErrorToastKo('관리자 섹션 권한 변경에 실패했습니다.');
        } finally {
            setLoading(false);
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

    const modalContent = (
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

                    {/* 그룹 관리자 권한 설정 (admin 사용자만) */}
                    {formData.user_type === 'admin' && (
                        <>
                            <div className={styles.groupAdminSection}>
                                <div
                                    className={styles.sectionHeader}
                                    onClick={() => setIsGroupAdminExpanded(!isGroupAdminExpanded)}
                                >
                                    <div className={styles.sectionHeaderContent}>
                                        <label>그룹 관리자 권한 설정</label>
                                        <span className={styles.sectionDescription}>
                                            각 조직의 관리자 권한을 설정할 수 있습니다.
                                        </span>
                                    </div>
                                    <span className={`${styles.toggleIcon} ${isGroupAdminExpanded ? styles.expanded : ''}`}>
                                        ▼
                                    </span>
                                </div>

                                <div className={`${styles.sectionContent} ${isGroupAdminExpanded ? styles.expanded : ''}`}>
                                    {loadingGroups ? (
                                        <div className={styles.loadingGroups}>
                                            <div className={styles.spinner}></div>
                                            <span>그룹 목록을 불러오는 중...</span>
                                        </div>
                                    ) : allGroups.length === 0 ? (
                                        <div className={styles.noGroups}>
                                            등록된 조직이 없습니다.
                                        </div>
                                    ) : (
                                        <div className={styles.groupGrid}>
                                            {allGroups.map((group) => {
                                                const isAdmin = adminGroups.has(group);
                                                const isUserInGroup = user?.groups?.includes(group);

                                                return (
                                                    <div key={group} className={styles.groupItem}>
                                                        <span className={styles.groupName}>
                                                            {group}
                                                            {!isUserInGroup && (
                                                                <span className={styles.notMemberBadge}>
                                                                    미소속
                                                                </span>
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            className={`${styles.groupAdminButton} ${
                                                                isAdmin ? styles.groupAdminButtonActive : styles.groupAdminButtonInactive
                                                            }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleGroupAdmin(group);
                                                            }}
                                                            disabled={loading || !isUserInGroup}
                                                            title={
                                                                !isUserInGroup
                                                                    ? '먼저 해당 조직에 사용자를 추가해주세요'
                                                                    : isAdmin
                                                                    ? '클릭하여 관리자 권한 제거'
                                                                    : '클릭하여 관리자 권한 부여'
                                                            }
                                                        >
                                                            {isAdmin ? 'ADMIN' : 'USER'}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 관리자 섹션 접근 권한 설정 */}
                            <div className={styles.groupAdminSection}>
                                <div
                                    className={styles.sectionHeader}
                                    onClick={() => setIsAdminSectionExpanded(!isAdminSectionExpanded)}
                                >
                                    <div className={styles.sectionHeaderContent}>
                                        <label>관리자 섹션 접근 권한 설정</label>
                                        <span className={styles.sectionDescription}>
                                            관리자 페이지에서 접근 가능한 섹션을 설정할 수 있습니다.
                                        </span>
                                    </div>
                                    <span className={`${styles.toggleIcon} ${isAdminSectionExpanded ? styles.expanded : ''}`}>
                                        ▼
                                    </span>
                                </div>

                                <div className={`${styles.sectionContent} ${isAdminSectionExpanded ? styles.expanded : ''}`}>
                                    <div className={styles.sectionGrid}>
                                        {availableSectionOptions.map((section) => {
                                            const isActive = availableAdminSections.includes(section);

                                            return (
                                                <button
                                                    key={section}
                                                    type="button"
                                                    className={`${styles.sectionButton} ${
                                                        isActive ? styles.sectionButtonActive : styles.sectionButtonInactive
                                                    }`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleAdminSection(section);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    {section}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className={styles.saveAdminSectionsButton}>
                                        <button
                                            type="button"
                                            className={styles.saveButton}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSaveAdminSections();
                                            }}
                                            disabled={loading}
                                        >
                                            {loading ? '저장 중...' : '섹션 권한 저장'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
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

    return createPortal(modalContent, document.body);
};

export default AdminUserEditModal;
