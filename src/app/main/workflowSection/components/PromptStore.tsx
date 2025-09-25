'use client';
import React, { useState, useEffect, useMemo } from 'react';
import styles from '../assets/PromptStore.module.scss';
import { getPromptsByLanguage, searchPrompts } from '@/app/_common/api/promptAPI';
import { devLog } from '@/app/_common/utils/logger';
import PromptExpandModal from './PromptExpandModal';
import {
    IoSearch,
    IoRefresh,
    IoPerson,
    IoCalendar,
    IoCopy,
    IoEye,
    IoSearchOutline
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

            return matchesSearch;
        });
    }, [prompts, searchTerm]);

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
        if (onPromptSelect) {
            onPromptSelect(prompt);
        }
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

    // 프롬프트 상세보기 핸들러
    const handleViewPrompt = (prompt: Prompt, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedPrompt(prompt);
        setIsModalOpen(true);
    };

    // 모달 닫기 핸들러
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedPrompt(null);
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
                                        <button
                                            className={`${styles.actionButton} ${styles.primary}`}
                                            onClick={(e) => handleViewPrompt(prompt, e)}
                                            title="프롬프트 보기"
                                        >
                                            <IoEye className={styles.actionIcon} />
                                            보기
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
        </div>
    );
};

export default PromptStore;
