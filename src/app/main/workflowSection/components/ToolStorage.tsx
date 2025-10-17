'use client';
import React, { useState, useEffect } from 'react';
import {
    FiFolder,
    FiPlay,
    FiEdit,
    FiTrash2,
    FiUser,
    FiClock,
    FiUsers,
    FiSettings,
    FiCopy,
    FiGitBranch,
    FiMoreVertical,
} from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/ToolStorage.module.scss';
import RefreshButton from '@/app/_common/icons/refresh';
import UploadButton from '@/app/_common/icons/upload';
import ToolStorageUpload from '@/app/main/workflowSection/components/ToolStorageUpload';
import ToolStorageDetailModal from '@/app/main/workflowSection/components/ToolStorageDetailModal';
import { listTools } from '@/app/_common/api/toolsAPI';
import { showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import { devLog } from '@/app/_common/utils/logger';

const ToolStorage: React.FC = () => {
    const [tools, setTools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<
        'all' | 'active' | 'unactive'
    >('all');
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'storage' | 'upload'>('storage');
    const [selectedTool, setSelectedTool] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const fetchTools = async () => {
        try {
            setLoading(true);
            setError(null);

            devLog.log('Fetching tools from API...');
            const toolsData = await listTools();
            devLog.log('Tools fetched successfully:', toolsData);

            setTools(toolsData);
        } catch (error) {
            devLog.error('Failed to fetch tools:', error);
            const errorMessage = error instanceof Error ? error.message : '도구를 불러오는데 실패했습니다.';
            setError(errorMessage);
            showErrorToastKo(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTools();
    }, []);

    // 드롭다운 외부 클릭 감지
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(`.${styles.dropdownContainer}`)) {
                setOpenDropdown(null);
            }
        };

        if (openDropdown !== null) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [openDropdown]);

    const toggleDropdown = (toolKey: number) => {
        setOpenDropdown(openDropdown === toolKey ? null : toolKey);
    };

    // 도구 업로드 페이지로 전환
    const handleUploadClick = () => {
        setViewMode('upload');
    };

    // 도구 저장소 페이지로 돌아가기
    const handleBackToStorage = () => {
        setViewMode('storage');
        fetchTools();
    };

    // 도구 상세 모달 열기
    const handleToolClick = (tool: any) => {
        setSelectedTool(tool);
        setIsDetailModalOpen(true);
    };

    // 도구 상세 모달 닫기
    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTool(null);
    };

    // 도구 필터링
    const getFilteredTools = () => {
        if (filter === 'all') {
            return tools;
        } else if (filter === 'active') {
            return tools.filter(tool => tool.status === 'active');
        } else if (filter === 'unactive') {
            return tools.filter(tool => tool.status === 'inactive');
        }
        return tools;
    };

    const filteredTools = getFilteredTools();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return styles.statusActive;
            case 'draft':
                return styles.statusDraft;
            case 'archived':
                return styles.statusArchived;
            case 'inactive':
                return styles.statusUnactive;
            default:
                return styles.statusActive;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return '활성';
            case 'draft':
                return '초안';
            case 'archived':
                return '보관됨';
            case 'inactive':
                return '비활성';
            default:
                return '활성';
        }
    };

    // 업로드 모드일 때 업로드 컴포넌트 렌더링
    if (viewMode === 'upload') {
        return <ToolStorageUpload onBack={handleBackToStorage} />;
    }

    return (
        <div className={styles.container}>
            {/* Header with Filters */}
            <div className={styles.header}>
                <div className={styles.headerActions}>
                    <div className={styles.filters}>
                        <div className={styles.filterGroup}>
                            {['all', 'active', 'unactive'].map(
                                (filterType) => (
                                    <button
                                        key={filterType}
                                        onClick={() => setFilter(filterType as any)}
                                        className={`${styles.filterButton} ${filter === filterType ? styles.active : ''}`}
                                    >
                                        {filterType === 'all'
                                            ? '전체'
                                            : filterType === 'active'
                                              ? '활성'
                                              : '비활성'}
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    <UploadButton
                        onClick={handleUploadClick}
                        disabled={loading}
                        title="도구 업로드"
                    />

                    <RefreshButton
                        onClick={fetchTools}
                        loading={loading}
                        disabled={loading}
                        title="새로고침"
                    />
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className={styles.loadingState}>
                    <p>도구를 불러오는 중...</p>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className={styles.errorState}>
                    <p>{error}</p>
                    <button onClick={fetchTools}>다시 시도</button>
                </div>
            )}

            {/* Tools Grid */}
            {!loading && !error && (
                <div className={styles.workflowsGrid}>
                    {filteredTools.map((tool) => (
                        <div
                            key={tool.id}
                            className={`${styles.workflowCard} ${openDropdown === tool.id ? styles.cardActive : ''}`}
                            onClick={() => handleToolClick(tool)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.workflowIcon}>
                                    <FiFolder />
                                </div>
                                <div className={styles.statusContainer}>
                                    <div
                                        className={`${styles.status} ${getStatusColor(tool.status)}`}
                                    >
                                        {getStatusText(tool.status)}
                                    </div>
                                    <div
                                        className={`${styles.shareStatus} ${tool.is_shared ? styles.statusShared : styles.statusPersonal}`}
                                    >
                                        {tool.is_shared ? '공유' : '개인'}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.cardContent}>
                                <h3 className={styles.workflowName} title={tool.function_name}>
                                    {tool.function_name}
                                </h3>
                                {tool.description && (
                                    <p className={styles.workflowDescription}>
                                        {tool.description}
                                    </p>
                                )}

                                <div className={styles.workflowMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span title={tool.full_name || tool.username}>{tool.full_name || tool.username}</span>
                                    </div>
                                    {tool.updated_at && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span title={new Date(tool.updated_at).toLocaleString('ko-KR')}>
                                                {new Date(tool.updated_at).toLocaleDateString('ko-KR')}
                                            </span>
                                        </div>
                                    )}
                                    {tool.share_group && (
                                        <div className={styles.metaItem}>
                                            <FiUsers />
                                            <span title={`조직: ${tool.share_group}`}>조직: {tool.share_group}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardActions}>
                                {tool.status === 'inactive' ? (
                                    <div className={styles.unactiveMessage}>
                                        비활성화된 도구입니다. 사용할 수 없습니다.
                                    </div>
                                ) : (
                                    <>
                                        <div className={styles.actionsLeft}>
                                            <button
                                                className={styles.actionButton}
                                                title="사용"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: 도구 사용 구현
                                                }}
                                            >
                                                <FiPlay />
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                title="편집"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: 도구 편집 구현
                                                }}
                                            >
                                                <FiEdit />
                                            </button>
                                            <button
                                                className={styles.actionButton}
                                                title="복사"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // TODO: 도구 복사 구현
                                                }}
                                            >
                                                <FiCopy />
                                            </button>
                                        </div>
                                        <div className={styles.actionsRight}>
                                            <div className={`${styles.dropdownContainer} ${openDropdown === tool.id ? styles.dropdownActive : ''}`}>
                                                <button
                                                    className={styles.actionButton}
                                                    title="더보기"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (tool.id !== undefined) {
                                                            toggleDropdown(tool.id);
                                                        }
                                                    }}
                                                >
                                                    <FiMoreVertical />
                                                </button>
                                                {tool.id !== undefined && openDropdown === tool.id && (
                                                    <div className={styles.dropdownMenu}>
                                                        <button
                                                            className={styles.dropdownItem}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // TODO: 설정 구현
                                                                setOpenDropdown(null);
                                                            }}
                                                        >
                                                            <FiSettings />
                                                            <span>설정</span>
                                                        </button>
                                                        <button
                                                            className={styles.dropdownItem}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // TODO: 버전 히스토리 구현
                                                                setOpenDropdown(null);
                                                            }}
                                                        >
                                                            <FiGitBranch />
                                                            <span>버전 히스토리</span>
                                                        </button>
                                                        <div className={styles.dropdownDivider} />
                                                        <button
                                                            className={`${styles.dropdownItem} ${styles.danger}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // TODO: 삭제 구현
                                                                setOpenDropdown(null);
                                                            }}
                                                        >
                                                            <FiTrash2 />
                                                            <span>삭제</span>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && !error && filteredTools.length === 0 && (
                <div className={styles.emptyState}>
                    <FiFolder className={styles.emptyIcon} />
                    <h3>도구가 없습니다</h3>
                    <p>
                        아직 저장된 도구가 없습니다. 새로운 도구를 만들어보세요.
                    </p>
                </div>
            )}

            {/* Detail Modal */}
            <ToolStorageDetailModal
                tool={selectedTool}
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
            />
        </div>
    );
};

export default ToolStorage;
