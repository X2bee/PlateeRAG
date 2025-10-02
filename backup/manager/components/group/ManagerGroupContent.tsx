'use client';

import React, { useState, useEffect } from 'react';
import { getAllGroups, getGroupUsers, deleteGroup } from '@/app/manager/api/group';
import { removeUserGroup } from '@/app/manager/api/users';
import { devLog } from '@/app/_common/utils/logger';
import { showSuccessToastKo, showErrorToastKo, showDeleteConfirmToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/manager/assets/ManagerGroupContent.module.scss';

interface Group {
    group_name: string;
    available: boolean;
    available_sections: string[];
}

interface User {
    id: number;
    email: string;
    username: string;
    full_name: string | null;
    created_at: string;
    updated_at?: string;
    is_active: boolean;
    is_admin?: boolean;
    user_type: 'superuser' | 'admin' | 'standard' | string;
    group_name?: string;
    groups?: string[]; // 사용자가 속한 모든 그룹 목록
    last_login?: string | null;
    password_hash?: string;
    preferences?: any;
}

const ManagerGroupContent: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState<'groups' | 'users'>('groups');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupUsers, setGroupUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // 그룹 데이터 로드
    const loadGroups = async () => {
        try {
            setLoading(true);
            setError(null);
            const groupData = await getAllGroups();
            setGroups(groupData || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : '조직 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load groups:', err);
        } finally {
            setLoading(false);
        }
    };

    // 특정 그룹의 사용자 로드
    const loadGroupUsers = async (groupName: string) => {
        try {
            setLoadingUsers(true);
            const userData = await getGroupUsers(groupName);
            setGroupUsers(userData || []);
        } catch (err) {
            devLog.error('Failed to load group users:', err);
            setGroupUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        loadGroups();
    }, []);

    // 그룹 선택 핸들러 (탭 변경)
    const handleGroupSelect = (groupName: string) => {
        setSelectedGroup(groupName);
        setActiveTab('users');
        loadGroupUsers(groupName);
    };

    // 뒤로가기 핸들러
    const handleBackToGroups = () => {
        setActiveTab('groups');
        setSelectedGroup(null);
        setGroupUsers([]);
    };

    // 그룹 삭제 핸들러
    const handleDeleteGroup = async (groupName: string) => {
        showDeleteConfirmToastKo({
            message: `정말로 "${groupName}" 조직을 삭제하시겠습니까?\n이 조직에 속한 사용자들은 'none' 그룹으로 이동됩니다.`,
            itemName: groupName,
            onConfirm: async () => {
                try {
                    await deleteGroup(groupName);

                    // 성공 시 목록 새로고침
                    await loadGroups();
                    showSuccessToastKo('조직이 성공적으로 삭제되었습니다.');
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : '조직 삭제에 실패했습니다.';
                    devLog.error('Failed to delete group:', err);
                    showErrorToastKo(`삭제 실패: ${errorMessage}`);
                }
            }
        });
    };

    // 검색 필터링
    const filteredGroups = groups.filter(group => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        const groupName = group.group_name?.toLowerCase() || '';
        return groupName.includes(searchLower);
    });

    // 사용자 제외 핸들러
    const handleRemoveUser = async (user: User) => {
        if (!selectedGroup) return;

        showDeleteConfirmToastKo({
            title: '사용자 제외 확인',
            message: `정말로 "${user.username}" 사용자를 "${selectedGroup}" 조직에서 제외하시겠습니까?`,
            itemName: user.username,
            confirmText: '제외',
            onConfirm: async () => {
                try {
                    await removeUserGroup({
                        id: user.id,
                        group_name: selectedGroup
                    });

                    // 성공 시 사용자 목록 새로고침
                    await loadGroupUsers(selectedGroup);
                    showSuccessToastKo('사용자가 조직에서 제외되었습니다.');
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : '사용자 제외에 실패했습니다.';
                    devLog.error('Failed to remove user from group:', err);
                    showErrorToastKo(`제외 실패: ${errorMessage}`);
                }
            }
        });
    };

    // 상태 배지 렌더링
    const renderStatusBadge = (available: boolean) => (
        <span className={`${styles.badge} ${available ? styles.badgeActive : styles.badgeInactive}`}>
            {available ? '활성' : '비활성'}
        </span>
    );

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

    // 그룹 관리자 여부 확인 함수
    const isGroupAdmin = (user: User, groupName: string): boolean => {
        // user.groups 배열이 있는 경우
        if (user.groups && Array.isArray(user.groups)) {
            const adminGroupName = `${groupName}__admin__`;
            return user.groups.includes(groupName) && user.groups.includes(adminGroupName);
        }

        // user.group_name 문자열만 있는 경우 (레거시)
        // 이 경우 백엔드에서 groups 배열을 제공하지 않으므로 false 반환
        return false;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>조직 목록을 불러오는 중...</p>
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
                    <button onClick={() => loadGroups()} className={styles.retryButton}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 상단 컨트롤 - 그룹 목록 탭 */}
            {activeTab === 'groups' && (
                <div className={styles.controls}>
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="조직명으로 검색..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.stats}>
                        <span>총 {groups.length}개의 조직 (관리 권한)</span>
                        {searchTerm && (
                            <span>({filteredGroups.length}개 검색됨)</span>
                        )}
                    </div>

                    <div className={styles.actionButtons}>
                        <button onClick={loadGroups} className={styles.refreshButton}>
                            새로고침
                        </button>
                    </div>
                </div>
            )}

            {/* 상단 컨트롤 - 사용자 목록 탭 */}
            {activeTab === 'users' && (
                <div className={styles.controls}>
                    <div className={styles.actionButtons}>
                        <button
                            onClick={handleBackToGroups}
                            className={styles.refreshButton}
                        >
                            ← 조직 목록으로 돌아가기
                        </button>
                    </div>

                    <div className={styles.stats}>
                        <span>{selectedGroup} 조직 사용자 ({groupUsers.length}명)</span>
                    </div>

                    <div className={styles.actionButtons}>
                        <button
                            onClick={() => selectedGroup && loadGroupUsers(selectedGroup)}
                            className={styles.refreshButton}
                        >
                            새로고침
                        </button>
                    </div>
                </div>
            )}

            {/* 테이블 컨테이너 */}
            <div className={styles.tableContainer}>
                {activeTab === 'groups' && (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>조직명</th>
                                <th>상태</th>
                                <th>사용 가능 섹션</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredGroups.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className={styles.noData}>
                                        {loading ? '조직 목록을 불러오는 중...' : searchTerm ? '검색 결과가 없습니다.' : '관리 권한이 있는 조직이 없습니다.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredGroups.map((group) => (
                                    <tr key={group.group_name} className={styles.tableRow}>
                                        <td className={styles.groupName}>{group.group_name}</td>
                                        <td>{renderStatusBadge(group.available)}</td>
                                        <td className={styles.sections}>
                                            {group.available_sections?.length > 0
                                                ? group.available_sections.join(', ')
                                                : '없음'
                                            }
                                        </td>
                                        <td className={styles.actions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={() => handleGroupSelect(group.group_name)}
                                            >
                                                사용자 보기
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.dangerButton}`}
                                                onClick={() => handleDeleteGroup(group.group_name)}
                                            >
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === 'users' && (
                    <table className={`${styles.table} ${styles.userTable}`}>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>이메일</th>
                                <th>사용자명</th>
                                <th>이름</th>
                                <th>상태</th>
                                <th>등록일</th>
                                <th>마지막 로그인</th>
                                <th>권한</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingUsers ? (
                                <tr>
                                    <td colSpan={9} className={styles.noData}>
                                        사용자 목록을 불러오는 중...
                                    </td>
                                </tr>
                            ) : groupUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className={styles.noData}>
                                        이 조직에 속한 사용자가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                groupUsers.map((user) => (
                                    <tr key={user.id} className={styles.tableRow}>
                                        <td className={styles.userId}>{user.id}</td>
                                        <td className={styles.email}>{user.email}</td>
                                        <td className={styles.username}>{user.username}</td>
                                        <td className={styles.fullName}>{user.full_name || '-'}</td>
                                        <td>{renderStatusBadge(user.is_active)}</td>
                                        <td>{formatDate(user.created_at)}</td>
                                        <td className={styles.lastLogin}>
                                            {user.last_login ? formatDate(user.last_login) : '로그인 기록 없음'}
                                        </td>
                                        <td>
                                            <span className={`${styles.role} ${
                                                user.user_type === 'superuser' ? styles.roleSuperuser :
                                                selectedGroup && isGroupAdmin(user, selectedGroup) ? styles.roleAdmin :
                                                styles.roleUser
                                            }`}>
                                                {user.user_type === 'superuser' ? 'SUPER' :
                                                 selectedGroup && isGroupAdmin(user, selectedGroup) ? 'ADMIN' :
                                                 'USER'}
                                            </span>
                                        </td>
                                        <td className={styles.actions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.dangerButton}`}
                                                onClick={() => handleRemoveUser(user)}
                                                disabled={user.user_type === 'admin' || user.user_type === 'superuser'}
                                                title={
                                                    user.user_type === 'admin' || user.user_type === 'superuser'
                                                        ? '관리자 계정 편집은 불가능합니다'
                                                        : '조직에서 제외'
                                                }
                                            >
                                                제외
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ManagerGroupContent;
