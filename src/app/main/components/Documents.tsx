'use client';
import React, { useState, useEffect } from 'react';
import {
    FiFolder,
    FiSettings,
    FiTrash2,
    FiUser,
    FiClock,
    FiBarChart,
    FiUsers,
} from 'react-icons/fi';
import styles from '@/app/main/assets/Documents.module.scss';
import DocumentsGraph from '@/app/main/components/documents/DocumentsGraph';
import CollectionEditModal from '@/app/main/components/documents/CollectionEditModal';
import DocumentCollectionModal from '@/app/main/components/documents/DocumentCollectionModal';

import {
    formatFileSize,
    getRelativeTime,
    listCollections,
    searchDocuments,
    listDocumentsInCollection,
    getDocumentDetails,
    deleteDocumentFromCollection,
    getDocumentDetailMeta,
    getDocumentDetailEdges,
    getAllDocumentDetailMeta,
    getAllDocumentDetailEdges,
    deleteCollection,
} from '@/app/api/rag/retrievalAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useDocumentFileModal } from '@/app/_common/contexts/DocumentFileModalContext';
import {
    showDeleteConfirmToastKo,
    showDeleteSuccessToastKo,
    showDeleteErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';

import {
    Collection,
    DocumentInCollection,
    SearchResult,
    CollectionsResponse,
    DocumentsInCollectionResponse,
    SearchResponse,
    ViewMode,
    CollectionFilter,
} from '@/app/main/types/index';

const Documents: React.FC = () => {
    const { user } = useAuth();
    const { openModal, setOnUploadComplete } = useDocumentFileModal();
    const [viewMode, setViewMode] = useState<ViewMode>('collections');
    const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [documentsInCollection, setDocumentsInCollection] = useState<DocumentInCollection[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentInCollection | null>(null);
    const [documentDetails, setDocumentDetails] = useState<DocumentInCollection | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // 청크 설정 상태 제거됨 (DocumentFileModal로 이동)

    // Graph 데이터 상태
    const [documentDetailMeta, setDocumentDetailMeta] = useState<any>(null);
    const [documentDetailEdges, setDocumentDetailEdges] = useState<any>(null);

    // Graph 데이터 상태
    const [allDocumentDetailMeta, setAllDocumentDetailMeta] = useState<any>(null);
    const [allDocumentDetailEdges, setAllDocumentDetailEdges] = useState<any>(null);

    // 모달 상태
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null);

    // 로딩 및 에러 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 컬렉션 필터링
    const getFilteredCollections = () => {
        switch (collectionFilter) {
            case 'personal':
                return collections.filter(collection => !collection.is_shared || collection.is_shared === null);
            case 'shared':
                return collections.filter(collection => collection.is_shared === true);
            case 'all':
            default:
                return collections;
        }
    };

    // 컬렉션 목록 로드
    useEffect(() => {
        loadCollections();
    }, []);

    // 모달 재열기 이벤트 리스너
    useEffect(() => {
        // 업로드 완료 콜백 설정
        setOnUploadComplete(() => {
            if (selectedCollection) {
                loadDocumentsInCollection(selectedCollection.collection_name);
            }
        });
    }, [selectedCollection]);

    const loadCollections = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await listCollections() as CollectionsResponse;
            setCollections(response);
        } catch (err) {
            setError('컬렉션 목록을 불러오는데 실패했습니다.');
            console.error('Failed to load collections:', err);
        } finally {
            setLoading(false);
        }
    };

    // 컬렉션 내 문서 목록 로드
    const loadDocumentsInCollection = async (collectionName: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await listDocumentsInCollection(collectionName) as DocumentsInCollectionResponse;
            setDocumentsInCollection(response.documents || []);
        } catch (err) {
            setError('문서 목록을 불러오는데 실패했습니다.');
            console.error('Failed to load documents in collection:', err);
            setDocumentsInCollection([]);
        } finally {
            setLoading(false);
        }
    };

    // 문서 상세 정보 로드
    const loadDocumentDetails = async (collectionName: string, documentId: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getDocumentDetails(collectionName, documentId) as DocumentInCollection;
            setDocumentDetails(response);
        } catch (err) {
            setError('문서 상세 정보를 불러오는데 실패했습니다.');
            console.error('Failed to load document details:', err);
        } finally {
            setLoading(false);
        }
    };

    // 문서 내 검색
    const handleDocumentSearch = async () => {
        if (!selectedCollection || !searchQuery.trim()) return;

        try {
            setIsSearching(true);
            setError(null);
            const response = await searchDocuments(
                selectedCollection.collection_name,
                searchQuery,
                10, // limit
                0.0,
                selectedDocument ? { document_id: selectedDocument.document_id } : undefined
            ) as SearchResponse;
            setSearchResults(response.results || []);
        } catch (err) {
            setError('검색에 실패했습니다.');
            console.error('Failed to search documents:', err);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // 검색 쿼리 변경 시 자동 검색 (디바운싱)
    useEffect(() => {
        if (viewMode === 'document-detail' && searchQuery) {
            const timer = setTimeout(() => {
                handleDocumentSearch();
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, viewMode, selectedCollection, selectedDocument]);

    // 컬렉션 생성 성공 핸들러
    const handleCollectionCreated = async () => {
        await loadCollections();
    };

    // 컬렉션 삭제
    const handleDeleteCollectionRequest = (collection: Collection) => {
        showDeleteConfirmToastKo({
            title: '컬렉션 삭제 확인',
            message: `'${collection.collection_make_name}' 컬렉션을 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며, 컬렉션에 포함된 모든 문서가 삭제됩니다.`,
            itemName: collection.collection_make_name,
            onConfirm: async () => {
                try {
                    await deleteCollection(collection.collection_name);

                    if (selectedCollection?.collection_name === collection.collection_name) {
                        setSelectedCollection(null);
                        setDocumentsInCollection([]);
                        setViewMode('collections');
                    }

                    showDeleteSuccessToastKo({
                        itemName: collection.collection_make_name,
                        itemType: '컬렉션',
                    });

                    await loadCollections();
                } catch (error) {
                    console.error('Failed to delete collection:', error);
                    showDeleteErrorToastKo({
                        itemName: collection.collection_make_name,
                        itemType: '컬렉션',
                        error: error instanceof Error ? error : 'Unknown error',
                    });
                }
            },
            confirmText: '삭제',
            cancelText: '취소',
        });
    };

    // 컬렉션 편집
    const handleEditCollectionRequest = (collection: Collection) => {
        setCollectionToEdit(collection);
        setShowEditModal(true);
    };

    const handleUpdateCollection = (updatedCollection: Collection) => {
        // 컬렉션 목록에서 해당 컬렉션 업데이트
        setCollections(prevCollections =>
            prevCollections.map(collection =>
                collection.collection_name === updatedCollection.collection_name
                    ? updatedCollection
                    : collection
            )
        );

        // 현재 선택된 컬렉션이 업데이트된 컬렉션이면 상태 업데이트
        if (selectedCollection?.collection_name === updatedCollection.collection_name) {
            setSelectedCollection(updatedCollection);
        }
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setCollectionToEdit(null);
    };

    // 문서 삭제 (바로 삭제)
    const handleDeleteDocument = async (document: DocumentInCollection) => {
        if (!selectedCollection) return;

        try {
            setLoading(true);
            setError(null);
            await deleteDocumentFromCollection(selectedCollection.collection_name, document.document_id);

            if (selectedDocument?.document_id === document.document_id) {
                setSelectedDocument(null);
                setDocumentDetails(null);
                setViewMode('documents');
            }

            await loadDocumentsInCollection(selectedCollection.collection_name);
        } catch (err) {
            setError('문서 삭제에 실패했습니다.');
            console.error('Failed to delete document:', err);
        } finally {
            setLoading(false);
        }
    };

    // 컬렉션 선택
    const handleSelectCollection = async (collection: Collection) => {
        setSelectedCollection(collection);
        setSelectedDocument(null);
        setDocumentDetails(null);
        setSearchQuery('');
        setSearchResults([]);
        setViewMode('documents');
        await loadDocumentsInCollection(collection.collection_name);
    };

    // 문서 선택
    const handleSelectDocument = async (document: DocumentInCollection) => {
        if (!selectedCollection) return;

        setSelectedDocument(document);
        setSearchQuery('');
        setSearchResults([]);
        setViewMode('document-detail');
        await loadDocumentDetails(selectedCollection.collection_name, document.document_id);
    };

    // 뒤로 가기
    const handleGoBack = () => {
        if (viewMode === 'document-detail') {
            setViewMode('documents');
            setSelectedDocument(null);
            setDocumentDetails(null);
            setSearchQuery('');
            setSearchResults([]);
        } else if (viewMode === 'documents-graph') {
            setViewMode('documents');
            setDocumentDetailMeta(null);
            setDocumentDetailEdges(null);
        } else if (viewMode === 'documents') {
            setViewMode('collections');
            setSelectedCollection(null);
            setDocumentsInCollection([]);
        } else if (viewMode === 'all-documents-graph') {
            setViewMode('collections');
        }
    };

    // 파일 업로드 처리 (전역 모달 사용)
    const handleSingleFileUpload = () => {
        if (selectedCollection) {
            openModal(selectedCollection, false);
        }
    };

    const handleFolderUpload = () => {
        if (selectedCollection) {
            openModal(selectedCollection, true);
        }
    };

    // 문서 메타데이터 조회
    const handleGetDocumentDetailMeta = async () => {
        if (!selectedCollection) {
            setError('컬렉션이 선택되지 않았습니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await getDocumentDetailMeta(selectedCollection.collection_name);
            console.log('Document detail meta:', response);
            setDocumentDetailMeta(response);
        } catch (err) {
            setError('문서 메타데이터를 불러오는데 실패했습니다.');
            console.error('Failed to get document detail meta:', err);
        } finally {
            setLoading(false);
        }
    };

    // 문서 메타데이터 조회
    const handleGetDocumentDetailEdges = async () => {
        if (!selectedCollection) {
            setError('컬렉션이 선택되지 않았습니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await getDocumentDetailEdges(selectedCollection.collection_name);
            console.log('Document detail edges:', response);
            setDocumentDetailEdges(response);
        } catch (err) {
            setError('문서 메타데이터를 불러오는데 실패했습니다.');
            console.error('Failed to get document detail edges:', err);
        } finally {
            setLoading(false);
        }
    };

    // 문서 메타데이터 조회
    const handleGetAllDocumentDetailMeta = async () => {
        if (allDocumentDetailMeta) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await getAllDocumentDetailMeta();
            console.log('Document detail meta:', response);
            setAllDocumentDetailMeta(response);
        } catch (err) {
            setError('문서 메타데이터를 불러오는데 실패했습니다.');
            console.error('Failed to get document detail meta:', err);
        } finally {
            setLoading(false);
        }
    };

    // 문서 메타데이터 조회
    const handleGetAllDocumentDetailEdges = async () => {
        if (allDocumentDetailEdges) {
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const response = await getAllDocumentDetailEdges();
            console.log('Document detail edges:', response);
            setAllDocumentDetailEdges(response);
        } catch (err) {
            setError('문서 메타데이터를 불러오는데 실패했습니다.');
            console.error('Failed to get document detail edges:', err);
        } finally {
            setLoading(false);
        }
    };

    // 그래프 뷰로 전환 시 메타데이터 로드
    const handleSwitchToGraphView = async () => {
        setViewMode('documents-graph');
        await Promise.all([
            handleGetDocumentDetailMeta(),
            handleGetDocumentDetailEdges()
        ]);
    };

    const handleSwitchToAllGraphView = async () => {
        setViewMode('all-documents-graph');
        await Promise.all([
            handleGetAllDocumentDetailMeta(),
            handleGetAllDocumentDetailEdges()
        ]);
    };

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    {viewMode !== 'collections' && (
                        <button onClick={handleGoBack} className={`${styles.button} ${styles.secondary}`}>
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
                                    onClick={() => setCollectionFilter('all')}
                                    className={`${styles.button} ${collectionFilter === 'all' ? styles.active : styles.secondary}`}
                                >
                                    모두
                                </button>
                                <button
                                    onClick={() => setCollectionFilter('personal')}
                                    className={`${styles.button} ${collectionFilter === 'personal' ? styles.active : styles.secondary}`}
                                >
                                    개인
                                </button>
                                <button
                                    onClick={() => setCollectionFilter('shared')}
                                    className={`${styles.button} ${collectionFilter === 'shared' ? styles.active : styles.secondary}`}
                                >
                                    공유
                                </button>
                            </div>
                            <button onClick={handleSwitchToAllGraphView} className={`${styles.button} ${styles.secondary}`}>
                                모든 그래프 보기
                            </button>
                            <button onClick={() => setShowCreateModal(true)} className={`${styles.button} ${styles.primary}`}>
                                새 컬렉션 생성
                            </button>
                        </>
                    )}
                    {viewMode === 'documents' && (
                        <>
                            <button onClick={handleSwitchToGraphView} className={`${styles.button} ${styles.secondary}`}>
                                그래프 보기
                            </button>
                            <button onClick={handleSingleFileUpload} className={`${styles.button} ${styles.primary}`}>
                                단일 문서 업로드
                            </button>
                            <button onClick={handleFolderUpload} className={`${styles.button} ${styles.primary}`}>
                                폴더 업로드
                            </button>
                        </>
                    )}
                    {viewMode === 'documents-graph' && (
                        <>
                            <button onClick={() => setViewMode('documents')} className={`${styles.button} ${styles.secondary}`}>
                                목록 보기
                            </button>
                            <button onClick={handleSingleFileUpload} className={`${styles.button} ${styles.primary}`}>
                                단일 문서 업로드
                            </button>
                            <button onClick={handleFolderUpload} className={`${styles.button} ${styles.primary}`}>
                                폴더 업로드
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {/* 컬렉션 목록 보기 */}
            {viewMode === 'collections' && (
                <div className={styles.collectionListContainer}>
                    {loading ? (
                        <div className={styles.loading}>로딩 중...</div>
                    ) : (
                        <div className={styles.collectionGrid}>
                            {getFilteredCollections().map((collection) => (
                                <div
                                    key={collection.collection_name}
                                    className={styles.collectionCard}
                                    onClick={() => handleSelectCollection(collection)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.collectionIcon}>
                                            <FiFolder />
                                        </div>
                                        <div className={`${styles.status} ${collection.is_shared ? styles.statusShared : styles.statusPersonal}`}>
                                            {collection.is_shared ? '공유' : '개인'}
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <h3 className={styles.collectionName}>{collection.collection_make_name}</h3>
                                        {collection.description && (
                                            <p className={styles.collectionDescription}>
                                                {collection.description}
                                            </p>
                                        )}
                                        <div className={styles.collectionMeta}>
                                            {collection.vector_size !== undefined && (
                                                <div className={styles.metaItem}>
                                                    <FiBarChart />
                                                    <span>Vector Size: {collection.vector_size}</span>
                                                </div>
                                            )}
                                            {collection.share_group && (
                                                <div className={styles.metaItem}>
                                                    <FiUsers />
                                                    <span>조직: {collection.share_group}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {collection.user_id === user?.user_id ? (
                                        <div className={styles.cardActions}>
                                            <button
                                                className={styles.actionButton}
                                                title="컬렉션 설정"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditCollectionRequest(collection);
                                                }}
                                            >
                                                <FiSettings />
                                            </button>
                                            <button
                                                className={`${styles.actionButton} ${styles.danger}`}
                                                title="컬렉션 삭제"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteCollectionRequest(collection);
                                                }}
                                            >
                                                <FiTrash2 />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className={styles.cardMessage}>
                                            공유받은 컬렉션은 편집이 불가능합니다.
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 문서 목록 보기 */}
            {viewMode === 'documents' && (
                <div className={styles.documentViewContainer}>
                    <div className={styles.documentListContainer}>
                        {loading ? (
                            <div className={styles.loading}>로딩 중...</div>
                        ) : documentsInCollection.length === 0 ? (
                            <div className={styles.emptyState}>이 컬렉션에는 문서가 없습니다.</div>
                        ) : (
                            <div className={styles.documentGrid}>
                                {documentsInCollection.map((doc) => (
                                    <div
                                        key={doc.document_id}
                                        className={styles.documentCard}
                                    >
                                        <div
                                            className={styles.documentContent}
                                            onClick={() => handleSelectDocument(doc)}
                                        >
                                            <h4 className={styles.documentTitle}>{doc.file_name}</h4>
                                            <p className={styles.docInfo}>
                                                청크: {doc.actual_chunks}개 |
                                                업로드: {getRelativeTime(doc.processed_at)}
                                            </p>
                                        </div>
                                        <button
                                            className={`${styles.deleteButton}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteDocument(doc);
                                            }}
                                            title="문서 삭제"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 문서 상세 보기 */}
            {viewMode === 'document-detail' && (
                <div className={styles.documentDetailContainer}>
                    {/* 검색 영역 */}
                    <div className={styles.searchContainer}>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="문서 내용을 검색하세요..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={styles.searchInput}
                            />
                            <button
                                onClick={handleDocumentSearch}
                                disabled={isSearching || !searchQuery.trim()}
                                className={`${styles.button} ${styles.primary}`}
                            >
                                {isSearching ? '검색 중...' : '검색'}
                            </button>
                        </div>
                    </div>

                    {/* 검색 결과 */}
                    {searchQuery && (
                        <div className={styles.searchResultsContainer}>
                            <h4 className={styles.searchResultsTitle}>검색 결과 ({searchResults.length}개)</h4>
                            {searchResults.length === 0 ? (
                                <div className={styles.emptyState}>검색 결과가 없습니다.</div>
                            ) : (
                                <div className={styles.searchResults}>
                                    {searchResults.map((result) => (
                                        <div key={result.id} className={styles.searchResultItem}>
                                            <div className={styles.resultHeader}>
                                                <span className={styles.resultScore}>
                                                    유사도: {(result.score * 100).toFixed(1)}%
                                                </span>
                                                <span className={styles.resultChunk}>
                                                    청크 #{result.chunk_index + 1}
                                                </span>
                                            </div>
                                            <p className={styles.resultText}>
                                                {result.chunk_text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 문서 상세 정보 */}
                    {!searchQuery && documentDetails && (
                        <div className={styles.documentDetailContent}>
                            <div className={styles.documentDetailMeta}>
                                <h3 className={styles.documentTitle}>{documentDetails.file_name}</h3>
                                <div className={styles.metaInfo}>
                                    <span>파일 타입: {documentDetails.file_type.toUpperCase()}</span>
                                    <span>전체 청크: {documentDetails.total_chunks}개</span>
                                    <span>업로드 시간: {getRelativeTime(documentDetails.processed_at)}</span>
                                </div>
                            </div>

                            <div className={styles.chunksContainer}>
                                <h4 className={styles.chunksTitle}>문서 내용</h4>
                                <div className={styles.chunksList}>
                                    {documentDetails.chunks.map((chunk) => (
                                        <div key={chunk.chunk_id} className={styles.chunkItem}>
                                            <div className={styles.chunkHeader}>
                                                <span className={styles.chunkIndex}>청크 #{chunk.chunk_index + 1}</span>
                                                <span className={styles.chunkSize}>
                                                    {formatFileSize(chunk.chunk_size)}
                                                </span>
                                            </div>
                                            <div className={styles.chunkText}>
                                                {chunk.chunk_text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {loading && <div className={styles.loading}>로딩 중...</div>}
                </div>
            )}

            {/* 문서 그래프 보기 */}
            {viewMode === 'documents-graph' && (
                <DocumentsGraph
                    loading={loading}
                    documentDetailMeta={documentDetailMeta}
                    documentDetailEdges={documentDetailEdges}
                />
            )}

            {viewMode === 'all-documents-graph' && (
                <DocumentsGraph
                    loading={loading}
                    documentDetailMeta={allDocumentDetailMeta}
                    documentDetailEdges={allDocumentDetailEdges}
                />
            )}

            {/* 컬렉션 생성 모달 */}
            <DocumentCollectionModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCollectionCreated={handleCollectionCreated}
            />

            {/* 컬렉션 편집 모달 */}
            {showEditModal && collectionToEdit && (
                <CollectionEditModal
                    collection={collectionToEdit}
                    isOpen={showEditModal}
                    onClose={handleCloseEditModal}
                    onUpdate={handleUpdateCollection}
                />
            )}


        </div>
    );
};

export default Documents;
