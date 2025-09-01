'use client';
import React, { useEffect } from 'react';
import {
    FiX,
    FiPackage,
    FiUser,
    FiClock,
    FiDownload,
    FiLock,
    FiUnlock,
    FiHeart,
    FiTag,
    FiGlobe,
    FiShield,
    FiGitBranch,
    FiCode,
    FiSettings,
    FiInfo,
    FiExternalLink,
} from 'react-icons/fi';
import styles from '@/app/model/assets/StorageInfoModal.module.scss';

interface HuggingFaceModel {
    id: string;
    author: string | null;
    private: boolean;
    downloads: number;
    created_at: string | null;
    additional_info?: {
        cardData?: any;
        card_data?: any;
        config?: any;
        disabled?: boolean | null;
        downloads_all_time?: number | null;
        gated?: boolean | null;
        gguf?: any;
        inference?: any;
        inference_provider_mapping?: any;
        lastModified?: string | null;
        last_modified?: string | null;
        library_name?: string | null;
        likes?: number;
        mask_token?: string | null;
        modelId?: string;
        model_index?: any;
        pipeline_tag?: string | null;
        safetensors?: any;
        security_repo_status?: any;
        sha?: string | null;
        siblings?: any;
        spaces?: any;
        tags?: string[];
        transformersInfo?: any;
        transformers_info?: any;
        trending_score?: number;
        widget_data?: any;
        xet_enabled?: boolean | null;
    };
}

interface StorageModelInfoModalProps {
    model: HuggingFaceModel;
    isOpen: boolean;
    onClose: () => void;
}

const StorageModelInfoModal: React.FC<StorageModelInfoModalProps> = ({
    model,
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

    const additional = model.additional_info || {};

    const handleHuggingFaceLink = () => {
        const url = `https://huggingface.co/${model.id}`;
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
                            <FiPackage />
                        </div>
                        <div className={styles.headerInfo}>
                            <h2 className={styles.modalTitle}>{model.id}</h2>
                            <div className={styles.headerMeta}>
                                <span className={styles.author}>
                                    <FiUser />
                                    {model.author || model.id.split('/')[0] || 'Unknown'}
                                </span>
                                <div className={`${styles.status} ${model.private ? styles.statusPrivate : styles.statusPublic}`}>
                                    {model.private ? <FiLock /> : <FiUnlock />}
                                    {model.private ? '비공개' : '공개'}
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
                                <span className={styles.label}>모델 ID</span>
                                <span className={styles.value}>{model.id}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>작성자</span>
                                <span className={styles.value}>
                                    {model.author || model.id.split('/')[0] || 'Unknown'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>생성일</span>
                                <span className={styles.value}>{formatDate(model.created_at)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.label}>다운로드 수</span>
                                <span className={styles.value}>{formatNumber(model.downloads)}</span>
                            </div>
                            {additional.last_modified && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>최종 수정일</span>
                                    <span className={styles.value}>{formatDate(additional.last_modified)}</span>
                                </div>
                            )}
                            {additional.library_name && (
                                <div className={styles.infoItem}>
                                    <span className={styles.label}>라이브러리</span>
                                    <span className={styles.value}>{additional.library_name}</span>
                                </div>
                            )}
                        </div>
                    </div>

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
                                        {formatNumber(additional.downloads_all_time || model.downloads)}
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

                    {/* Pipeline & Configuration */}
                    {(additional.pipeline_tag || additional.mask_token) && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiSettings />
                                파이프라인 & 설정
                            </h3>
                            <div className={styles.infoGrid}>
                                {additional.pipeline_tag && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>파이프라인 태그</span>
                                        <span className={styles.value}>{additional.pipeline_tag}</span>
                                    </div>
                                )}
                                {additional.mask_token && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>마스크 토큰</span>
                                        <span className={styles.value}>{additional.mask_token}</span>
                                    </div>
                                )}
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
                            </div>
                        </div>
                    )}

                    {/* Security & Technical Info */}
                    {(additional.sha || additional.security_repo_status || additional.safetensors) && (
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>
                                <FiShield />
                                보안 & 기술 정보
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
                                {additional.security_repo_status && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>보안 상태</span>
                                        <span className={styles.value}>{additional.security_repo_status}</span>
                                    </div>
                                )}
                                {additional.safetensors !== null && (
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>SafeTensors</span>
                                        <span className={styles.value}>
                                            {additional.safetensors ? '지원됨' : '지원되지 않음'}
                                        </span>
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

export default StorageModelInfoModal;
