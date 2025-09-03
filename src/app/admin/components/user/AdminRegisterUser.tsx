'use client';

import React, { useState, useEffect } from 'react';
import { getStandbyUsers, approveUser, deleteUser } from '@/app/admin/api/users';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminRegisterUser.module.scss';

interface StandbyUser {
    id: number;
    email: string;
    username: string;
    full_name: string | null;
    created_at: string;
    group_name?: string;
    is_active: boolean;
}

const AdminRegisterUser: React.FC = () => {
    const [standbyUsers, setStandbyUsers] = useState<StandbyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof StandbyUser>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [approveLoading, setApproveLoading] = useState<number | null>(null);
    const [rejectLoading, setRejectLoading] = useState<number | null>(null);

    // 대기 사용자 데이터 로드
    const loadStandbyUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await getStandbyUsers();
            setStandbyUsers(userData || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '대기 사용자 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load standby users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStandbyUsers();
    }, []);

    // 검색 필터링
    const filteredUsers = standbyUsers.filter(user => {
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

        // undefined, null 값 처리
        if ((aValue === undefined || aValue === null) && (bValue === undefined || bValue === null)) return 0;
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // 정렬 핸들러
    const handleSort = (field: keyof StandbyUser) => {
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

    // 사용자 승인 핸들러
    const handleApproveUser = async (user: StandbyUser) => {
        const confirmed = window.confirm(
            `"${user.username}" (${user.email}) 사용자의 등록을 승인하시겠습니까?`
        );

        if (!confirmed) return;

        try {
            setApproveLoading(user.id);

            const userData = {
                id: user.id,
                username: user.username,
                email: user.email
            };

            const result = await approveUser(userData);
            devLog.log('User approved successfully:', result);

            // 승인 성공 후 대기 사용자 목록 새로고침
            await loadStandbyUsers();

            alert('사용자 등록이 성공적으로 승인되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '사용자 승인에 실패했습니다.';
            devLog.error('Failed to approve user:', err);
            alert(`승인 실패: ${errorMessage}`);
        } finally {
            setApproveLoading(null);
        }
    };

    // 사용자 거부 (삭제) 핸들러
    const handleRejectUser = async (user: StandbyUser) => {
        const confirmed = window.confirm(
            `정말로 "${user.username}" (${user.email}) 사용자의 등록을 거부하시겠습니까?\n\n이 작업은 해당 사용자의 모든 데이터를 삭제하며 되돌릴 수 없습니다.`
        );

        if (!confirmed) return;

        try {
            setRejectLoading(user.id);

            const userData = {
                id: user.id,
                username: user.username,
                email: user.email
            };

            const result = await deleteUser(userData);
            devLog.log('User rejected successfully:', result);

            // 거부 성공 후 대기 사용자 목록 새로고침
            await loadStandbyUsers();

            alert('사용자 등록이 거부되었으며 관련 데이터가 삭제되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '사용자 거부에 실패했습니다.';
            devLog.error('Failed to reject user:', err);
            alert(`거부 실패: ${errorMessage}`);
        } finally {
            setRejectLoading(null);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>대기 사용자 목록을 불러오는 중...</p>
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
                    <button onClick={loadStandbyUsers} className={styles.retryButton}>
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
                    <span>총 {standbyUsers.length}명의 대기 사용자</span>
                    {searchTerm && (
                        <span>({filteredUsers.length}명 검색됨)</span>
                    )}
                </div>
                <button onClick={loadStandbyUsers} className={styles.refreshButton}>
                    새로고침
                </button>
            </div>

            {/* 대기 사용자 테이블 */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('id')}
                            >
                                ID
                                {sortField === 'id' && (
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
                                onClick={() => handleSort('created_at')}
                            >
                                등록 신청일
                                {sortField === 'created_at' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th>그룹</th>
                            <th>상태</th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={styles.noData}>
                                    {searchTerm ? '검색 결과가 없습니다.' : '승인 대기 중인 사용자가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            sortedUsers.map((user) => (
                                <tr key={user.id} className={styles.tableRow}>
                                    <td className={styles.userId}>{user.id}</td>
                                    <td className={styles.email}>{user.email}</td>
                                    <td className={styles.username}>{user.username}</td>
                                    <td className={styles.fullName}>{user.full_name || '-'}</td>
                                    <td>{formatDate(user.created_at)}</td>
                                    <td className={styles.groupName}>{user.group_name || '-'}</td>
                                    <td>
                                        <span className={styles.statusBadge}>
                                            승인 대기
                                        </span>
                                    </td>
                                    <td className={styles.actions}>
                                        <button
                                            className={`${styles.actionButton} ${styles.approveButton}`}
                                            onClick={() => handleApproveUser(user)}
                                            disabled={approveLoading === user.id || rejectLoading === user.id}
                                        >
                                            {approveLoading === user.id ? '승인 중...' : '승인'}
                                        </button>
                                        <button
                                            className={`${styles.actionButton} ${styles.rejectButton}`}
                                            onClick={() => handleRejectUser(user)}
                                            disabled={approveLoading === user.id || rejectLoading === user.id}
                                        >
                                            {rejectLoading === user.id ? '거부 중...' : '거부'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 모바일 카드 레이아웃 */}
            <div className={styles.cardContainer}>
                {sortedUsers.length === 0 ? (
                    <div className={styles.noData}>
                        {searchTerm ? '검색 결과가 없습니다.' : '승인 대기 중인 사용자가 없습니다.'}
                    </div>
                ) : (
                    sortedUsers.map((user) => (
                        <div key={user.id} className={styles.userCard}>
                            <div className={styles.cardHeader}>
                                <div className={styles.userInfo}>
                                    <div className={styles.userName}>
                                        {user.username} {user.full_name && `(${user.full_name})`}
                                    </div>
                                    <div className={styles.userEmail}>{user.email}</div>
                                </div>
                                <div className={styles.userStatus}>
                                    <span className={styles.statusBadge}>
                                        승인 대기
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.cardField}>
                                    <div className={styles.fieldLabel}>ID</div>
                                    <div className={styles.fieldValue}>{user.id}</div>
                                </div>
                                <div className={styles.cardField}>
                                    <div className={styles.fieldLabel}>그룹</div>
                                    <div className={styles.fieldValue}>{user.group_name || '-'}</div>
                                </div>
                                <div className={styles.cardField}>
                                    <div className={styles.fieldLabel}>등록 신청일</div>
                                    <div className={styles.fieldValue}>{formatDate(user.created_at)}</div>
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                <button
                                    className={`${styles.actionButton} ${styles.approveButton}`}
                                    onClick={() => handleApproveUser(user)}
                                    disabled={approveLoading === user.id || rejectLoading === user.id}
                                >
                                    {approveLoading === user.id ? '승인 중...' : '승인'}
                                </button>
                                <button
                                    className={`${styles.actionButton} ${styles.rejectButton}`}
                                    onClick={() => handleRejectUser(user)}
                                    disabled={approveLoading === user.id || rejectLoading === user.id}
                                >
                                    {rejectLoading === user.id ? '거부 중...' : '거부'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminRegisterUser;
