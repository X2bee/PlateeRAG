'use client';
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../assets/PromptStore.module.scss';
import { getPromptsByLanguage } from '@/app/_common/api/promptAPI';
import { devLog } from '@/app/_common/utils/logger';
import PromptExpandModal from './PromptExpandModal';
import PromptCreateModal from './PromptCreateModal';
import { useAuth } from '@/app/_common/components/CookieProvider';
import {
    IoSearch,
    IoRefresh,
    IoPerson,
    IoCalendar,
    IoCopy,
    IoSearchOutline,
    IoAdd
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
    created_at: string;
    updated_at: string;
    metadata?: any;
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
    const [showMyPrompts, setShowMyPrompts] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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

            // My 프롬프트 필터 (활성화된 경우 현재 사용자의 프롬프트만 표시)
            const matchesUser = !showMyPrompts || (user && prompt.user_id &&
                String(prompt.user_id) === String(user.user_id));

            return matchesSearch && matchesUser;
        });
    }, [prompts, searchTerm, showMyPrompts, user]);

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
            // 토스트 알림이나 다른 피드백 시스템이 있다면 여기에 추가
            devLog.info(`Copied prompt: ${prompt.prompt_title}`);
        } catch (err) {
            devLog.error('Failed to copy prompt:', err);
        }
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

                        {/* My 필터 버튼 */}
                        <div className={styles.myFilterContainer}>
                            <button
                                className={`${styles.myFilterButton} ${showMyPrompts ? styles.active : ''}`}
                                onClick={() => setShowMyPrompts(!showMyPrompts)}
                            >
                                <span className={styles.tabIcon}>👤</span>
                                My
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
                                        <div className={styles.contentMeta}>
                                            <div className={styles.metaItem}>
                                                <IoCalendar className={styles.metaIcon} />
                                                {formatDate(prompt.created_at)}
                                            </div>
                                            {prompt.user_id && (
                                                <div className={styles.metaItem}>
                                                    <IoPerson className={styles.metaIcon} />
                                                    {prompt.user_id}
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
        </div>
    );
};

export default PromptStore;
