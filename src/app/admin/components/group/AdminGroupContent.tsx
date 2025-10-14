'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { getAllGroups, updateGroupPermissions, deleteGroup, createGroup, getGroupUsers } from '@/app/admin/api/group';
import { removeUserGroup, addUserGroup } from '@/app/admin/api/users';
import { devLog } from '@/app/_common/utils/logger';
import { showSuccessToastKo, showErrorToastKo, showValidationErrorToastKo, showDeleteConfirmToastKo } from '@/app/_common/utils/toastUtilsKo';
import { useAdminAuth } from '@/app/admin/components/helper/AdminAuthGuard';
import styles from '@/app/admin/assets/AdminGroupContent.module.scss';
import AdminGroupAddModal from '@/app/admin/components/group/modals/AdminGroupAddModal';
import AdminGroupCreateModal from '@/app/admin/components/group/modals/AdminGroupCreateModal';
import AdminGroupPermissionModal from '@/app/admin/components/group/modals/AdminGroupPermissionModal';

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

const AdminGroupContent: React.FC = () => {
    const { userType } = useAdminAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

    // superuser만 권한 편집 및 삭제 가능
    const canManageGroupPermissions = userType === 'superuser';

    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState<'groups' | 'users'>('groups');
    const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
    const [groupUsers, setGroupUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // 조직원 추가 모달 상태
    const [showAddUserModal, setShowAddUserModal] = useState(false);

    // 새 그룹 생성 폼 상태
    const [newGroup, setNewGroup] = useState({
        group_name: '',
        available: true,
        available_sections: [] as string[],
        managers: [] as number[]
    });

    // 사용 가능한 섹션 목록
    const availableSectionOptions = [
        'canvas',
        'workflows',
        'documents',
        'prompt-store',
        'workflow-store',
        'data-station',
        'data-storage',
        'train',
        'train-monitor',
        'eval',
        'model-storage',
        'model-upload',
        'model-hub',
        'model-inference',
        'ml-train',
        'ml-train-monitor',
    ];

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

    // 권한 편집 모달 열기
    const handleEditPermissions = (group: Group) => {
        setEditingGroup({ ...group });
        setShowPermissionModal(true);
    };

    // 권한 업데이트 핸들러
    const handleUpdatePermissions = async () => {
        if (!editingGroup) return;

        try {
            await updateGroupPermissions({
                group_name: editingGroup.group_name,
                available: editingGroup.available,
                available_sections: editingGroup.available_sections,
            });

            // 성공 시 목록 새로고침 및 모달 닫기
            await loadGroups();
            setShowPermissionModal(false);
            setEditingGroup(null);

            showSuccessToastKo('조직 권한이 성공적으로 업데이트되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '권한 업데이트에 실패했습니다.';
            devLog.error('Failed to update group permissions:', err);
            showErrorToastKo(`업데이트 실패: ${errorMessage}`);
        }
    };

    // 권한 모달 닫기 핸들러
    const handleClosePermissionModal = () => {
        setShowPermissionModal(false);
        setEditingGroup(null);
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

    // 새 그룹 생성 핸들러
    const handleCreateGroup = async () => {
        try {
            if (!newGroup.group_name.trim()) {
                showValidationErrorToastKo('조직명을 입력해주세요.');
                return;
            }

            await createGroup({
                group_name: newGroup.group_name.trim(),
                available: true, // 항상 true로 설정
                available_sections: newGroup.available_sections,
            });

            // 성공 시 목록 새로고침 및 모달 닫기
            await loadGroups();
            setShowCreateModal(false);
            setNewGroup({
                group_name: '',
                available: true, // 기본값 true 유지
                available_sections: [],
                managers: []
            });

            showSuccessToastKo('조직이 성공적으로 생성되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '조직 생성에 실패했습니다.';
            devLog.error('Failed to create group:', err);
            showErrorToastKo(`생성 실패: ${errorMessage}`);
        }
    };

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
        // 이 경우 백엔드에서 groups 배열을 제공하지 않으므로 is_admin 사용
        return false;
    };

    // 그룹 관리자 권한 토글 핸들러
    const handleToggleAdminPermission = async (user: User) => {
        if (!selectedGroup) return;

        const adminGroupName = `${selectedGroup}__admin__`;
        const isCurrentlyAdmin = isGroupAdmin(user, selectedGroup);

        // 관리자 권한 제거인 경우
        if (isCurrentlyAdmin) {
            const message = `"${user.username}" 사용자의 "${selectedGroup}" 조직 관리자 권한을 제거하시겠습니까?`;

            showDeleteConfirmToastKo({
                title: '권한 변경 확인',
                message: message,
                itemName: user.username,
                confirmText: '제거',
                onConfirm: async () => {
                    try {
                        // 관리자 권한 제거: __admin__ 그룹에서 제거
                        await removeUserGroup({
                            id: user.id,
                            group_name: adminGroupName
                        });
                        showSuccessToastKo('관리자 권한이 제거되었습니다.');

                        // 성공 시 사용자 목록 새로고침
                        await loadGroupUsers(selectedGroup);
                    } catch (err) {
                        const errorMessage = err instanceof Error ? err.message : '권한 변경에 실패했습니다.';
                        devLog.error('Failed to toggle admin permission:', err);
                        showErrorToastKo(`권한 변경 실패: ${errorMessage}`);
                    }
                }
            });
        }
        // 관리자 권한 부여인 경우
        else {
            // is_admin이 false인 경우 추가 확인
            if (!user.is_admin) {
                const message = `"${user.username}" 사용자는 기본 관리자 권한이 없습니다.\n해당 사용자를 관리자로 설정하시겠습니까?\n\n※ 사용자가 자동으로 관리자 권한을 갖게 됩니다.`;

                showDeleteConfirmToastKo({
                    title: '관리자 권한 부여 확인',
                    message: message,
                    itemName: user.username,
                    confirmText: '부여',
                    onConfirm: async () => {
                        try {
                            // 관리자 권한 부여: __admin__ 그룹에 추가
                            await addUserGroup({
                                id: user.id,
                                group_name: adminGroupName
                            });
                            showSuccessToastKo('관리자 권한이 부여되었습니다.');

                            // 성공 시 사용자 목록 새로고침
                            await loadGroupUsers(selectedGroup);
                        } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : '권한 변경에 실패했습니다.';
                            devLog.error('Failed to toggle admin permission:', err);
                            showErrorToastKo(`권한 변경 실패: ${errorMessage}`);
                        }
                    }
                });
            }
            // is_admin이 true인 경우 일반 확인
            else {
                const message = `"${user.username}" 사용자에게 "${selectedGroup}" 조직 관리자 권한을 부여하시겠습니까?`;

                showDeleteConfirmToastKo({
                    title: '권한 변경 확인',
                    message: message,
                    itemName: user.username,
                    confirmText: '부여',
                    onConfirm: async () => {
                        try {
                            // 관리자 권한 부여: __admin__ 그룹에 추가
                            await addUserGroup({
                                id: user.id,
                                group_name: adminGroupName
                            });
                            showSuccessToastKo('관리자 권한이 부여되었습니다.');

                            // 성공 시 사용자 목록 새로고침
                            await loadGroupUsers(selectedGroup);
                        } catch (err) {
                            const errorMessage = err instanceof Error ? err.message : '권한 변경에 실패했습니다.';
                            devLog.error('Failed to toggle admin permission:', err);
                            showErrorToastKo(`권한 변경 실패: ${errorMessage}`);
                        }
                    }
                });
            }
        }
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
                        <span>총 {groups.length}개의 조직</span>
                        {searchTerm && (
                            <span>({filteredGroups.length}개 검색됨)</span>
                        )}
                    </div>

                    <div className={styles.actionButtons}>
                        {canManageGroupPermissions && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={styles.refreshButton}
                            >
                                새 조직 생성
                            </button>
                        )}
                        <button
                            className={`${styles.iconButton} ${loading ? styles.spinning : ''}`}
                            onClick={loadGroups}
                            disabled={loading}
                            title="새로고침"
                        >
                            <FiRefreshCw />
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
                            onClick={() => setShowAddUserModal(true)}
                            className={styles.refreshButton}
                        >
                            조직원 추가
                        </button>
                        <button
                            className={`${styles.iconButton} ${loadingUsers ? styles.spinning : ''}`}
                            onClick={() => selectedGroup && loadGroupUsers(selectedGroup)}
                            disabled={loadingUsers}
                            title="새로고침"
                        >
                            <FiRefreshCw />
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
                                        {loading ? '조직 목록을 불러오는 중...' : searchTerm ? '검색 결과가 없습니다.' : '등록된 조직이 없습니다.'}
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
                                            {canManageGroupPermissions && (
                                                <>
                                                    <button
                                                        className={styles.actionButton}
                                                        onClick={() => handleEditPermissions(group)}
                                                    >
                                                        권한 편집
                                                    </button>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.dangerButton}`}
                                                        onClick={() => handleDeleteGroup(group.group_name)}
                                                    >
                                                        삭제
                                                    </button>
                                                </>
                                            )}
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
                                            {user.user_type === 'superuser' ? (
                                                <span className={`${styles.role} ${styles.roleSuperuser}`}>
                                                    SUPER
                                                </span>
                                            ) : (
                                                <button
                                                    className={`${styles.roleButton} ${
                                                        selectedGroup && isGroupAdmin(user, selectedGroup)
                                                            ? styles.roleButtonAdmin
                                                            : styles.roleButtonUser
                                                    }`}
                                                    onClick={() => handleToggleAdminPermission(user)}
                                                    disabled={!canManageGroupPermissions}
                                                    title={
                                                        !canManageGroupPermissions
                                                            ? '권한이 없습니다'
                                                            : selectedGroup && isGroupAdmin(user, selectedGroup)
                                                            ? '클릭하여 일반 사용자로 변경'
                                                            : '클릭하여 관리자로 변경'
                                                    }
                                                >
                                                    {selectedGroup && isGroupAdmin(user, selectedGroup) ? 'ADMIN' : 'USER'}
                                                </button>
                                            )}
                                        </td>
                                        <td className={styles.actions}>
                                            <button
                                                className={`${styles.actionButton} ${styles.dangerButton}`}
                                                onClick={() => handleRemoveUser(user)}
                                                disabled={user.user_type === 'superuser'}
                                                title={
                                                    user.user_type === 'superuser'
                                                        ? 'Superuser는 제외할 수 없습니다'
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

            {/* 그룹 생성 모달 */}
            <AdminGroupCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                groupName={newGroup.group_name}
                onGroupNameChange={(name) => setNewGroup({...newGroup, group_name: name})}
                onCreate={handleCreateGroup}
            />

            {/* 권한 편집 모달 */}
            <AdminGroupPermissionModal
                isOpen={showPermissionModal}
                onClose={handleClosePermissionModal}
                group={editingGroup}
                onGroupChange={setEditingGroup}
                onUpdate={handleUpdatePermissions}
                availableSectionOptions={availableSectionOptions}
            />

            {/* 조직원 추가 모달 */}
            {showAddUserModal && selectedGroup && (
                <AdminGroupAddModal
                    isOpen={showAddUserModal}
                    onClose={() => setShowAddUserModal(false)}
                    groupName={selectedGroup}
                    onSuccess={() => {
                        // 사용자 목록 새로고침
                        loadGroupUsers(selectedGroup);
                    }}
                />
            )}
        </div>
    );
};

export default AdminGroupContent;
