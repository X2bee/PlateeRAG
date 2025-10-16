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

const ToolStorage: React.FC = () => {
    const [tools, setTools] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<
        'all' | 'active' | 'unactive'
    >('all');
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchTools = async () => {
        try {
            setLoading(true);
            setError(null);
            // TODO: API 호출 구현
            // const toolsData = await fetchToolsAPI();
            // setTools(toolsData);

            // 임시 데이터
            setTools([]);
        } catch (error) {
            console.error('Failed to fetch tools:', error);
            setError('도구를 불러오는데 실패했습니다.');
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

    // 도구 업로드 모달 열기 핸들러
    const handleUploadClick = () => {
        setIsUploadModalOpen(true);
    };

    // 도구 업로드 모달 닫기 핸들러
    const handleCloseUploadModal = () => {
        setIsUploadModalOpen(false);
    };

    // 도구 업로드 성공 핸들러
    const handleUploadSuccess = () => {
        // 도구 목록 새로고침
        fetchTools();
    };

    // 도구 필터링
    const getFilteredTools = () => {
        if (filter === 'all') {
            return tools;
        } else if (filter === 'active') {
            return tools.filter(tool => tool.status === 'active');
        } else if (filter === 'unactive') {
            return tools.filter(tool => tool.status === 'unactive');
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
            case 'unactive':
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
            case 'unactive':
                return '관리자 비활성';
            default:
                return '활성';
        }
    };

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
                            key={tool.key_value}
                            className={`${styles.workflowCard} ${openDropdown === tool.key_value ? styles.cardActive : ''}`}
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
                                <h3 className={styles.workflowName} title={tool.name}>
                                    {tool.name}
                                </h3>
                                {tool.description && (
                                    <p className={styles.workflowDescription}>
                                        {tool.description}
                                    </p>
                                )}
                                {tool.error && (
                                    <p className={styles.workflowError}>
                                        오류: {tool.error}
                                    </p>
                                )}

                                <div className={styles.workflowMeta}>
                                    <div className={styles.metaItem}>
                                        <FiUser />
                                        <span title={tool.author}>{tool.author}</span>
                                    </div>
                                    {tool.lastModified && (
                                        <div className={styles.metaItem}>
                                            <FiClock />
                                            <span title={new Date(tool.lastModified).toLocaleDateString('ko-KR')}>
                                                {new Date(
                                                    tool.lastModified,
                                                ).toLocaleDateString('ko-KR')}
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
                                {tool.status === 'unactive' ? (
                                    <div className={styles.unactiveMessage}>
                                        관리자가 비활성화한 도구입니다. 사용할 수 없습니다.
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
                                            <div className={`${styles.dropdownContainer} ${openDropdown === tool.key_value ? styles.dropdownActive : ''}`}>
                                                <button
                                                    className={styles.actionButton}
                                                    title="더보기"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (tool.key_value !== undefined) {
                                                            toggleDropdown(tool.key_value);
                                                        }
                                                    }}
                                                >
                                                    <FiMoreVertical />
                                                </button>
                                                {tool.key_value !== undefined && openDropdown === tool.key_value && (
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

            {/* TODO: 도구 업로드 모달 */}
            {/* <ToolStorageUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                onSuccess={handleUploadSuccess}
            /> */}
        </div>
    );
};

export default ToolStorage;
