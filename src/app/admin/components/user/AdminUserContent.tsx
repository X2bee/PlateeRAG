'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { getAllUsers, deleteUser, editUser } from '@/app/admin/api/users';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminUserContent.module.scss';
import AdminUserEditModal from './AdminUserEditModal';
import {
    showDeleteConfirmToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
    showSuccessToastKo,
    showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import { useAdminAuth } from '@/app/admin/components/helper/AdminAuthGuard';

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

interface PaginationInfo {
    page: number;
    page_size: number;
    offset: number;
    total_returned: number;
}

const AdminUserContent: React.FC = () => {
    const { userType } = useAdminAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof User>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);

    const PAGE_SIZE = 100;

    // admin 타입인 경우 삭제 버튼을 숨김
    const canDeleteUsers = userType === 'superuser';

    // 로그 출력: 사용자 타입 및 삭제 권한 확인
    useEffect(() => {
        devLog.log('AdminUserContent: User type:', userType);
        devLog.log('AdminUserContent: Can delete users:', canDeleteUsers);
    }, [userType, canDeleteUsers]);

    // 사용자 데이터 로드
    const loadUsers = async (page: number = 1, resetUsers: boolean = true) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllUsers(page, PAGE_SIZE) as any;
            const newUsers = response.users || [];

            if (resetUsers) {
                setUsers(newUsers);
            } else {
                setUsers(prevUsers => [...prevUsers, ...newUsers]);
            }

            setPagination(response.pagination);
            setHasNextPage(newUsers.length === PAGE_SIZE);
            setCurrentPage(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load users:', err);
        } finally {
            setLoading(false);
        }
    };

    // 다음 페이지 로드
    const loadNextPage = () => {
        if (hasNextPage && !loading) {
            loadUsers(currentPage + 1, false);
        }
    };

    // 이전 페이지 로드
    const loadPrevPage = () => {
        if (currentPage > 1 && !loading) {
            const targetPage = currentPage - 1;
            loadUsersRange(1, targetPage);
        }
    };

    // 특정 범위의 페이지들을 로드하는 함수
    const loadUsersRange = async (startPage: number, endPage: number) => {
        try {
            setLoading(true);
            setError(null);
            let allUsers: User[] = [];
            let lastPagination: any = null;

            for (let page = startPage; page <= endPage; page++) {
                const response = await getAllUsers(page, PAGE_SIZE) as any;
                const pageUsers = response.users || [];
                allUsers = [...allUsers, ...pageUsers];
                lastPagination = response.pagination;

                if (pageUsers.length < PAGE_SIZE) {
                    break;
                }
            }

            setUsers(allUsers);
            setCurrentPage(endPage);
            setPagination(lastPagination);

            if (lastPagination && lastPagination.total_returned === PAGE_SIZE) {
                setHasNextPage(true);
            } else {
                setHasNextPage(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '사용자 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load users range:', err);
        } finally {
            setLoading(false);
        }
    };

    // 새로고침 핸들러
    const handleRefresh = () => {
        setCurrentPage(1);
        loadUsers(1, true);
    };

    useEffect(() => {
        loadUsers(1, true);
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

    // 정렬 (검색이 활성화된 경우에만 클라이언트 정렬 적용)
    const sortedUsers = searchTerm ? [...filteredUsers].sort((a, b) => {
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
    }) : [...users].sort((a, b) => {
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

    // 표시할 사용자 결정
    const displayUsers = searchTerm ? sortedUsers : sortedUsers;

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
                text: 'SUPER',
                className: styles.roleSuperuser
            };
        } else if (user.user_type === 'admin' && user.is_admin) {
            return {
                text: 'ADMIN',
                className: styles.roleAdmin
            };
        } else if (user.user_type === 'standard' && !user.is_admin) {
            return {
                text: 'USER',
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

    // 조직 표시 함수
    const getGroupsDisplay = (groups: string[] | null | undefined) => {
        if (!groups || groups.length === 0) {
            return '없음';
        }
        return groups.join(', ');
    };

    // 사용자 삭제 핸들러
    const handleDeleteUser = async (user: User) => {
        showDeleteConfirmToastKo({
            title: '사용자 삭제',
            message: `정말로 "${user.username}" (${user.email}) 사용자와 관련된 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`,
            itemName: user.username,
            onConfirm: async () => {
                try {
                    setDeleteLoading(user.id);

                    const userData = {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    };

                    const result = await deleteUser(userData);
                    devLog.log('User deleted successfully:', result);

                    // 삭제 성공 후 사용자 목록 새로고침
                    await loadUsers();

                    showDeleteSuccessToastKo({
                        itemName: user.username,
                        itemType: '사용자',
                        customMessage: '사용자와 관련된 모든 데이터가 성공적으로 삭제되었습니다.',
                    });
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : '사용자 삭제에 실패했습니다.';
                    devLog.error('Failed to delete user:', err);
                    showDeleteErrorToastKo({
                        itemName: user.username,
                        itemType: '사용자',
                        error: err instanceof Error ? err : 'Unknown error',
                        customMessage: `삭제 실패: ${errorMessage}`,
                    });
                } finally {
                    setDeleteLoading(null);
                }
            }
        });
    };

    // 사용자 편집 핸들러
    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setEditModalOpen(true);
    };

    // 사용자 편집 저장 핸들러
    const handleSaveUser = async (userData: Partial<User>) => {
        try {
            if (!editingUser) {
                throw new Error('편집 중인 사용자 정보가 없습니다.');
            }

            // API 호출을 위한 데이터 준비 (ID 포함)
            const updateData = {
                id: editingUser.id,
                ...userData
            };

            devLog.log('Saving user data:', updateData);

            // API 호출
            const result = await editUser(updateData);

            // 성공 시 사용자 목록 새로고침
            await loadUsers();

            showSuccessToastKo('사용자 정보가 성공적으로 업데이트되었습니다.');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '사용자 정보 업데이트에 실패했습니다.';
            devLog.error('Failed to update user:', error);
            showErrorToastKo(`업데이트 실패: ${errorMessage}`);
            throw error; // 모달에서 에러 처리를 위해 다시 throw
        }
    };    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setEditModalOpen(false);
        setEditingUser(null);
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
                    <button onClick={() => loadUsers(1, true)} className={styles.retryButton}>
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
                    <span>총 {users.length}명의 사용자 로드됨</span>
                    {searchTerm && (
                        <span>({sortedUsers.length}명 검색됨)</span>
                    )}
                    {pagination && !searchTerm && (
                        <>
                            <span>|</span>
                            <span>페이지 {pagination.page}</span>
                            <span>표시: {pagination.total_returned}명</span>
                            <span>크기: {pagination.page_size}</span>
                        </>
                    )}
                    {searchTerm && (
                        <>
                            <span>|</span>
                            <span>검색 모드: 로드된 모든 사용자 검색</span>
                        </>
                    )}
                </div>

                <div className={styles.actionButtons}>
                    {!searchTerm && (
                        <div className={styles.paginationButtons}>
                            <button
                                onClick={loadPrevPage}
                                disabled={loading || currentPage <= 1}
                                className={styles.paginationButton}
                            >
                                이전
                            </button>
                            <button
                                onClick={loadNextPage}
                                disabled={loading || !hasNextPage}
                                className={styles.paginationButton}
                            >
                                다음
                            </button>
                        </div>
                    )}
                    <button
                        className={`${styles.iconButton} ${loading ? styles.spinning : ''}`}
                        onClick={handleRefresh}
                        disabled={loading}
                        title="새로고침"
                    >
                        <FiRefreshCw />
                    </button>
                </div>
            </div>

            {/* 사용자 테이블 */}
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
                                onClick={() => handleSort('groups')}
                            >
                                조직
                                {sortField === 'groups' && (
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
                        {displayUsers.length === 0 ? (
                            <tr>
                                <td colSpan={10} className={styles.noData}>
                                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            displayUsers.map((user) => {
                                const roleInfo = getUserRoleDisplay(user);
                                return (
                                    <tr key={user.id} className={styles.tableRow}>
                                        <td className={styles.userId}>{user.id}</td>
                                        <td className={styles.email}>{user.email}</td>
                                        <td className={styles.username}>{user.username}</td>
                                        <td className={styles.fullName}>{user.full_name || '-'}</td>
                                        <td>{renderStatusBadge(user.is_active)}</td>
                                        <td>{formatDate(user.created_at)}</td>
                                        <td>{formatDate(user.last_login || '')}</td>
                                        <td className={styles.groupName}>{getGroupsDisplay(user.groups)}</td>
                                        <td>
                                            <span className={`${styles.role} ${roleInfo.className}`}>
                                                {roleInfo.text}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleEditUser(user)}
                                            >
                                                편집
                                            </button>
                                            {canDeleteUsers && (
                                                <button
                                                    className={`${styles.actionButton} ${styles.dangerButton}`}
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={deleteLoading === user.id}
                                                >
                                                    {deleteLoading === user.id ? '삭제 중...' : '삭제'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* 모바일 카드 레이아웃 */}
            <div className={styles.cardContainer}>
                {displayUsers.length === 0 ? (
                    <div className={styles.noData}>
                        {searchTerm ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                    </div>
                ) : (
                    displayUsers.map((user) => {
                        const roleInfo = getUserRoleDisplay(user);
                        return (
                            <div key={user.id} className={styles.userCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.userInfo}>
                                        <div className={styles.userName}>
                                            {user.username} {user.full_name && `(${user.full_name})`}
                                        </div>
                                        <div className={styles.userEmail}>{user.email}</div>
                                    </div>
                                    <div className={styles.userStatus}>
                                        {renderStatusBadge(user.is_active)}
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div className={styles.cardField}>
                                        <div className={styles.fieldLabel}>ID</div>
                                        <div className={styles.fieldValue}>{user.id}</div>
                                    </div>
                                    <div className={styles.cardField}>
                                        <div className={styles.fieldLabel}>권한</div>
                                        <div className={styles.fieldValue}>
                                            <span className={`${styles.role} ${roleInfo.className}`}>
                                                {roleInfo.text}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.cardField}>
                                        <div className={styles.fieldLabel}>조직</div>
                                        <div className={styles.fieldValue}>{getGroupsDisplay(user.groups)}</div>
                                    </div>
                                    <div className={styles.cardField}>
                                        <div className={styles.fieldLabel}>등록일</div>
                                        <div className={styles.fieldValue}>{formatDate(user.created_at)}</div>
                                    </div>
                                    {user.last_login && (
                                        <div className={styles.cardField}>
                                            <div className={styles.fieldLabel}>마지막 로그인</div>
                                            <div className={styles.fieldValue}>{formatDate(user.last_login)}</div>
                                        </div>
                                    )}
                                </div>

                                <div className={styles.cardActions}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => handleEditUser(user)}
                                    >
                                        편집
                                    </button>
                                    {canDeleteUsers && (
                                        <button
                                            className={`${styles.actionButton} ${styles.dangerButton}`}
                                            onClick={() => handleDeleteUser(user)}
                                            disabled={deleteLoading === user.id}
                                        >
                                            {deleteLoading === user.id ? '삭제 중...' : '삭제'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* 사용자 편집 모달 */}
            <AdminUserEditModal
                user={editingUser}
                isOpen={editModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveUser}
            />
        </div>
    );
};

export default AdminUserContent;
