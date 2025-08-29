'use client';

import React, { useState, useEffect } from 'react';
import { getAllGroups, updateGroupPermissions, deleteGroup, createGroup, getGroupUsers } from '@/app/admin/api/group';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminGroupContent.module.scss';
import AdminGroupAddModal from './AdminGroupAddModal';

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
    last_login?: string | null;
    password_hash?: string;
    preferences?: any;
}

const AdminGroupContent: React.FC = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);

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
        'train',
        'train-monitor',
        'eval',
        'storage'
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

            alert('조직 권한이 성공적으로 업데이트되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '권한 업데이트에 실패했습니다.';
            devLog.error('Failed to update group permissions:', err);
            alert(`업데이트 실패: ${errorMessage}`);
        }
    };

    // 그룹 삭제 핸들러
    const handleDeleteGroup = async (groupName: string) => {
        if (!confirm(`정말로 "${groupName}" 조직을 삭제하시겠습니까?\n이 조직에 속한 사용자들은 'none' 그룹으로 이동됩니다.`)) {
            return;
        }

        try {
            await deleteGroup(groupName);

            // 성공 시 목록 새로고침
            await loadGroups();
            alert('조직이 성공적으로 삭제되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '조직 삭제에 실패했습니다.';
            devLog.error('Failed to delete group:', err);
            alert(`삭제 실패: ${errorMessage}`);
        }
    };

    // 섹션 선택/해제 핸들러
    const handleSectionToggle = (section: string) => {
        if (!editingGroup) return;

        const currentSections = editingGroup.available_sections || [];
        const newSections = currentSections.includes(section)
            ? currentSections.filter(s => s !== section)
            : [...currentSections, section];

        setEditingGroup({
            ...editingGroup,
            available_sections: newSections
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
                alert('조직명을 입력해주세요.');
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

            alert('조직이 성공적으로 생성되었습니다.');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '조직 생성에 실패했습니다.';
            devLog.error('Failed to create group:', err);
            alert(`생성 실패: ${errorMessage}`);
        }
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
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={styles.refreshButton}
                        >
                            새 조직 생성
                        </button>
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
                            onClick={() => setShowAddUserModal(true)}
                            className={styles.refreshButton}
                        >
                            조직원 추가
                        </button>
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
                                <th>조직</th>
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
                                                user.user_type === 'admin' ? styles.roleAdmin :
                                                user.user_type === 'standard' ? styles.roleUser :
                                                styles.roleUnknown
                                            }`}>
                                                {user.user_type === 'superuser' ? 'SUPER' :
                                                 user.user_type === 'admin' ? 'ADMIN' :
                                                 user.user_type === 'standard' ? 'USER' :
                                                 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td className={styles.groupName}>
                                            {user.group_name || selectedGroup || '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* 그룹 생성 모달 */}
            {showCreateModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>새 조직 생성</h3>
                        <div className={styles.formGroup}>
                            <label>조직명 *</label>
                            <input
                                type="text"
                                value={newGroup.group_name}
                                onChange={(e) => setNewGroup({...newGroup, group_name: e.target.value})}
                                placeholder="조직명을 입력하세요"
                                className={styles.formInput}
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className={styles.cancelButton}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                className={styles.createButton}
                            >
                                생성
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 권한 편집 모달 */}
            {showPermissionModal && editingGroup && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h3>권한 변경 - {editingGroup.group_name}</h3>

                        <div className={styles.formGroup}>
                            <button
                                type="button"
                                className={`${styles.statusToggleButton} ${
                                    editingGroup.available
                                        ? styles.statusToggleActive
                                        : styles.statusToggleInactive
                                }`}
                                onClick={() => setEditingGroup({
                                    ...editingGroup,
                                    available: !editingGroup.available
                                })}
                            >
                                {editingGroup.available ? '활성화 상태입니다.' : '비활성화 상태입니다.'}
                            </button>
                        </div>

                        <div className={styles.formGroup}>
                            <label>사용 가능한 섹션</label>
                            <div className={styles.sectionGrid}>
                                {availableSectionOptions.map((section) => (
                                    <button
                                        key={section}
                                        type="button"
                                        className={`${styles.sectionButton} ${
                                            editingGroup.available_sections?.includes(section)
                                                ? styles.sectionButtonActive
                                                : styles.sectionButtonInactive
                                        }`}
                                        onClick={() => handleSectionToggle(section)}
                                    >
                                        {section}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                onClick={() => {
                                    setShowPermissionModal(false);
                                    setEditingGroup(null);
                                }}
                                className={styles.cancelButton}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleUpdatePermissions}
                                className={styles.createButton}
                            >
                                권한 업데이트
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
