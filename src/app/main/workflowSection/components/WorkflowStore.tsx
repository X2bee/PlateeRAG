'use client';
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../assets/WorkflowStore.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { useAuth } from '@/app/_common/components/CookieProvider';
import {
    showDeleteConfirmToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
    showCopySuccessToastKo
} from '@/app/_common/utils/toastUtilsKo';
import {
    IoSearch,
    IoRefresh,
    IoPerson,
    IoCalendar,
    IoCopy,
    IoSearchOutline,
    IoAdd,
    IoTrash,
    IoPencil
} from 'react-icons/io5';

interface Workflow {
    id: number;
    workflow_uid: string;
    workflow_title: string;
    workflow_content: string;
    public_available: boolean;
    is_template: boolean;
    language: string;
    user_id?: string;
    username?: string;
    full_name?: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
}

interface WorkflowStoreProps {
    onWorkflowSelect?: (workflow: Workflow) => void;
    className?: string;
}

const WorkflowStore: React.FC<WorkflowStoreProps> = ({ onWorkflowSelect, className }) => {
    // 상태 관리
    const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en'>('ko');
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'my' | 'template' | 'shared'>('my');

    // 현재 로그인한 사용자 정보 가져오기
    const { user } = useAuth();

    // 워크플로우 데이터 로딩
    const loadWorkflows = async (language: 'ko' | 'en') => {
        try {
            setLoading(true);
            setError(null);

            devLog.info(`Loading workflows for language: ${language}`);

            // TODO: API 호출 구현 필요
            // const response = await getWorkflowsByLanguage(language, 300);

            // 임시 데이터
            setWorkflows([]);
            devLog.info(`Loaded 0 workflows for ${language}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '워크플로우를 불러오는데 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to load workflows:', err);
            setWorkflows([]);
        } finally {
            setLoading(false);
        }
    };

    // 언어 변경 시 워크플로우 다시 로딩
    useEffect(() => {
        loadWorkflows(selectedLanguage);
    }, [selectedLanguage]);

    // 필터링된 워크플로우 계산
    const filteredWorkflows = useMemo(() => {
        return workflows.filter(workflow => {
            // 검색어 필터
            const matchesSearch = !searchTerm ||
                workflow.workflow_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                workflow.workflow_content.toLowerCase().includes(searchTerm.toLowerCase());

            // 필터 모드에 따른 필터링
            let matchesFilter = true;

            if (filterMode === 'my') {
                // My: 자신의 것만 표시
                matchesFilter = !!(user && workflow.user_id && String(workflow.user_id) === String(user.user_id));
            } else if (filterMode === 'template') {
                // 템플릿: is_template이 true인 것만 표시
                matchesFilter = workflow.is_template === true;
            } else if (filterMode === 'shared') {
                // 공유: public_available이 true이면서 is_template가 false인 것만 표시
                matchesFilter = workflow.public_available === true && workflow.is_template === false;
            }
            // filterMode === 'all'인 경우 matchesFilter는 true 유지

            return matchesSearch && matchesFilter;
        });
    }, [workflows, searchTerm, filterMode, user]);

    // 언어 탭 변경 핸들러
    const handleLanguageChange = (language: 'ko' | 'en') => {
        setSelectedLanguage(language);
        setSearchTerm(''); // 언어 변경 시 검색어 초기화
    };

    // 검색어 변경 핸들러
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // 워크플로우 카드 클릭 핸들러
    const handleWorkflowClick = (workflow: Workflow) => {
        setSelectedWorkflow(workflow);
        setIsModalOpen(true);
    };

    // 워크플로우 복사 핸들러
    const handleCopyWorkflow = async (workflow: Workflow, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(workflow.workflow_content);
            showCopySuccessToastKo('클립보드에 복사되었습니다!');
            devLog.info(`Copied workflow: ${workflow.workflow_title}`);
        } catch (err) {
            devLog.error('Failed to copy workflow:', err);
        }
    };

    // 워크플로우 삭제 핸들러
    const handleDeleteWorkflow = async (workflow: Workflow, e: React.MouseEvent) => {
        e.stopPropagation();

        showDeleteConfirmToastKo({
            title: '워크플로우 삭제 확인',
            message: `'${workflow.workflow_title}' 워크플로우를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: workflow.workflow_title,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    // TODO: API 호출 구현 필요
                    // await deleteWorkflow({ workflow_uid: workflow.workflow_uid });

                    showDeleteSuccessToastKo({
                        itemName: workflow.workflow_title,
                        itemType: '워크플로우',
                    });

                    // 워크플로우 목록 새로고침
                    await loadWorkflows(selectedLanguage);
                } catch (error) {
                    devLog.error('Failed to delete workflow:', error);
                    showDeleteErrorToastKo({
                        itemName: workflow.workflow_title,
                        itemType: '워크플로우',
                        error: error instanceof Error ? error : 'Unknown error',
                    });
                } finally {
                    setLoading(false);
                }
            },
            confirmText: '삭제',
            cancelText: '취소',
        });
    };

    // 새로고침 핸들러
    const handleRefresh = () => {
        loadWorkflows(selectedLanguage);
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedWorkflow(null);
    };

    // 워크플로우 생성 모달 열기 핸들러
    const handleCreateWorkflowClick = () => {
        setIsCreateModalOpen(true);
    };

    // 워크플로우 생성 모달 닫기 핸들러
    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    // 워크플로우 생성 성공 핸들러
    const handleCreateSuccess = () => {
        // 워크플로우 목록 새로고침
        loadWorkflows(selectedLanguage);
    };

    // 워크플로우 편집 모달 열기 핸들러
    const handleEditWorkflowClick = (workflow: Workflow, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingWorkflow(workflow);
        setIsEditModalOpen(true);
    };

    // 워크플로우 편집 모달 닫기 핸들러
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingWorkflow(null);
    };

    // 워크플로우 편집 성공 핸들러
    const handleEditSuccess = () => {
        // 워크플로우 목록 새로고침
        loadWorkflows(selectedLanguage);
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // 텍스트 자르기 함수
    const truncateText = (text: string, maxLength: number = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className={`${styles.container} ${className || ''}`}>
            {/* 헤더 섹션 */}
            <div className={styles.header}>
                <div className={styles.headerControls}>
                    {/* 필터 및 검색 섹션 */}
                    <div className={styles.filterSection}>
                        <div className={styles.searchContainer}>
                            <input
                                type="text"
                                placeholder="워크플로우 검색..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className={styles.searchInput}
                            />
                            <IoSearch className={styles.searchIcon} />
                        </div>

                        {/* 언어 탭 */}
                        <div className={styles.languageTabs}>
                            <button
                                className={`${styles.languageTab} ${selectedLanguage === 'ko' ? styles.active : ''}`}
                                onClick={() => handleLanguageChange('ko')}
                            >
                                <span className={styles.tabIcon}>🇰🇷</span>
                                한국어
                            </button>
                            <button
                                className={`${styles.languageTab} ${selectedLanguage === 'en' ? styles.active : ''}`}
                                onClick={() => handleLanguageChange('en')}
                            >
                                <span className={styles.tabIcon}>🇺🇸</span>
                                English
                            </button>
                        </div>

                        {/* 필터 탭 */}
                        <div className={styles.filterTabs}>
                            <button
                                className={`${styles.filterTab} ${filterMode === 'all' ? styles.active : ''}`}
                                onClick={() => setFilterMode('all')}
                            >
                                모두
                            </button>
                            <button
                                className={`${styles.filterTab} ${filterMode === 'my' ? styles.active : ''}`}
                                onClick={() => setFilterMode('my')}
                            >
                                My
                            </button>
                            <button
                                className={`${styles.filterTab} ${filterMode === 'template' ? styles.active : ''}`}
                                onClick={() => setFilterMode('template')}
                            >
                                템플릿
                            </button>
                            <button
                                className={`${styles.filterTab} ${filterMode === 'shared' ? styles.active : ''}`}
                                onClick={() => setFilterMode('shared')}
                            >
                                공유
                            </button>
                        </div>

                        <button
                            className={styles.refreshButton}
                            onClick={handleRefresh}
                            disabled={loading}
                        >
                            <IoRefresh className={styles.refreshIcon} />
                        </button>
                    </div>
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.loadingSpinner}></div>
                        <div className={styles.loadingText}>워크플로우를 불러오는 중...</div>
                    </div>
                ) : error ? (
                    <div className={styles.noResults}>
                        <IoSearchOutline className={styles.noResultsIcon} />
                        <h3>오류가 발생했습니다</h3>
                        <p>{error}</p>
                    </div>
                ) : filteredWorkflows.length === 0 ? (
                    <div className={styles.noResults}>
                        <IoSearchOutline className={styles.noResultsIcon} />
                        <h3>검색 결과가 없습니다</h3>
                        <p>
                            {searchTerm
                                ? `"${searchTerm}"에 대한 검색 결과를 찾을 수 없습니다.`
                                : '해당 조건에 맞는 워크플로우가 없습니다.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className={styles.workflowGrid}>
                        {/* 나만의 워크플로우 추가 카드 */}
                        <div className={styles.addWorkflowCard} onClick={handleCreateWorkflowClick}>
                            <div className={styles.addWorkflowContent}>
                                <div className={styles.addWorkflowIcon}>
                                    <IoAdd />
                                </div>
                                <h3 className={styles.addWorkflowTitle}>나만의 워크플로우를 추가해 보세요!</h3>
                                <p className={styles.addWorkflowDescription}>
                                    새로운 워크플로우를 생성하여 다른 사용자들과 공유하거나 개인용으로 사용하세요.
                                </p>
                            </div>
                        </div>

                        {filteredWorkflows.map((workflow) => (
                                <div
                                    key={workflow.id}
                                    className={styles.workflowCard}
                                    onClick={() => handleWorkflowClick(workflow)}
                                >
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.cardTitle}>{workflow.workflow_title}</h3>
                                        <div className={styles.cardBadges}>
                                            <span className={`${styles.badge} ${styles.language}`}>
                                                {workflow.language.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <div className={styles.contentPreview}>
                                            {truncateText(workflow.workflow_content)}
                                        </div>
                                        <div className={styles.contentMeta}>
                                            <div className={styles.metaItem}>
                                                <IoCalendar className={styles.metaIcon} />
                                                {formatDate(workflow.created_at)}
                                            </div>
                                            {workflow.user_id && workflow.username && (
                                                <div className={styles.metaItem}>
                                                    <IoPerson className={styles.metaIcon} />
                                                    {workflow.username || ''} ({workflow.user_id || ''})
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.infoItem}>
                                                <span>문자수: {workflow.workflow_content.length}</span>
                                            </div>
                                        </div>
                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={(e) => handleCopyWorkflow(workflow, e)}
                                                title="워크플로우 복사"
                                            >
                                                <IoCopy className={styles.actionIcon} />
                                                복사
                                            </button>
                                            {user && workflow.user_id && String(workflow.user_id) === String(user.user_id) && (
                                                <>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.editButton}`}
                                                        onClick={(e) => handleEditWorkflowClick(workflow, e)}
                                                        title="워크플로우 편집"
                                                    >
                                                        <IoPencil className={styles.actionIcon} />
                                                        편집
                                                    </button>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                                        onClick={(e) => handleDeleteWorkflow(workflow, e)}
                                                        title="워크플로우 삭제"
                                                    >
                                                        <IoTrash className={styles.actionIcon} />
                                                        삭제
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* TODO: 워크플로우 확장 모달 컴포넌트 추가 필요 */}
            {/* {selectedWorkflow && (
                <WorkflowExpandModal
                    workflow={selectedWorkflow}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )} */}

            {/* TODO: 워크플로우 생성 모달 컴포넌트 추가 필요 */}
            {/* <WorkflowCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSuccess={handleCreateSuccess}
            /> */}

            {/* TODO: 워크플로우 편집 모달 컴포넌트 추가 필요 */}
            {/* {editingWorkflow && (
                <WorkflowEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onSuccess={handleEditSuccess}
                    workflow={editingWorkflow}
                />
            )} */}
        </div>
    );
};

export default WorkflowStore;
