'use client';
import React, { useEffect } from 'react';
import {
    FiX,
    FiDatabase,
    FiUser,
    FiClock,
    FiDownload,
    FiLock,
    FiUnlock,
    FiHeart,
    FiTag,
    FiGlobe,
    FiShield,
    FiCode,
    FiSettings,
    FiInfo,
    FiExternalLink,
    FiFileText,
} from 'react-icons/fi';
import styles from '@/app/model/assets/StorageInfoModal.module.scss';

interface HuggingFaceDataset {
    id: string;
    author: string | null;
    private: boolean;
    downloads: number;
    created_at: string | null;
    additional_info?: {
        cardData?: any;
        card_data?: any;
        description?: string;
        disabled?: boolean | null;
        downloads_all_time?: number | null;
        gated?: boolean | null;
        key?: string;
        lastModified?: string | null;
        last_modified?: string | null;
        likes?: number;
        paperswithcode_id?: string | null;
        sha?: string | null;
        siblings?: any;
        tags?: string[];
        trending_score?: number;
        xet_enabled?: boolean | null;
    };
}

interface StorageDatasetInfoModalProps {
    dataset: HuggingFaceDataset;
    isOpen: boolean;
    onClose: () => void;
}

const StorageDatasetInfoModal: React.FC<StorageDatasetInfoModalProps> = ({
    dataset,
    isOpen,
    onClose,
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // 모달이 열릴 때 body 스크롤 방지
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            // 모달이 닫힐 때 body 스크롤 복원
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatNumber = (num: number | null | undefined) => {
        if (num === null || num === undefined) return '0';
        return num.toLocaleString();
    };

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleModalContentClick = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    const handleModalWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
    };

    const additional = dataset.additional_info || {};

    const handleHuggingFaceLink = () => {
        const url = `https://huggingface.co/datasets/${dataset.id}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    // 태그를 최대 10개까지만 표시
    const displayTags = additional.tags?.slice(0, 10) || [];
    const hasMoreTags = (additional.tags?.length || 0) > 10;

    return (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
            <div
                className={styles.modalContent}
                onClick={handleModalContentClick}
                onWheel={handleModalWheel}
            >
                {/* Modal Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerLeft}>
                        <div className={styles.modelIcon}>
                            <FiDatabase />
                        </div>
                        <div className={styles.headerInfo}>
                            <h2 className={styles.modalTitle}>{dataset.id}</h2>
                            <div className={styles.headerMeta}>
                                <span className={styles.author}>
                                    <FiUser />
                                    {dataset.author || dataset.id.split('/')[0] || 'Unknown'}
                                </span>
                                <div className={`${styles.status} ${dataset.private ? styles.statusPrivate : styles.statusPublic}`}>
                                    {dataset.private ? <FiLock /> : <FiUnlock />}
                                    {dataset.private ? '비공개' : '공개'}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={styles.headerActions}>
                        <button
                            className={styles.linkButton}
                            onClick={handleHuggingFaceLink}
                            title="Hugging Face에서 보기"
                        >
                            <FiExternalLink />
                            <span>Hugging Face에서 보기</span>
                        </button>
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {/* Modal Body */}
                <div className={styles.modalBody}>
                    {/* Basic Information */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FiInfo />
                            기본 정보
                        </h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>데이터셋 ID</span>
                                <span className={styles.value}>{dataset.id}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>작성자</span>
                                <span className={styles.value}>
                                    {dataset.author || dataset.id.split('/')[0] || 'Unknown'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>생성일</span>
                                <span className={styles.value}>{formatDate(dataset.created_at)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>다운로드 수</span>
                                <span className={styles.value}>{formatNumber(dataset.downloads)}</span>
                            </div>
                            {additional.last_modified && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>최종 수정일</span>
                                    <span className={styles.value}>{formatDate(additional.last_modified)}</span>
                                </div>
                            )}
                            {additional.key && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>키</span>
                                    <span className={styles.value}>{additional.key}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    {additional.description && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiFileText />
                                설명
                            </h3>
                            <div className={styles.descriptionContainer}>
                                <p className={styles.description}>
                                    {additional.description}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Statistics */}
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>
                            <FiDownload />
                            통계
                        </h3>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>
                                    <FiDownload />
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statLabel}>다운로드</span>
                                    <span className={styles.statValue}>
                                        {formatNumber(additional.downloads_all_time || dataset.downloads)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>
                                    <FiHeart />
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statLabel}>좋아요</span>
                                    <span className={styles.statValue}>
                                        {formatNumber(additional.likes)}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statIcon}>
                                    <FiGlobe />
                                </div>
                                <div className={styles.statContent}>
                                    <span className={styles.statLabel}>트렌딩 점수</span>
                                    <span className={styles.statValue}>
                                        {formatNumber(additional.trending_score)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Configuration & Settings */}
                    {(additional.gated !== null || additional.disabled !== null || additional.paperswithcode_id) && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiSettings />
                                설정 & 구성
                            </h3>
                            <div className={styles.infoGrid}>
                                {additional.gated !== null && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>게이트 여부</span>
                                        <span className={styles.value}>
                                            {additional.gated ? '예' : '아니오'}
                                        </span>
                                    </div>
                                )}
                                {additional.disabled !== null && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>비활성화 여부</span>
                                        <span className={styles.value}>
                                            {additional.disabled ? '예' : '아니오'}
                                        </span>
                                    </div>
                                )}
                                {additional.paperswithcode_id && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>Papers With Code ID</span>
                                        <span className={styles.value}>{additional.paperswithcode_id}</span>
                                    </div>
                                )}
                                {additional.xet_enabled !== null && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>XET 활성화</span>
                                        <span className={styles.value}>
                                            {additional.xet_enabled ? '예' : '아니오'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Security & Technical Info */}
                    {(additional.sha || additional.siblings) && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiShield />
                                기술 정보
                            </h3>
                            <div className={styles.infoGrid}>
                                {additional.sha && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>SHA</span>
                                        <span className={styles.value} title={additional.sha}>
                                            {additional.sha.slice(0, 12)}...
                                        </span>
                                    </div>
                                )}
                                {additional.siblings && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>파일 목록</span>
                                        <span className={styles.value}>
                                            {Array.isArray(additional.siblings) ?
                                                `${additional.siblings.length}개 파일` : '파일 정보 있음'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {displayTags.length > 0 && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiTag />
                                태그 {hasMoreTags && <span className={styles.tagCount}>(상위 10개)</span>}
                            </h3>
                            <div className={styles.tagsContainer}>
                                {displayTags.map((tag, index) => (
                                    <span key={index} className={styles.tag}>
                                        {tag}
                                    </span>
                                ))}
                                {hasMoreTags && (
                                    <span className={styles.tagMore}>
                                        +{(additional.tags?.length || 0) - 10}개 더
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StorageDatasetInfoModal;
