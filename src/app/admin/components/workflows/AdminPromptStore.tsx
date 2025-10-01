'use client';
import React, { useState, useEffect, useMemo } from 'react';
import styles from './AdminPromptStore.module.scss';
import { getAllPrompts, deletePrompt } from '@/app/admin/api/prompt';
import { devLog } from '@/app/_common/utils/logger';
import AdminPromptExpandModal from './AdminPromptExpandModal';
import AdminPromptCreateModal from './AdminPromptCreateModal';
import AdminPromptEditModal from './AdminPromptEditModal';
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
}

interface AdminPromptStoreProps {
    onPromptSelect?: (prompt: Prompt) => void;
    className?: string;
}

const AdminPromptStore: React.FC<AdminPromptStoreProps> = ({ onPromptSelect, className }) => {
    // 상태 관리
    const [selectedLanguage, setSelectedLanguage] = useState<'ko' | 'en' | 'all'>('all');
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [filterMode, setFilterMode] = useState<'all' | 'template' | 'shared' | 'private'>('all');

    // 프롬프트 데이터 로딩
    const loadPrompts = async (language: 'ko' | 'en' | 'all') => {
        try {
            setLoading(true);
            setError(null);

            devLog.info(`Loading all prompts (admin) for language: ${language}`);

            const options: any = {
                limit: 1000,
                offset: 0
            };

            if (language !== 'all') {
                options.language = language;
            }

            const response = await getAllPrompts(options) as any;

            if (response && response.prompts) {
                setPrompts(response.prompts);
                devLog.info(`Loaded ${response.prompts.length} prompts (admin)`);
            } else {
                setPrompts([]);
                devLog.warn(`No prompts found (admin)`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '프롬프트를 불러오는데 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to load prompts (admin):', err);
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
                prompt.prompt_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (prompt.username && prompt.username.toLowerCase().includes(searchTerm.toLowerCase()));

            // 필터 모드에 따른 필터링
            let matchesFilter = true;

            if (filterMode === 'template') {
                // 템플릿: is_template이 true인 것만 표시
                matchesFilter = prompt.is_template === true;
            } else if (filterMode === 'shared') {
                // 공유: public_available이 true이면서 is_template가 false인 것만 표시
                matchesFilter = prompt.public_available === true && prompt.is_template === false;
            } else if (filterMode === 'private') {
                // 비공개: public_available이 false이고 is_template가 false인 것만 표시
                matchesFilter = prompt.public_available === false && prompt.is_template === false;
            }
            // filterMode === 'all'인 경우 matchesFilter는 true 유지

            return matchesSearch && matchesFilter;
        });
    }, [prompts, searchTerm, filterMode]);

    // 언어 탭 변경 핸들러
    const handleLanguageChange = (language: 'ko' | 'en' | 'all') => {
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
            devLog.info(`Copied prompt (admin): ${prompt.prompt_title}`);
        } catch (err) {
            devLog.error('Failed to copy prompt (admin):', err);
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
                    devLog.error('Failed to delete prompt (admin):', error);
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
                                placeholder="프롬프트 검색... (제목, 내용, 사용자명)"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className={styles.searchInput}
                            />
                            <IoSearch className={styles.searchIcon} />
                        </div>

                        {/* 언어 탭 */}
                        <div className={styles.languageTabs}>
                            <button
                                className={`${styles.languageTab} ${selectedLanguage === 'all' ? styles.active : ''}`}
                                onClick={() => handleLanguageChange('all')}
                            >
                                <span className={styles.tabIcon}>🌐</span>
                                전체
                            </button>
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
                            <button
                                className={`${styles.filterTab} ${filterMode === 'private' ? styles.active : ''}`}
                                onClick={() => setFilterMode('private')}
                            >
                                비공개
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
                        {/* 프롬프트 추가 카드 */}
                        <div className={styles.addPromptCard} onClick={handleCreatePromptClick}>
                            <div className={styles.addPromptContent}>
                                <div className={styles.addPromptIcon}>
                                    <IoAdd />
                                </div>
                                <h3 className={styles.addPromptTitle}>새 프롬프트 추가</h3>
                                <p className={styles.addPromptDescription}>
                                    관리자 권한으로 새로운 프롬프트를 생성할 수 있습니다.
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
                                        {prompt.is_template && (
                                            <span className={`${styles.badge} ${styles.template}`}>
                                                템플릿
                                            </span>
                                        )}
                                        {prompt.public_available ? (
                                            <span className={`${styles.badge} ${styles.public}`}>
                                                공개
                                            </span>
                                        ) : (
                                            <span className={`${styles.badge} ${styles.private}`}>
                                                비공개
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.cardContent}>
                                    <div className={styles.contentPreview}>
                                        {truncateText(prompt.prompt_content)}
                                    </div>
                                    <div className={styles.contentMeta}>
                                        <div className={styles.metaItem}>
                                            <IoCalendar className={styles.metaIcon} />
                                            {formatDate(prompt.created_at)}
                                        </div>
                                        {prompt.user_id && prompt.username && (
                                            <div className={styles.metaItem}>
                                                <IoPerson className={styles.metaIcon} />
                                                {prompt.username} ({prompt.user_id})
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
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 프롬프트 확장 모달 */}
            {selectedPrompt && (
                <AdminPromptExpandModal
                    prompt={selectedPrompt}
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                />
            )}

            {/* 프롬프트 생성 모달 */}
            <AdminPromptCreateModal
                isOpen={isCreateModalOpen}
                onClose={handleCloseCreateModal}
                onSuccess={handleCreateSuccess}
            />

            {/* 프롬프트 편집 모달 */}
            {editingPrompt && (
                <AdminPromptEditModal
                    isOpen={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    onSuccess={handleEditSuccess}
                    prompt={editingPrompt}
                />
            )}
        </div>
    );
};

export default AdminPromptStore;
