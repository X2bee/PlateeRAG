'use client';
import React, { useState, useEffect } from 'react';
import { FiX, FiFolder, FiFileText, FiChevronRight, FiRefreshCw } from 'react-icons/fi';
import styles from '@/app/chat/assets/CollectionModal.module.scss';
import { listCollections, listDocumentsInCollection } from '@/app/api/retrievalAPI';

interface Collection {
    id?: number;
    user_id?: number;
    collection_make_name: string;
    collection_name: string;
    total_documents?: number;
    total_chunks?: number;
    documents?: any[];
    created_at?: string;
}

interface CollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CollectionModal: React.FC<CollectionModalProps> = ({ isOpen, onClose }) => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'list' | 'details'>('list');

    useEffect(() => {
        if (isOpen) {
            setView('list');
            setSelectedCollection(null);
            setError(null);
            fetchCollections();
        }
    }, [isOpen]);

    const fetchCollections = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await listCollections() as any;

            if (response) {
                setCollections(response || []);
            }
        } catch (err) {
            setError('컬렉션을 불러오는데 실패했습니다.');
            console.error('Failed to fetch collections:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCollectionDetails = async (collectionName: string, collection_make_name: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await listDocumentsInCollection(collectionName) as any;

            const collectionWithDetails = {
                collection_name: collectionName,
                collection_make_name: collection_make_name,
                total_documents: response.total_documents,
                total_chunks: response.total_chunks,
                documents: response.documents
            };

            setSelectedCollection(collectionWithDetails);
            setView('details');
        } catch (err) {
            setError('컬렉션 상세 정보를 불러오는데 실패했습니다.');
            console.error('Failed to fetch collection details:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCollectionSelect = (collection: Collection) => {
        // localStorage에 선택된 컬렉션 저장
        localStorage.setItem('selectedCollection', JSON.stringify({
            name: collection.collection_name,
            selectedAt: new Date().toISOString()
        }));

        // 모달 닫기
        onClose();
    };

    const handleDetailsView = (collectionName: string, collection_make_name: string) => {
        // 단순히 상세 정보만 표시 (localStorage 저장하지 않음)
        fetchCollectionDetails(collectionName, collection_make_name);
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedCollection(null);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
            <div className={styles.modalContainer}>
                <div className={styles.modalHeader}>
                    <div className={styles.headerContent}>
                        {view === 'details' && (
                            <button
                                className={styles.backButton}
                                onClick={handleBackToList}
                            >
                                <FiChevronRight style={{ transform: 'rotate(180deg)' }} />
                            </button>
                        )}
                        <h3>
                            {view === 'list' ? '컬렉션' : selectedCollection?.collection_make_name}
                        </h3>
                        {view === 'list' && (
                            <button
                                className={styles.refreshButton}
                                onClick={fetchCollections}
                                disabled={loading}
                            >
                                <FiRefreshCw className={loading ? styles.spinning : ''} />
                            </button>
                        )}
                    </div>
                    <button className={styles.closeButton} onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                <div className={styles.modalContent}>
                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className={styles.loadingState}>
                            <div className={styles.loadingSpinner}></div>
                            <p>로딩 중...</p>
                        </div>
                    ) : view === 'list' ? (
                        <div className={styles.collectionsList}>
                            {collections.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <FiFolder className={styles.emptyIcon} />
                                    <h4>컬렉션이 없습니다</h4>
                                    <p>아직 생성된 컬렉션이 없습니다.</p>
                                </div>
                            ) : (
                                collections.map((collection) => (
                                    <div
                                        key={collection.id}
                                        className={styles.collectionItem}
                                    >
                                        <div className={styles.collectionIcon}>
                                            <FiFolder />
                                        </div>
                                        <div className={styles.collectionInfo}>
                                            <h4>{collection.collection_make_name}</h4>
                                        </div>
                                        <div className={styles.collectionActions}>
                                            <button
                                                className={styles.detailsButton}
                                                onClick={() => handleDetailsView(collection.collection_name, collection.collection_make_name)}
                                            >
                                                상세정보
                                            </button>
                                            <button
                                                className={styles.selectButton}
                                                onClick={() => handleCollectionSelect(collection)}
                                            >
                                                선택
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className={styles.collectionDetails}>
                            {selectedCollection && (
                                <>
                                    <div className={styles.collectionStats}>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>문서 수</span>
                                            <span className={styles.statValue}>
                                                {selectedCollection.total_documents || 0}
                                            </span>
                                        </div>
                                        <div className={styles.statItem}>
                                            <span className={styles.statLabel}>청크 수</span>
                                            <span className={styles.statValue}>
                                                {selectedCollection.total_chunks || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className={styles.documentsSection}>
                                        <h4>문서 목록</h4>
                                        {selectedCollection.documents && selectedCollection.documents.length > 0 ? (
                                            <div className={styles.documentsList}>
                                                {selectedCollection.documents.map((doc: any) => (
                                                    <div key={doc.document_id} className={styles.documentItem}>
                                                        <div className={styles.documentIcon}>
                                                            <FiFileText />
                                                        </div>
                                                        <div className={styles.documentInfo}>
                                                            <h5>{doc.file_name}</h5>
                                                            <div className={styles.documentMeta}>
                                                                <span className={`${styles.metaItem} ${styles.fileType}`}>
                                                                    {doc.file_type?.toUpperCase() || 'FILE'}
                                                                </span>
                                                                <span className={styles.metaSeparator}>•</span>
                                                                <span className={`${styles.metaItem} ${styles.chunks}`}>
                                                                    청크 {doc.total_chunks}개
                                                                </span>
                                                                <span className={styles.metaSeparator}>•</span>
                                                                <span className={`${styles.metaItem} ${styles.date}`}>
                                                                    {formatDate(doc.processed_at)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className={styles.emptyDocuments}>
                                                <p>이 컬렉션에는 문서가 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CollectionModal;
