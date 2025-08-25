'use client';

import React, { useState, useEffect } from 'react';
import { getAllUsers } from '@/app/admin/api/users';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminUserContent.module.scss';

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
    group_name: string;
    last_login?: string | null;
    password_hash: string;
    preferences?: any;
}

const AdminUserContent: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof User>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // 사용자 데이터 로드
    const loadUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await getAllUsers();
            setUsers(userData || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    // 검색 필터링
    const filteredUsers = users.filter(user => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        const email = user.email?.toLowerCase() || '';
        const username = user.username?.toLowerCase() || '';
        const fullName = user.full_name?.toLowerCase() || '';

        return email.includes(searchLower) ||
               username.includes(searchLower) ||
               fullName.includes(searchLower);
    });

    // 정렬
    const sortedUsers = [...filteredUsers].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // user_type에 대한 특별한 정렬 로직
        if (sortField === 'user_type') {
            const userTypeOrder = { 'superuser': 2, 'admin': 1, 'standard': 0 };
            const aOrder = userTypeOrder[a.user_type];
            const bOrder = userTypeOrder[b.user_type];

            const comparison = aOrder - bOrder;
            return sortDirection === 'asc' ? comparison : -comparison;
        }

        // undefined 값 처리
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // 정렬 핸들러
    const handleSort = (field: keyof User) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 상태 배지 렌더링
    const renderStatusBadge = (isActive: boolean) => (
        <span className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeInactive}`}>
            {isActive ? '활성' : '비활성'}
        </span>
    );

    // 사용자 권한 표시 함수
    const getUserRoleDisplay = (user: User) => {
        if (user.user_type === 'superuser' && user.is_admin) {
            return {
                text: '최고 관리자',
                className: styles.roleSuperuser
            };
        } else if (user.user_type === 'admin' && user.is_admin) {
            return {
                text: '관리자',
                className: styles.roleAdmin
            };
        } else if (user.user_type === 'standard' && !user.is_admin) {
            return {
                text: '일반 사용자',
                className: styles.roleUser
            };
        } else {
            // 예외적인 경우
            return {
                text: `${user.user_type} (${user.is_admin ? 'Admin' : 'User'})`,
                className: styles.roleUnknown
            };
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>사용자 목록을 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h3>오류 발생</h3>
                    <p>{error}</p>
                    <button onClick={loadUsers} className={styles.retryButton}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 상단 컨트롤 */}
            <div className={styles.controls}>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="이메일, 사용자명, 이름으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.stats}>
                    <span>총 {users.length}명의 사용자</span>
                    {searchTerm && (
                        <span>({filteredUsers.length}명 검색됨)</span>
                    )}
                </div>
                <button onClick={loadUsers} className={styles.refreshButton}>
                    새로고침
                </button>
            </div>

            {/* 사용자 테이블 */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
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
                                onClick={() => handleSort('is_active')}
                            >
                                상태
                                {sortField === 'is_active' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('created_at')}
                            >
                                등록일
                                {sortField === 'created_at' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('last_login')}
                            >
                                마지막 로그인
                                {sortField === 'last_login' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('user_type')}
                            >
                                권한
                                {sortField === 'user_type' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={styles.noData}>
                                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            sortedUsers.map((user) => {
                                const roleInfo = getUserRoleDisplay(user);
                                return (
                                    <tr key={user.id} className={styles.tableRow}>
                                        <td className={styles.email}>{user.email}</td>
                                        <td className={styles.username}>{user.username}</td>
                                        <td className={styles.fullName}>{user.full_name || '-'}</td>
                                        <td>{renderStatusBadge(user.is_active)}</td>
                                        <td>{formatDate(user.created_at)}</td>
                                        <td>{formatDate(user.last_login || '')}</td>
                                        <td>
                                            <span className={`${styles.role} ${roleInfo.className}`}>
                                                {roleInfo.text}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => console.log('Edit user:', user.id)}
                                            >
                                                편집
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.dangerButton}`}
                                                onClick={() => console.log('Delete user:', user.id)}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUserContent;
