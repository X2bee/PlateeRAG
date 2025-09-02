'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getAllUsers, addUserGroup } from '@/app/admin/api/users';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminGroupAddModal.module.scss';

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

interface AdminGroupAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupName: string;
    onSuccess: () => void;
}

const AdminGroupAddModal: React.FC<AdminGroupAddModalProps> = ({
    isOpen,
    onClose,
    groupName,
    onSuccess
}) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [sortField, setSortField] = useState<'full_name' | 'username' | 'email' | 'status'>('full_name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // 전체 사용자 목록 로드
    const loadAllUsers = async () => {
        try {
            setLoading(true);
            const response = await getAllUsers(1, 1000); // 충분히 큰 페이지 사이즈로 모든 사용자 가져오기
            setUsers((response as any).users || []);
        } catch (error) {
            devLog.error('Failed to load users:', error);
            alert('사용자 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadAllUsers();
            setSelectedUsers([]);
        }
    }, [isOpen]);

    // 사용자 선택/해제 핸들러
    const handleUserToggle = (userId: number) => {
        // 이미 해당 조직에 속한 사용자는 선택할 수 없음
        const user = users.find(u => u.id === userId);
        if (user && user.groups?.includes(groupName)) {
            return;
        }

        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // 사용자가 이미 해당 조직에 속해있는지 확인
    const isUserAlreadyMember = (user: User) => {
        return user.groups?.includes(groupName) || false;
    };

    // 정렬 핸들러
    const handleSort = (field: 'full_name' | 'username' | 'email' | 'status') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // 정렬된 사용자 목록
    const sortedUsers = [...users].sort((a, b) => {
        let aValue: string | boolean;
        let bValue: string | boolean;

        if (sortField === 'status') {
            aValue = isUserAlreadyMember(a);
            bValue = isUserAlreadyMember(b);
        } else if (sortField === 'full_name') {
            aValue = (a.full_name || '').toLowerCase();
            bValue = (b.full_name || '').toLowerCase();
        } else if (sortField === 'username') {
            aValue = a.username.toLowerCase();
            bValue = b.username.toLowerCase();
        } else if (sortField === 'email') {
            aValue = a.email.toLowerCase();
            bValue = b.email.toLowerCase();
        } else {
            return 0;
        }

        let comparison = 0;
        if (aValue < bValue) {
            comparison = -1;
        } else if (aValue > bValue) {
            comparison = 1;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // 저장 핸들러
    const handleSave = async () => {
        if (selectedUsers.length === 0) {
            alert('추가할 사용자를 선택해주세요.');
            return;
        }

        try {
            setSaving(true);

            // 선택된 각 사용자에게 그룹 추가
            for (const userId of selectedUsers) {
                await addUserGroup({
                    id: userId,
                    group_name: groupName
                });
            }

            alert(`${selectedUsers.length}명의 사용자를 조직에 추가했습니다.`);
            onSuccess();
            onClose();
        } catch (error) {
            devLog.error('Failed to add users to group:', error);
            alert('사용자 추가에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 현재 조직 표시 함수
    const getGroupsDisplay = (groups: string[] | null | undefined) => {
        if (!groups || groups.length === 0) {
            return '없음';
        }
        return groups.join(', ');
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>조직원 추가 - {groupName}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>사용자 목록을 불러오는 중...</p>
                        </div>
                    ) : (
                        <>
                            <div className={styles.controls}>
                                <div className={styles.stats}>
                                    <span>총 {users.length}명의 사용자</span>
                                    <span>선택 가능: {users.filter(u => !isUserAlreadyMember(u)).length}명</span>
                                    <span>선택된 사용자: {selectedUsers.length}명</span>
                                </div>
                            </div>

                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th
                                                className={styles.sortable}
                                                onClick={() => handleSort('full_name')}
                                            >
                                                이름
                                                {sortField === 'full_name' && (
                                                    <span className={styles.sortIcon}>
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </th>
                                            <th
                                                className={styles.sortable}
                                                onClick={() => handleSort('username')}
                                            >
                                                사용자명
                                                {sortField === 'username' && (
                                                    <span className={styles.sortIcon}>
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </th>
                                            <th
                                                className={styles.sortable}
                                                onClick={() => handleSort('email')}
                                            >
                                                이메일
                                                {sortField === 'email' && (
                                                    <span className={styles.sortIcon}>
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </th>
                                            <th>현재 조직</th>
                                            <th
                                                className={styles.sortable}
                                                onClick={() => handleSort('status')}
                                            >
                                                상태
                                                {sortField === 'status' && (
                                                    <span className={styles.sortIcon}>
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedUsers.map((user) => {
                                            const isAlreadyMember = isUserAlreadyMember(user);
                                            const isSelected = selectedUsers.includes(user.id);
                                            const rowClassName = `${isSelected ? styles.selected : ''} ${isAlreadyMember ? styles.disabled : ''}`.trim();

                                            return (
                                                <tr
                                                    key={user.id}
                                                    className={rowClassName}
                                                    onClick={() => handleUserToggle(user.id)}
                                                >
                                                    <td className={styles.fullName}>
                                                        {user.full_name || '-'}
                                                    </td>
                                                    <td className={styles.username}>
                                                        {user.username}
                                                    </td>
                                                    <td className={styles.email}>
                                                        {user.email}
                                                    </td>
                                                    <td className={styles.groupName}>
                                                        {getGroupsDisplay(user.groups)}
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${isAlreadyMember ? styles.alreadyMember : styles.available}`}>
                                                            {isAlreadyMember ? '이미 소속됨' : '추가 가능'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                        disabled={saving}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSave}
                        className={styles.saveButton}
                        disabled={loading || saving || selectedUsers.length === 0}
                    >
                        {saving ? '추가 중...' : `선택된 ${selectedUsers.length}명 추가`}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AdminGroupAddModal;
