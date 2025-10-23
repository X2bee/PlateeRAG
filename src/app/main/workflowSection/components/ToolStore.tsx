'use client';
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../assets/ToolStore.module.scss';
import { devLog } from '@/app/_common/utils/logger';
import { useAuth } from '@/app/_common/components/CookieProvider';
import {
    showDeleteConfirmToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
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
    IoDownload,
    IoStar,
    IoStarOutline
} from 'react-icons/io5';
import RefreshButton from '@/app/_common/icons/refresh';
import UploadButton from '@/app/_common/icons/upload';
import {
    listToolStore,
    deleteToolFromStore,
    downloadToolFromStore,
    rateToolStore
} from '@/app/_common/api/toolsAPI';
import ToolStoreDetailModal from './tools/ToolStoreDetailModal';
import ToolStoreUploadModal from './tools/ToolStoreUploadModal';

interface Tool {
    id: number;
    created_at: string;
    updated_at: string;
    user_id: number;
    function_upload_id: string;
    function_data: {
        function_name: string;
        function_id: string;
        description: string;
        api_header: any;
        api_body: {
            properties: any;
        };
        static_body?: any;
        api_url: string;
        api_method: string;
        body_type?: string;
        api_timeout: number;
        response_filter: boolean;
        response_filter_path: string;
        response_filter_field: string;
        status: string;
    };
    metadata?: {
        description?: string;
        tags?: string[];
        original_function_id?: string;
    };
    rating_count: number;
    rating_sum: number;
    username: string;
    full_name: string;
}

interface DownloadToolResult {
    success: boolean;
    message: string;
    function_id: string;
    function_name: string;
}

interface ToolStoreProps {
    onToolSelect?: (tool: Tool) => void;
    className?: string;
    activeTab: 'storage' | 'store';
    onTabChange: (tab: 'storage' | 'store') => void;
    onStorageRefresh?: () => void | Promise<void>;
}

const ToolStore: React.FC<ToolStoreProps> = ({ onToolSelect, className, activeTab, onTabChange, onStorageRefresh }) => {
    // 상태 관리
    const [tools, setTools] = useState<Tool[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [filterMode, setFilterMode] = useState<'all' | 'my'>('all');
    const [hoveredRating, setHoveredRating] = useState<{ toolId: number; rating: number } | null>(null);

    // 현재 로그인한 사용자 정보 가져오기
    const { user } = useAuth();

    // 도구 데이터 로딩
    const loadTools = async () => {
        try {
            setLoading(true);
            setError(null);

            devLog.info('Loading tools from store');

            const toolList = await listToolStore();
            setTools(toolList as Tool[]);
            devLog.info(`Loaded ${toolList.length} tools from store`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '도구를 불러오는데 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to load tools:', err);
            setTools([]);
        } finally {
            setLoading(false);
        }
    };

    // 초기 로딩
    useEffect(() => {
        loadTools();
    }, []);

    // 필터링된 도구 계산
    const filteredTools = useMemo(() => {
        return tools.filter(tool => {
            // 검색어 필터
            const matchesSearch = !searchTerm ||
                tool.function_upload_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.function_data.function_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tool.function_data.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (tool.metadata?.tags && tool.metadata.tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())));

            // 필터 모드에 따른 필터링
            let matchesFilter = true;

            if (filterMode === 'my') {
                // My: 자신의 것만 표시
                matchesFilter = !!(user && tool.user_id && tool.user_id === user.user_id);
            }
            // filterMode === 'all'인 경우 matchesFilter는 true 유지

            return matchesSearch && matchesFilter;
        });
    }, [tools, searchTerm, filterMode, user]);

    // 검색어 변경 핸들러
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // 도구 카드 클릭 핸들러
    const handleToolClick = (tool: Tool) => {
        setSelectedTool(tool);
        setIsModalOpen(true);
    };

    // 모달에서 도구 다운로드 핸들러
    const handleDownloadToolFromModal = async (tool: Tool) => {
        try {
            setLoading(true);

            // storeToolId (tool.id를 문자열로), functionUploadId 전달
            const result = await downloadToolFromStore(String(tool.id), tool.function_upload_id) as DownloadToolResult;

            showSuccessToastKo(`'${result.function_name}' 도구가 성공적으로 다운로드되었습니다!`);
            devLog.info(`Downloaded tool from modal: ${result.function_name} (${result.function_id})`);

            // Tool Store 목록 새로고침
            await loadTools();

            // Tool Storage 목록도 새로고침
            if (onStorageRefresh) {
                await onStorageRefresh();
                devLog.info('Tool Storage refreshed after download');
            }

            setIsModalOpen(false);
            setSelectedTool(null);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '도구 다운로드에 실패했습니다.';
            devLog.error('Failed to download tool from modal:', err);
            showErrorToastKo(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // 도구 다운로드 핸들러
    const handleDownloadTool = async (tool: Tool, e: React.MouseEvent) => {
        e.stopPropagation();

        showWarningConfirmToastKo({
            title: '도구 다운로드 확인',
            message: `'${tool.function_data.function_name}' 도구를 내 도구로 다운로드하시겠습니까?\n다운로드된 도구는 내 도구 목록에 추가됩니다.`,
            onConfirm: async () => {
                try {
                    setLoading(true);

                    // storeToolId (tool.id를 문자열로), functionUploadId 전달
                    const result = await downloadToolFromStore(String(tool.id), tool.function_upload_id) as DownloadToolResult;

                    showSuccessToastKo(`'${result.function_name}' 도구가 성공적으로 다운로드되었습니다!`);
                    devLog.info(`Downloaded tool: ${result.function_name} (${result.function_id})`);

                    // Tool Store 목록 새로고침
                    await loadTools();

                    // Tool Storage 목록도 새로고침
                    if (onStorageRefresh) {
                        await onStorageRefresh();
                        devLog.info('Tool Storage refreshed after download');
                    }
                } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : '도구 다운로드에 실패했습니다.';
                    devLog.error('Failed to download tool:', err);
                    showErrorToastKo(errorMessage);
                } finally {
                    setLoading(false);
                }
            },
            confirmText: '다운로드',
            cancelText: '취소',
        });
    };

    // 도구 삭제 핸들러
    const handleDeleteTool = async (tool: Tool, e: React.MouseEvent) => {
        e.stopPropagation();

        showDeleteConfirmToastKo({
            title: '도구 삭제 확인',
            message: `'${tool.function_data.function_name}' 도구를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: tool.function_data.function_name,
            onConfirm: async () => {
                try {
                    setLoading(true);

                    await deleteToolFromStore(tool.function_upload_id);

                    showDeleteSuccessToastKo({
                        itemName: tool.function_data.function_name,
                        itemType: '도구',
                    });

                    // 도구 목록 새로고침
                    await loadTools();
                } catch (error) {
                    devLog.error('Failed to delete tool:', error);
                    showDeleteErrorToastKo({
                        itemName: tool.function_data.function_name,
                        itemType: '도구',
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
        loadTools();
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTool(null);
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
        loadTools();
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
    const calculateAverageRating = (tool: Tool) => {
        if (!tool.rating_count || tool.rating_count === 0) return 0;
        return tool.rating_sum! / tool.rating_count;
    };

    // 도구 평가 핸들러
    const handleRateTool = async (tool: Tool, rating: number, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            showErrorToastKo('평가하려면 로그인이 필요합니다.');
            return;
        }

        try {
            setLoading(true);

            // tool.user_id가 없으면 에러
            if (!tool.user_id) {
                showErrorToastKo('도구 소유자 정보를 찾을 수 없습니다.');
                return;
            }

            await rateToolStore(
                String(tool.id),
                tool.user_id,
                tool.function_upload_id,
                rating
            );

            showSuccessToastKo(`${rating}점으로 평가되었습니다!`);
            devLog.info(`Rated tool: ${tool.function_data.function_name} with ${rating} stars`);

            // 도구 목록 새로고침
            await loadTools();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '도구 평가에 실패했습니다.';
            devLog.error('Failed to rate tool:', err);
            showErrorToastKo(errorMessage);
        } finally {
            setLoading(false);
            setHoveredRating(null);
        }
    };

    // 별 렌더링 함수
    const renderStars = (tool: Tool) => {
        const avgRating = calculateAverageRating(tool);
        const stars = [];
        const currentHovered = hoveredRating?.toolId === tool.id ? hoveredRating.rating : 0;

        for (let i = 1; i <= 5; i++) {
            const isFilled = currentHovered > 0 ? i <= currentHovered : i <= Math.round(avgRating);
            stars.push(
                <span
                    key={i}
                    className={`${styles.star} ${isFilled ? styles.filled : ''}`}
                    onMouseEnter={() => setHoveredRating({ toolId: tool.id, rating: i })}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={(e) => handleRateTool(tool, i, e)}
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
                {tool.rating_count && tool.rating_count > 0 ? (
                    <span className={styles.ratingText}>
                        {avgRating.toFixed(1)} ({tool.rating_count})
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
                <div className={styles.headerActions}>
                    {/* 검색창 (제일 왼쪽) */}
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="도구 검색..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={styles.searchInput}
                        />
                        <IoSearch className={styles.searchIcon} />
                    </div>

                    <div className={styles.filters}>
                        {/* 저장소/스토어 탭 (공통) */}
                        <div className={styles.filterGroup}>
                            <button
                                onClick={() => onTabChange('storage')}
                                className={`${styles.filterButton} ${activeTab === 'storage' ? styles.active : ''}`}
                            >
                                저장소
                            </button>
                            <button
                                onClick={() => onTabChange('store')}
                                className={`${styles.filterButton} ${activeTab === 'store' ? styles.active : ''}`}
                            >
                                스토어
                            </button>
                        </div>

                        {/* 필터 탭 (스토어 전용) */}
                        <div className={styles.filterGroup}>
                            <button
                                className={`${styles.filterButton} ${filterMode === 'all' ? styles.active : ''}`}
                                onClick={() => setFilterMode('all')}
                            >
                                모두
                            </button>
                            <button
                                className={`${styles.filterButton} ${filterMode === 'my' ? styles.active : ''}`}
                                onClick={() => setFilterMode('my')}
                            >
                                My
                            </button>
                        </div>
                    </div>

                    <UploadButton
                        onClick={handleUploadClick}
                        disabled={loading}
                        title="도구 업로드"
                    />

                    <RefreshButton
                        onClick={handleRefresh}
                        loading={loading}
                        disabled={loading}
                        title="새로고침"
                    />
                </div>
            </div>

            {/* 메인 콘텐츠 */}
            <div className={styles.content}>
                {loading ? (
                    <div className={styles.loading}>
                        <div className={styles.loadingSpinner}></div>
                        <div className={styles.loadingText}>도구를 불러오는 중...</div>
                    </div>
                ) : error ? (
                    <div className={styles.noResults}>
                        <IoSearchOutline className={styles.noResultsIcon} />
                        <h3>오류가 발생했습니다</h3>
                        <p>{error}</p>
                    </div>
                ) : filteredTools.length === 0 ? (
                    <div className={styles.noResults}>
                        <IoSearchOutline className={styles.noResultsIcon} />
                        <h3>검색 결과가 없습니다</h3>
                        <p>
                            {searchTerm
                                ? `"${searchTerm}"에 대한 검색 결과를 찾을 수 없습니다.`
                                : '해당 조건에 맞는 도구가 없습니다.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className={styles.workflowsGrid}>
                        {/* 나만의 도구 추가 카드 */}
                        <div className={styles.addToolCard} onClick={handleUploadClick}>
                            <div className={styles.addToolContent}>
                                <div className={styles.addToolIcon}>
                                    <IoAdd />
                                </div>
                                <h3 className={styles.addToolTitle}>나만의 도구를 추가해 보세요!</h3>
                                <p className={styles.addToolDescription}>
                                    내가 만든 도구를 사용자들과 공유해보세요!
                                </p>
                            </div>
                        </div>

                        {filteredTools.map((tool) => (
                            <div
                                key={tool.id}
                                className={styles.workflowCard}
                                onClick={() => handleToolClick(tool)}
                            >
                                <div className={styles.cardHeader}>
                                    <h3 className={styles.cardTitle}>{tool.function_data.function_name}</h3>
                                </div>

                                <div className={styles.cardContent}>
                                    <div className={styles.contentPreview}>
                                        {truncateText(tool.function_data.description || '설명 없음')}
                                    </div>

                                    {/* 평점 표시 */}
                                    {renderStars(tool)}

                                    <div className={styles.contentMeta}>
                                        <div className={styles.metaItem}>
                                            <IoCalendar className={styles.metaIcon} />
                                            {formatDate(tool.created_at)}
                                        </div>
                                        {tool.user_id && tool.username && (
                                            <div className={styles.metaItem}>
                                                <IoPerson className={styles.metaIcon} />
                                                {tool.full_name || tool.username}
                                            </div>
                                        )}
                                    </div>
                                    {tool.metadata?.tags && tool.metadata.tags.length > 0 && (
                                        <div className={styles.tags}>
                                            {tool.metadata.tags.map((tag: string, index: number) => (
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
                                            <span>메서드: {tool.function_data.api_method}</span>
                                        </div>
                                    </div>
                                    <div className={styles.cardActions}>
                                        <button
                                            className={styles.actionButton}
                                            onClick={(e) => handleDownloadTool(tool, e)}
                                            title="도구 다운로드"
                                        >
                                            <IoDownload className={styles.actionIcon} />
                                            다운로드
                                        </button>
                                        {user && tool.user_id && String(tool.user_id) === String(user.user_id) && (
                                            <button
                                                className={`${styles.actionButton} ${styles.deleteButton}`}
                                                onClick={(e) => handleDeleteTool(tool, e)}
                                                title="도구 삭제"
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

            {/* 도구 상세보기 모달 */}
            {selectedTool && (
                <ToolStoreDetailModal
                    tool={selectedTool}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onDownload={handleDownloadToolFromModal}
                />
            )}

            {/* 도구 업로드 모달 */}
            <ToolStoreUploadModal
                isOpen={isUploadModalOpen}
                onClose={handleCloseUploadModal}
                onSuccess={handleUploadSuccess}
            />
        </div>
    );
};

export default ToolStore;
