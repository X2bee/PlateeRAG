'use client';
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../assets/PromptStore.module.scss';
import { getPromptsByLanguage, deletePrompt, ratePrompt } from '@/app/_common/api/promptAPI';
import { devLog } from '@/app/_common/utils/logger';
import PromptExpandModal from './PromptExpandModal';
import PromptCreateModal from './PromptCreateModal';
import PromptEditModal from './PromptEditModal';
import { useAuth } from '@/app/_common/components/CookieProvider';
import {
    showDeleteConfirmToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo,
    showCopySuccessToastKo,
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

interface Prompt {
    id: number;
    prompt_uid: string;
    prompt_title: string;
    prompt_content: string;
    public_available: boolean;
    is_template: boolean;
    language: string;
    user_id?: string;
    username?: string;
    full_name?: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
    rating_count?: number;
    rating_sum?: number;
}

interface PromptStoreProps {
    onPromptSelect?: (prompt: Prompt) => void;
    className?: string;
}

const PromptStore: React.FC<PromptStoreProps> = ({ onPromptSelect, className }) => {
    // 상태 관리
    const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en'>('ko');
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'my' | 'template' | 'shared'>('my');
    const [hoveredRating, setHoveredRating] = useState<{ promptId: number; rating: number } | null>(null);

    // 현재 로그인한 사용자 정보 가져오기
    const { user } = useAuth();

    // 프롬프트 데이터 로딩
    const loadPrompts = async (language: 'ko' | 'en') => {
        try {
            setLoading(true);
            setError(null);

            devLog.info(`Loading prompts for language: ${language}`);

            const response = await getPromptsByLanguage(language, 300);

            if (response && (response as any).prompts) {
                setPrompts((response as any).prompts);
                devLog.info(`Loaded ${(response as any).prompts.length} prompts for ${language}`);
            } else {
                setPrompts([]);
                devLog.warn(`No prompts found for language: ${language}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '프롬프트를 불러오는데 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to load prompts:', err);
            setPrompts([]);
        } finally {
            setLoading(false);
        }
    };

    // 언어 변경 시 프롬프트 다시 로딩
    useEffect(() => {
        loadPrompts(selectedLanguage);
    }, [selectedLanguage]);

    // 필터링된 프롬프트 계산
    const filteredPrompts = useMemo(() => {
        return prompts.filter(prompt => {
            // 검색어 필터
            const matchesSearch = !searchTerm ||
                prompt.prompt_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prompt.prompt_content.toLowerCase().includes(searchTerm.toLowerCase());

            // 필터 모드에 따른 필터링
            let matchesFilter = true;

            if (filterMode === 'my') {
                // My: 자신의 것만 표시
                matchesFilter = !!(user && prompt.user_id && String(prompt.user_id) === String(user.user_id));
            } else if (filterMode === 'template') {
                // 템플릿: is_template이 true인 것만 표시
                matchesFilter = prompt.is_template === true;
            } else if (filterMode === 'shared') {
                // 공유: public_available이 true이면서 is_template가 false인 것만 표시
                matchesFilter = prompt.public_available === true && prompt.is_template === false;
            }
            // filterMode === 'all'인 경우 matchesFilter는 true 유지

            return matchesSearch && matchesFilter;
        });
    }, [prompts, searchTerm, filterMode, user]);

    // 언어 탭 변경 핸들러
    const handleLanguageChange = (language: 'ko' | 'en') => {
        setSelectedLanguage(language);
        setSearchTerm(''); // 언어 변경 시 검색어 초기화
    };

    // 검색어 변경 핸들러
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    // 프롬프트 카드 클릭 핸들러
    const handlePromptClick = (prompt: Prompt) => {
        setSelectedPrompt(prompt);
        setIsModalOpen(true);
    };

    // 프롬프트 복사 핸들러
    const handleCopyPrompt = async (prompt: Prompt, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(prompt.prompt_content);
            showCopySuccessToastKo('클립보드에 복사되었습니다!');
            devLog.info(`Copied prompt: ${prompt.prompt_title}`);
        } catch (err) {
            devLog.error('Failed to copy prompt:', err);
        }
    };

    // 프롬프트 삭제 핸들러
    const handleDeletePrompt = async (prompt: Prompt, e: React.MouseEvent) => {
        e.stopPropagation();

        showDeleteConfirmToastKo({
            title: '프롬프트 삭제 확인',
            message: `'${prompt.prompt_title}' 프롬프트를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: prompt.prompt_title,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    await deletePrompt({ prompt_uid: prompt.prompt_uid });

                    showDeleteSuccessToastKo({
                        itemName: prompt.prompt_title,
                        itemType: '프롬프트',
                    });

                    // 프롬프트 목록 새로고침
                    await loadPrompts(selectedLanguage);
                } catch (error) {
                    devLog.error('Failed to delete prompt:', error);
                    showDeleteErrorToastKo({
                        itemName: prompt.prompt_title,
                        itemType: '프롬프트',
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
        loadPrompts(selectedLanguage);
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPrompt(null);
    };

    // 프롬프트 생성 모달 열기 핸들러
    const handleCreatePromptClick = () => {
        setIsCreateModalOpen(true);
    };

    // 프롬프트 생성 모달 닫기 핸들러
    const handleCloseCreateModal = () => {
        setIsCreateModalOpen(false);
    };

    // 프롬프트 생성 성공 핸들러
    const handleCreateSuccess = () => {
        // 프롬프트 목록 새로고침
        loadPrompts(selectedLanguage);
    };

    // 프롬프트 편집 모달 열기 핸들러
    const handleEditPromptClick = (prompt: Prompt, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingPrompt(prompt);
        setIsEditModalOpen(true);
    };

    // 프롬프트 편집 모달 닫기 핸들러
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setEditingPrompt(null);
    };

    // 프롬프트 편집 성공 핸들러
    const handleEditSuccess = () => {
        // 프롬프트 목록 새로고침
        loadPrompts(selectedLanguage);
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
    const calculateAverageRating = (prompt: Prompt) => {
        if (!prompt.rating_count || prompt.rating_count === 0) return 0;
        return prompt.rating_sum! / prompt.rating_count;
    };

    // 프롬프트 평가 핸들러
    const handleRatePrompt = async (prompt: Prompt, rating: number, e: React.MouseEvent) => {
        e.stopPropagation();

        if (!user) {
            showErrorToastKo('평가하려면 로그인이 필요합니다.');
            return;
        }

        try {
            setLoading(true);

            await ratePrompt(
                prompt.prompt_uid,
                prompt.user_id ? parseInt(prompt.user_id) : 0,
                prompt.is_template,
                rating
            );

            showSuccessToastKo(`${rating}점으로 평가되었습니다!`);
            devLog.info(`Rated prompt: ${prompt.prompt_title} with ${rating} stars`);

            // 프롬프트 목록 새로고침
            await loadPrompts(selectedLanguage);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '프롬프트 평가에 실패했습니다.';
            devLog.error('Failed to rate prompt:', err);
            showErrorToastKo(errorMessage);
        } finally {
            setLoading(false);
            setHoveredRating(null);
        }
    };

    // 별 렌더링 함수
    const renderStars = (prompt: Prompt) => {
        const avgRating = calculateAverageRating(prompt);
        const stars = [];
        const currentHovered = hoveredRating?.promptId === prompt.id ? hoveredRating.rating : 0;

        for (let i = 1; i <= 5; i++) {
            const isFilled = currentHovered > 0 ? i <= currentHovered : i <= Math.round(avgRating);
            stars.push(
                <span
                    key={i}
                    className={`${styles.star} ${isFilled ? styles.filled : ''}`}
                    onMouseEnter={() => setHoveredRating({ promptId: prompt.id, rating: i })}
                    onMouseLeave={() => setHoveredRating(null)}
                    onClick={(e) => handleRatePrompt(prompt, i, e)}
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
                {prompt.rating_count && prompt.rating_count > 0 ? (
                    <span className={styles.ratingText}>
                        {avgRating.toFixed(1)} ({prompt.rating_count})
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
                                placeholder="프롬프트 검색..."
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
                        <div className={styles.loadingText}>프롬프트를 불러오는 중...</div>
                    </div>
                ) : error ? (
                    <div className={styles.noResults}>
                        <IoSearchOutline className={styles.noResultsIcon} />
                        <h3>오류가 발생했습니다</h3>
                        <p>{error}</p>
                    </div>
                ) : filteredPrompts.length === 0 ? (
                    <div className={styles.noResults}>
                        <IoSearchOutline className={styles.noResultsIcon} />
                        <h3>검색 결과가 없습니다</h3>
                        <p>
                            {searchTerm
                                ? `"${searchTerm}"에 대한 검색 결과를 찾을 수 없습니다.`
                                : '해당 조건에 맞는 프롬프트가 없습니다.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className={styles.promptGrid}>
                        {/* 나만의 프롬프트 추가 카드 */}
                        <div className={styles.addPromptCard} onClick={handleCreatePromptClick}>
                            <div className={styles.addPromptContent}>
                                <div className={styles.addPromptIcon}>
                                    <IoAdd />
                                </div>
                                <h3 className={styles.addPromptTitle}>나만의 프롬프트를 추가해 보세요!</h3>
                                <p className={styles.addPromptDescription}>
                                    새로운 프롬프트를 생성하여 다른 사용자들과 공유하거나 개인용으로 사용하세요.
                                </p>
                            </div>
                        </div>

                        {filteredPrompts.map((prompt) => (
                                <div
                                    key={prompt.id}
                                    className={styles.promptCard}
                                    onClick={() => handlePromptClick(prompt)}
                                >
                                    <div className={styles.cardHeader}>
                                        <h3 className={styles.cardTitle}>{prompt.prompt_title}</h3>
                                        <div className={styles.cardBadges}>
                                            <span className={`${styles.badge} ${styles.language}`}>
                                                {prompt.language.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <div className={styles.contentPreview}>
                                            {truncateText(prompt.prompt_content)}
                                        </div>

                                        {/* 평점 표시 */}
                                        {renderStars(prompt)}

                                        <div className={styles.contentMeta}>
                                            <div className={styles.metaItem}>
                                                <IoCalendar className={styles.metaIcon} />
                                                {formatDate(prompt.created_at)}
                                            </div>
                                            {prompt.user_id && prompt.username && (
                                                <div className={styles.metaItem}>
                                                    <IoPerson className={styles.metaIcon} />
                                                    {prompt.username || ''} ({prompt.user_id || ''})
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.cardFooter}>
                                        <div className={styles.cardInfo}>
                                            <div className={styles.infoItem}>
                                                <span>문자수: {prompt.prompt_content.length}</span>
                                            </div>
                                        </div>
                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.actionButton}
                                                onClick={(e) => handleCopyPrompt(prompt, e)}
                                                title="프롬프트 복사"
                                            >
                                                <IoCopy className={styles.actionIcon} />
                                                복사
                                            </button>
                                            {user && prompt.user_id && String(prompt.user_id) === String(user.user_id) && (
                                                <>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.editButton}`}
                                                        onClick={(e) => handleEditPromptClick(prompt, e)}
                                                        title="프롬프트 편집"
                                                    >
                                                        <IoPencil className={styles.actionIcon} />
                                                        편집
                                                    </button>
                                                    <button
                                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                                        onClick={(e) => handleDeletePrompt(prompt, e)}
                                                        title="프롬프트 삭제"
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

            {/* 프롬프트 확장 모달 */}
            {selectedPrompt && (
                <PromptExpandModal
                    prompt={selectedPrompt}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}

            {/* 프롬프트 생성 모달 */}
            <PromptCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSuccess={handleCreateSuccess}
            />

            {/* 프롬프트 편집 모달 */}
            {editingPrompt && (
                <PromptEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onSuccess={handleEditSuccess}
                    prompt={editingPrompt}
                />
            )}
        </div>
    );
};

export default PromptStore;
