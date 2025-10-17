'use client';
import React, { useState, useEffect, useMemo } from 'react';
import styles from '@/app/main/workflowSection/assets/WorkflowStore.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { useAuth } from '@/app/_common/components/CookieProvider';
import {
    showDeleteConfirmToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
    showCopySuccessToastKo,
    showWarningConfirmToastKo,
    showSuccessToastKo,
    showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import {
    IoSearch,
    IoPerson,
    IoCalendar,
    IoCopy,
    IoSearchOutline,
    IoAdd,
    IoTrash,
    IoPencil,
    IoStar,
    IoStarOutline
} from 'react-icons/io5';
import RefreshButton from '@/app/_common/icons/refresh';
import UploadButton from '@/app/_common/icons/upload';
import WorkflowStoreUploadModal from './WorkflowStoreUploadModal';
import WorkflowStoreDetailModal from './WorkflowStoreDetailModal';
import { listWorkflowStore, deleteWorkflowFromStore, duplicateWorkflowFromStore, rateWorkflow } from '@/app/_common/api/workflow/workflowStoreAPI';

interface Workflow {
    id: number;
    created_at: string;
    updated_at: string;
    current_version: number;
    description: string;
    edge_count: number;
    full_name?: string;
    has_endnode: boolean;
    has_startnode: boolean;
    is_completed: boolean;
    is_template: boolean;
    latest_version: number;
    metadata?: any;
    workflow_data?: any; // API에서 제공하는 워크플로우 전체 데이터 (nodes, edges, view 포함)
    node_count: number;
    tags?: string[] | null;
    user_id?: number;
    username?: string;
    workflow_id: string;
    workflow_name: string;
    workflow_upload_name: string;
    rating_count?: number;
    rating_sum?: number;
}

interface WorkflowStoreProps {
    onWorkflowSelect?: (workflow: Workflow) => void;
    className?: string;
    activeTab: 'storage' | 'store';
    onTabChange: (tab: 'storage' | 'store') => void;
    onStorageRefresh?: () => void | Promise<void>;
}

const WorkflowStore: React.FC<WorkflowStoreProps> = ({ onWorkflowSelect, className, activeTab, onTabChange, onStorageRefresh }) => {
    // 상태 관리
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'my' | 'template' | 'shared'>('all');
    const [hoveredRating, setHoveredRating] = useState<{ workflowId: number; rating: number } | null>(null);

    // 현재 로그인한 사용자 정보 가져오기
    const { user } = useAuth();

    // 워크플로우 데이터 로딩
    const loadWorkflows = async () => {
        try {
            setLoading(true);
            setError(null);

            devLog.info('Loading workflows from store');

            const workflowList = await listWorkflowStore();
            setWorkflows(workflowList as Workflow[]);
            devLog.info(`Loaded ${workflowList.length} workflows from store`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '워크플로우를 불러오는데 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to load workflows:', err);
            setWorkflows([]);
        } finally {
            setLoading(false);
        }
    };

    // 초기 로딩
    useEffect(() => {
        loadWorkflows();
    }, []);

    // 필터링된 워크플로우 계산
    const filteredWorkflows = useMemo(() => {
        return workflows.filter(workflow => {
            // 검색어 필터
            const matchesSearch = !searchTerm ||
                workflow.workflow_upload_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                workflow.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                workflow.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (workflow.tags && workflow.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));

            // 필터 모드에 따른 필터링
            let matchesFilter = true;

            if (filterMode === 'my') {
                // My: 자신의 것만 표시
                matchesFilter = !!(user && workflow.user_id && workflow.user_id === user.user_id);
            } else if (filterMode === 'template') {
                // 템플릿: is_template이 true인 것만 표시
                matchesFilter = workflow.is_template === true;
            } else if (filterMode === 'shared') {
                // 공유: is_template가 false인 것만 표시 (다른 사용자의 것)
                matchesFilter = workflow.is_template === false &&
                                (!user || !workflow.user_id || workflow.user_id !== user.user_id);
            }
            // filterMode === 'all'인 경우 matchesFilter는 true 유지

            return matchesSearch && matchesFilter;
        });
    }, [workflows, searchTerm, filterMode, user]);

    // 검색어 변경 핸들러
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // 워크플로우 카드 클릭 핸들러
    const handleWorkflowClick = (workflow: Workflow) => {
        setSelectedWorkflow(workflow);
        setIsModalOpen(true);
    };

    // 모달에서 워크플로우 복사 핸들러
    const handleCopyWorkflowFromModal = async (workflow: Workflow) => {
        if (!workflow.is_template && !workflow.user_id) {
            showErrorToastKo('워크플로우 소유자 정보를 찾을 수 없습니다.');
            return;
        }

        try {
            setLoading(true);

            const userId = (workflow.is_template && !workflow.user_id) ? undefined : workflow.user_id;

            await duplicateWorkflowFromStore(
                workflow.workflow_name,
                workflow.workflow_upload_name,
                userId as any,
                workflow.current_version
            );

            showSuccessToastKo('워크플로우가 성공적으로 복제되었습니다!');
            devLog.info(`Duplicated workflow from modal: ${workflow.workflow_upload_name}`);

            await loadWorkflows();

            // CompletedWorkflows 목록도 새로고침
            if (onStorageRefresh) {
                await onStorageRefresh();
                devLog.info('CompletedWorkflows refreshed after workflow copy');
            }

            setIsModalOpen(false);
            setSelectedWorkflow(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '워크플로우 복제에 실패했습니다.';
            devLog.error('Failed to duplicate workflow from modal:', err);
            showErrorToastKo(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 워크플로우 복사 핸들러
    const handleCopyWorkflow = async (workflow: Workflow, e: React.MouseEvent) => {
        e.stopPropagation();

        // is_template가 true가 아닌 경우에만 user_id 체크
        if (!workflow.is_template && !workflow.user_id) {
            showErrorToastKo('워크플로우 소유자 정보를 찾을 수 없습니다.');
            return;
        }

        showWarningConfirmToastKo({
            title: '워크플로우 복제 확인',
            message: `'${workflow.workflow_upload_name}' 워크플로우를 내 워크플로우로 복제하시겠습니까?\n복제된 워크플로우는 내 워크플로우 목록에 추가됩니다.`,
            onConfirm: async () => {
                try {
                    setLoading(true);

                    // is_template가 true이고 user_id가 없으면 undefined, 아니면 user_id 사용
                    const userId = (workflow.is_template && !workflow.user_id) ? undefined : workflow.user_id;

                    await duplicateWorkflowFromStore(
                        workflow.workflow_name,
                        workflow.workflow_upload_name,
                        userId as any,
                        workflow.current_version
                    );

                    showSuccessToastKo('워크플로우가 성공적으로 복제되었습니다!');
                    devLog.info(`Duplicated workflow: ${workflow.workflow_upload_name}`);

                    // 워크플로우 목록 새로고침
                    await loadWorkflows();

                    // CompletedWorkflows 목록도 새로고침
                    if (onStorageRefresh) {
                        await onStorageRefresh();
                        devLog.info('CompletedWorkflows refreshed after workflow copy');
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : '워크플로우 복제에 실패했습니다.';
                    devLog.error('Failed to duplicate workflow:', err);
                    showErrorToastKo(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            confirmText: '복제',
            cancelText: '취소',
        });
    };

    // 워크플로우 삭제 핸들러
    const handleDeleteWorkflow = async (workflow: Workflow, e: React.MouseEvent) => {
        e.stopPropagation();

        showDeleteConfirmToastKo({
            title: '워크플로우 삭제 확인',
            message: `'${workflow.workflow_upload_name}' 워크플로우를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: workflow.workflow_upload_name,
            onConfirm: async () => {
                try {
                    setLoading(true);

                    await deleteWorkflowFromStore(
                        workflow.workflow_name,
                        workflow.workflow_upload_name,
                        workflow.current_version
                    );

                    showDeleteSuccessToastKo({
                        itemName: workflow.workflow_upload_name,
                        itemType: '워크플로우',
                    });

                    // 워크플로우 목록 새로고침
                    await loadWorkflows();
                } catch (error) {
                    devLog.error('Failed to delete workflow:', error);
                    showDeleteErrorToastKo({
                        itemName: workflow.workflow_upload_name,
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
        loadWorkflows();
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
        loadWorkflows();
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
        loadWorkflows();
    };

    // 워크플로우 업로드 모달 열기 핸들러
    const handleUploadClick = () => {
        setIsUploadModalOpen(true);
    };

    // 워크플로우 업로드 모달 닫기 핸들러
    const handleCloseUploadModal = () => {
        setIsUploadModalOpen(false);
    };

    // 워크플로우 업로드 성공 핸들러
    const handleUploadSuccess = () => {
        // 워크플로우 목록 새로고침
        loadWorkflows();
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

    // 평균 평점 계산 함수
    const calculateAverageRating = (workflow: Workflow) => {
        if (!workflow.rating_count || workflow.rating_count === 0) return 0;
        return workflow.rating_sum! / workflow.rating_count;
    };

    // 워크플로우 평가 핸들러
    const handleRateWorkflow = async (workflow: Workflow, rating: number, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            showErrorToastKo('평가하려면 로그인이 필요합니다.');
            return;
        }

        try {
            setLoading(true);

            await rateWorkflow(
                workflow.workflow_name,
                workflow.workflow_upload_name,
                workflow.user_id || 0,
                workflow.is_template,
                workflow.current_version,
                rating
            );

            showSuccessToastKo(`${rating}점으로 평가되었습니다!`);
            devLog.info(`Rated workflow: ${workflow.workflow_upload_name} with ${rating} stars`);

            // 워크플로우 목록 새로고침
            await loadWorkflows();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '워크플로우 평가에 실패했습니다.';
            devLog.error('Failed to rate workflow:', err);
            showErrorToastKo(errorMessage);
        } finally {
            setLoading(false);
            setHoveredRating(null);
        }
    };

    // 별 렌더링 함수
    const renderStars = (workflow: Workflow) => {
        const avgRating = calculateAverageRating(workflow);
        const stars = [];
        const currentHovered = hoveredRating?.workflowId === workflow.id ? hoveredRating.rating : 0;

        for (let i = 1; i <= 5; i++) {
            const isFilled = currentHovered > 0 ? i <= currentHovered : i <= Math.round(avgRating);
            stars.push(
                <span
                    key={i}
                    className={`${styles.star} ${isFilled ? styles.filled : ''}`}
                    onMouseEnter={() => setHoveredRating({ workflowId: workflow.id, rating: i })}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={(e) => handleRateWorkflow(workflow, i, e)}
                >
                    {isFilled ? <IoStar /> : <IoStarOutline />}
                </span>
            );
        }

        return (
            <div className={styles.ratingContainer}>
                <div className={styles.stars}>
                    {stars}
                </div>
                {workflow.rating_count && workflow.rating_count > 0 ? (
                    <span className={styles.ratingText}>
                        {avgRating.toFixed(1)} ({workflow.rating_count})
                    </span>
                ) : (
                    <span className={styles.noRatingText}>
                        평가 없음
                    </span>
                )}
            </div>
        );
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

                        {/* 저장소/스토어 탭 */}
                        <div className={styles.languageTabs}>
                            <button
                                onClick={() => onTabChange('storage')}
                                className={`${styles.languageTab} ${activeTab === 'storage' ? styles.active : ''}`}
                            >
                                저장소
                            </button>
                            <button
                                onClick={() => onTabChange('store')}
                                className={`${styles.languageTab} ${activeTab === 'store' ? styles.active : ''}`}
                            >
                                스토어
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

                        <UploadButton
                            onClick={handleUploadClick}
                            disabled={loading}
                            title="워크플로우 업로드"
                        />

                        <RefreshButton
                            onClick={handleRefresh}
                            loading={loading}
                            disabled={loading}
                            title="새로고침"
                        />
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
                        <div className={styles.addWorkflowCard} onClick={handleUploadClick}>
                            <div className={styles.addWorkflowContent}>
                                <div className={styles.addWorkflowIcon}>
                                    <IoAdd />
                                </div>
                                <h3 className={styles.addWorkflowTitle}>나만의 워크플로우를 추가해 보세요!</h3>
                                <p className={styles.addWorkflowDescription}>
                                    내가 만든 워크플로우를 사용자들과 공유해보세요!
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
                                        <h3 className={styles.cardTitle}>{workflow.workflow_upload_name}</h3>
                                        <div className={styles.cardBadges}>
                                            <span className={`${styles.badge} ${styles.version}`}>
                                                v{workflow.current_version}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <div className={styles.contentPreview}>
                                            {truncateText(workflow.description || '설명 없음')}
                                        </div>

                                        {/* 평점 표시 */}
                                        {renderStars(workflow)}

                                        <div className={styles.contentMeta}>
                                            <div className={styles.metaItem}>
                                                <IoCalendar className={styles.metaIcon} />
                                                {formatDate(workflow.created_at)}
                                            </div>
                                            {workflow.is_template && (
                                                <span className={styles.templateBadge}>
                                                    템플릿
                                                </span>
                                            )}
                                            {workflow.user_id && workflow.username && (
                                                <div className={styles.metaItem}>
                                                    <IoPerson className={styles.metaIcon} />
                                                    {workflow.full_name || workflow.username}
                                                </div>
                                            )}
                                        </div>
                                        {workflow.tags && workflow.tags.length > 0 && (
                                            <div className={styles.tags}>
                                                {workflow.tags.map((tag, index) => (
                                                    <span key={index} className={styles.tag}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.infoItem}>
                                                <span>노드: {workflow.node_count} | 엣지: {workflow.edge_count}</span>
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
                                                <button
                                                    className={`${styles.actionButton} ${styles.deleteButton}`}
                                                    onClick={(e) => handleDeleteWorkflow(workflow, e)}
                                                    title="워크플로우 삭제"
                                                >
                                                    <IoTrash className={styles.actionIcon} />
                                                    삭제
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            {/* 워크플로우 상세보기 모달 */}
            {selectedWorkflow && (
                <WorkflowStoreDetailModal
                    workflow={selectedWorkflow}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onCopy={handleCopyWorkflowFromModal}
                />
            )}

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

            {/* 워크플로우 업로드 모달 */}
            <WorkflowStoreUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                onSuccess={handleUploadSuccess}
            />
        </div>
    );
};

export default WorkflowStore;
