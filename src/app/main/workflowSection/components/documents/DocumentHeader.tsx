'use client';
import React from 'react';
import {
    FiRefreshCw,
    FiPlus,
    FiSidebar,
} from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/Documents.module.scss';
import RefreshButton from '@/app/_common/icons/refresh';
import { Collection, DocumentInCollection, ViewMode, CollectionFilter } from '@/app/main/workflowSection/types/index';

interface EmbeddingConfig {
    client_initialized: boolean;
    client_available: boolean;
    provider_info: {
        provider: string;
        model: string;
        dimension: number;
        api_key_configured: boolean;
        available: boolean;
    };
}

interface DocumentHeaderProps {
    viewMode: ViewMode;
    collectionFilter: CollectionFilter;
    selectedCollection: Collection | null;
    selectedDocument: DocumentInCollection | null;
    loading: boolean;
    embeddingLoading: boolean;
    embeddingConfig: EmbeddingConfig | null;
    onGoBack: () => void;
    onSetCollectionFilter: (filter: CollectionFilter) => void;
    onRefresh: () => void;
    onSwitchToAllGraphView: () => void;
    onShowCreateModal: () => void;
    onSwitchToGraphView: () => void;
    onToggleDirectorySidebar: () => void;
    showDirectorySidebar: boolean;
    onShowCreateFolderModal: () => void;
    onSingleFileUpload: () => void;
    onFolderUpload: () => void;
    onRemakeCollection: () => void;
}

const DocumentHeader: React.FC<DocumentHeaderProps> = ({
    viewMode,
    collectionFilter,
    selectedCollection,
    selectedDocument,
    loading,
    embeddingLoading,
    embeddingConfig,
    onGoBack,
    onSetCollectionFilter,
    onRefresh,
    onSwitchToAllGraphView,
    onShowCreateModal,
    onSwitchToGraphView,
    onToggleDirectorySidebar,
    showDirectorySidebar,
    onShowCreateFolderModal,
    onSingleFileUpload,
    onFolderUpload,
    onRemakeCollection,
}) => {
    return (
        <div className={styles.header}>
            {/* 첫 번째 row - 기본 헤더 */}
            <div className={styles.headerLeft}>
                {viewMode !== 'collections' && (
                    <button onClick={onGoBack} className={`${styles.button} ${styles.secondary}`}>
                        ← 뒤로
                    </button>
                )}
                <h2>
                    {viewMode === 'collections' && '컬렉션 관리'}
                    {viewMode === 'documents' && `${selectedCollection?.collection_make_name} - 문서 목록`}
                    {viewMode === 'documents-graph' && `${selectedCollection?.collection_make_name} - 문서 그래프`}
                    {viewMode === 'document-detail' && `${selectedDocument?.file_name} - 문서 상세`}
                </h2>
            </div>
            <div className={styles.headerRight}>
                {viewMode === 'collections' && (
                    <>
                        <div className={styles.filterButtons}>
                            <button
                                onClick={() => onSetCollectionFilter('all')}
                                className={`${styles.button} ${collectionFilter === 'all' ? styles.active : styles.secondary}`}
                            >
                                모두
                            </button>
                            <button
                                onClick={() => onSetCollectionFilter('personal')}
                                className={`${styles.button} ${collectionFilter === 'personal' ? styles.active : styles.secondary}`}
                            >
                                개인
                            </button>
                            <button
                                onClick={() => onSetCollectionFilter('shared')}
                                className={`${styles.button} ${collectionFilter === 'shared' ? styles.active : styles.secondary}`}
                            >
                                공유
                            </button>
                        </div>
                        <button onClick={onSwitchToAllGraphView} className={`${styles.button} ${styles.secondary}`}>
                            모든 그래프 보기
                        </button>
                        <button onClick={onShowCreateModal} className={`${styles.button} ${styles.primary}`}>
                            새 컬렉션 생성
                        </button>
                        <RefreshButton
                            onClick={onRefresh}
                            loading={loading}
                            disabled={loading}
                            title="새로고침"
                        />
                    </>
                )}
                {viewMode === 'documents' && (
                    <>
                        <button onClick={onSwitchToGraphView} className={`${styles.button} ${styles.secondary}`}>
                            그래프 보기
                        </button>
                        <button onClick={onShowCreateFolderModal} className={`${styles.button} ${styles.secondary}`}>
                            <FiPlus /> 폴더 생성
                        </button>
                        <button onClick={onSingleFileUpload} className={`${styles.button} ${styles.primary}`}>
                            단일 문서 업로드
                        </button>
                        <button onClick={onFolderUpload} className={`${styles.button} ${styles.primary}`}>
                            폴더 업로드
                        </button>
                        <button onClick={onToggleDirectorySidebar} className={`${styles.button} ${styles.iconOnly}`} title={showDirectorySidebar ? '디렉토리 숨기기' : '디렉토리 보이기'}>
                            <FiSidebar />
                        </button>
                        <RefreshButton
                            onClick={onRefresh}
                            loading={loading}
                            disabled={loading}
                            title="새로고침"
                        />
                    </>
                )}
                {viewMode === 'documents-graph' && (
                    <>
                        <RefreshButton
                            onClick={onRefresh}
                            loading={loading}
                            disabled={loading}
                            title="새로고침"
                        />
                    </>
                )}

            </div>

            {viewMode === 'documents' && selectedCollection && embeddingConfig &&
                !(embeddingConfig.client_available &&
                    embeddingConfig.provider_info.available &&
                    embeddingConfig.provider_info.dimension === selectedCollection.vector_size &&
                    (selectedCollection.init_embedding_model === 'N/A' ||
                        !selectedCollection.init_embedding_model ||
                        embeddingConfig.provider_info.model === selectedCollection.init_embedding_model)) && (
                    <div className={styles.subheader}>
                        <div className={styles.subheaderSection}>
                            <h4 className={styles.subheaderTitle}>⚠️ Embedding 설정 불일치</h4>
                            <div className={`${styles.subheaderGrid} ${styles.collectionGrid}`}>
                                <div className={styles.subheaderItem}>
                                    <span className={styles.subheaderLabel}>컬렉션 Dimension:</span>
                                    <span className={styles.subheaderValue}>{selectedCollection.vector_size || 'N/A'}</span>
                                </div>
                                <div className={styles.subheaderItem}>
                                    <span className={styles.subheaderLabel}>컬렉션 Model:</span>
                                    <span className={styles.subheaderValue}>{selectedCollection.init_embedding_model || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.subheaderSection}>
                            <h4 className={styles.subheaderTitle}>현재 Embedding 설정</h4>
                            <div className={`${styles.subheaderGrid} ${styles.embeddingGrid}`}>
                                <div className={styles.subheaderItem}>
                                    <span className={styles.subheaderLabel}>Provider:</span>
                                    <span className={styles.subheaderValue}>{embeddingConfig.provider_info.provider}</span>
                                </div>
                                <div className={styles.subheaderItem}>
                                    <span className={styles.subheaderLabel}>Model:</span>
                                    <span className={styles.subheaderValue}>{embeddingConfig.provider_info.model}</span>
                                </div>
                                <div className={styles.subheaderItem}>
                                    <span className={styles.subheaderLabel}>Dimension:</span>
                                    <span className={styles.subheaderValue}>{embeddingConfig.provider_info.dimension}</span>
                                </div>
                                <div className={styles.subheaderItem}>
                                    <span className={styles.subheaderLabel}>Action:</span>
                                    <div className={styles.subheaderStatusContainer}>
                                        <button
                                            onClick={onRemakeCollection}
                                            className={`${styles.button} ${styles.remakeButton}`}
                                            title="현재 임베딩 설정으로 컬렉션을 다시 생성합니다"
                                        >
                                            <FiRefreshCw /> 컬렉션 리메이크
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
        </div>
    );
};

export default DocumentHeader;
