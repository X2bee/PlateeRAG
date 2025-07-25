'use client';
import React, { useState, useEffect, useRef } from 'react';
import styles from '../assets/Documents.module.scss';
import { usePagesLayout } from '@/app/_common/components/PagesLayoutContent';

import {
    isValidCollectionName,
    formatFileSize,
    getRelativeTime,
    listCollections,
    createCollection,
    uploadDocument,
    searchDocuments,
    deleteCollection,
    listDocumentsInCollection,
    getDocumentDetails,
    deleteDocumentFromCollection,
} from '@/app/api/retrievalAPI';

interface Collection {
    collection_name: string;
    collection_make_name: string;
    vector_size?: number;
    points_count?: number;
    description?: string;
    registered_at: string;
    updated_at: string;
}

interface DocumentInCollection {
    document_id: string;
    file_name: string;
    file_type: string;
    processed_at: string;
    total_chunks: number;
    actual_chunks: number;
    metadata: any;
    chunks: ChunkInfo[];
}

interface ChunkInfo {
    chunk_id: string;
    chunk_index: number;
    chunk_size: number;
    chunk_text_preview: string;
}

interface DocumentDetails {
    document_id: string;
    file_name: string;
    file_type: string;
    processed_at: string;
    total_chunks: number;
    metadata: any;
    chunks: DetailedChunk[];
}

interface DetailedChunk {
    chunk_id: string;
    chunk_index: number;
    chunk_size: number;
    chunk_text: string;
}

interface SearchResult {
    id: string;
    score: number;
    document_id: string;
    chunk_index: number;
    chunk_text: string;
    file_name: string;
    file_type: string;
    metadata: any;
}

interface UploadProgress {
    fileName: string;
    status: 'uploading' | 'success' | 'error';
    progress: number;
    error?: string;
}

type CollectionsResponse = Collection[];

interface DocumentsInCollectionResponse {
    collection_name: string;
    total_documents: number;
    total_chunks: number;
    documents: DocumentInCollection[];
}

interface SearchResponse {
    query: string;
    results: SearchResult[];
    total: number;
    search_params: any;
}

type ViewMode = 'collections' | 'documents' | 'document-detail';

const Documents: React.FC = () => {
    const layoutContext = usePagesLayout();
    const sidebarWasOpenRef = useRef<boolean | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('collections');
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [documentsInCollection, setDocumentsInCollection] = useState<DocumentInCollection[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentInCollection | null>(null);
    const [documentDetails, setDocumentDetails] = useState<DocumentDetails | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

    // 모달 상태
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);

    // 폼 상태
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDescription, setNewCollectionDescription] = useState('');

    // 로딩 및 에러 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isAnyModalOpen = showCreateModal || showDeleteModal;

    useEffect(() => {
        if (layoutContext) {
            const { isSidebarOpen, setIsSidebarOpen } = layoutContext;
            if (isAnyModalOpen) {
                if (sidebarWasOpenRef.current === null) {
                    sidebarWasOpenRef.current = isSidebarOpen;
                    if (isSidebarOpen) {
                        setIsSidebarOpen(false);
                    }
                }
            } else {
                if (sidebarWasOpenRef.current === true) {
                    setIsSidebarOpen(true);
                }
                sidebarWasOpenRef.current = null;
            }
        }
    }, [isAnyModalOpen, layoutContext]);


    // 컬렉션 목록 로드
    useEffect(() => {
        loadCollections();
    }, []);

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
            const response = await getDocumentDetails(collectionName, documentId) as DocumentDetails;
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

    // 컬렉션 생성
    const handleCreateCollection = async () => {
        if (!isValidCollectionName(newCollectionName)) {
            setError('컬렉션 이름은 한글, 영문, 숫자, 밑줄(_), 하이픈(-)만 사용할 수 있습니다.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await createCollection(
                newCollectionName,
                "Cosine",
                newCollectionDescription || undefined
            );
            setShowCreateModal(false);
            setNewCollectionName('');
            setNewCollectionDescription('');
            await loadCollections();
        } catch (err) {
            setError('컬렉션 생성에 실패했습니다.');
            console.error('Failed to create collection:', err);
        } finally {
            setLoading(false);
        }
    };

    // 컬렉션 삭제
    const handleDeleteCollectionRequest = (collection: Collection) => {
        setCollectionToDelete(collection);
        setShowDeleteModal(true);
    };

    const handleConfirmDeleteCollection = async () => {
        if (!collectionToDelete) return;

        try {
            setLoading(true);
            setError(null);
            await deleteCollection(collectionToDelete.collection_name);
            setShowDeleteModal(false);
            setCollectionToDelete(null);

            if (selectedCollection?.collection_name === collectionToDelete.collection_name) {
                setSelectedCollection(null);
                setDocumentsInCollection([]);
                setViewMode('collections');
            }

            await loadCollections();
        } catch (err) {
            setError('컬렉션 삭제에 실패했습니다.');
            console.error('Failed to delete collection:', err);
        } finally {
            setLoading(false);
        }
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
        } else if (viewMode === 'documents') {
            setViewMode('collections');
            setSelectedCollection(null);
            setDocumentsInCollection([]);
        }
    };

    // 파일 업로드 처리
    const handleFileUpload = async (files: FileList, isFolder: boolean = false) => {
        if (!selectedCollection) {
            setError('컬렉션을 먼저 선택해주세요.');
            return;
        }

        const fileArray = Array.from(files);
        const initialProgress: UploadProgress[] = fileArray.map(file => ({
            fileName: file.name,
            status: 'uploading',
            progress: 0
        }));
        setUploadProgress(initialProgress);

        try {
            // 폴더 업로드의 경우 순차 처리
            if (isFolder) {
                let successful = 0;
                let failed = 0;

                // 순차적으로 파일 업로드
                for (let index = 0; index < fileArray.length; index++) {
                    const file = fileArray[index];
                    
                    try {
                        // 진행 상태 업데이트 (시작)
                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? { ...item, progress: 10 } : item
                        ));

                        // 폴더 경로 정보를 메타데이터에 포함
                        const relativePath = file.webkitRelativePath || file.name;
                        const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/')) || '';
                        
                        const metadata = {
                            upload_type: 'folder',
                            folder_path: folderPath,
                            relative_path: relativePath,
                            original_name: file.name,
                            current_index: index + 1,
                            total_files: fileArray.length
                        };

                        // 진행 상태 업데이트 (업로드 중)
                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? { ...item, progress: 50 } : item
                        ));

                        await uploadDocument(
                            file,
                            selectedCollection.collection_name,
                            2000,
                            300,
                            metadata
                        );

                        // 성공 시 진행 상태 업데이트
                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? { ...item, status: 'success', progress: 100 } : item
                        ));

                        successful++;

                        // 파일 업로드 성공 시 즉시 문서 목록 새로고침
                        if (selectedCollection) {
                            loadDocumentsInCollection(selectedCollection.collection_name);
                        }
                        
                    } catch (error) {
                        // 실패 시 진행 상태 업데이트
                        setUploadProgress(prev => prev.map((item, idx) =>
                            idx === index ? {
                                ...item,
                                status: 'error',
                                progress: 0,
                                error: error instanceof Error ? error.message : '업로드 실패'
                            } : item
                        ));
                        
                        console.error(`Failed to upload file ${file.name}:`, error);
                        failed++;
                    }

                    // 잠시 대기 (서버 부하 방지)
                    if (index < fileArray.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 100));
                    }
                }
                
                // 결과 통계 표시
                if (failed > 0) {
                    setError(`${successful}개 파일 업로드 성공, ${failed}개 파일 실패`);
                } else {
                    setError(null);
                }

            } else {
                // 단일 파일 업로드
                const file = fileArray[0];
                try {
                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? { ...item, progress: 50 } : item
                    ));

                    await uploadDocument(
                        file,
                        selectedCollection.collection_name,
                        2000,
                        300,
                        { upload_type: 'single' }
                    );

                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? { ...item, status: 'success', progress: 100 } : item
                    ));

                    // 단일 파일 업로드 성공 시 즉시 문서 목록 새로고침
                    if (selectedCollection) {
                        loadDocumentsInCollection(selectedCollection.collection_name);
                    }
                } catch (err) {
                    setUploadProgress(prev => prev.map((item, index) =>
                        index === 0 ? {
                            ...item,
                            status: 'error',
                            progress: 0,
                            error: '업로드 실패'
                        } : item
                    ));
                    console.error(`Failed to upload file ${file.name}:`, err);
                    setError('파일 업로드에 실패했습니다.');
                }
            }

        } catch (error) {
            console.error('Upload process failed:', error);
            setError('업로드 처리 중 오류가 발생했습니다.');
        }

        // 업로드 완료 후 진행 상태 정리
        setTimeout(() => {
            setUploadProgress([]);
        }, 3000); // 3초 후 업로드 진행 상태 숨김
    };

    const handleSingleFileUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFileUpload(files, false);
        };
        input.click();
    };

    const handleFolderUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        input.onchange = (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files) handleFileUpload(files, true);
        };
        input.click();
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
                        {viewMode === 'document-detail' && `${selectedDocument?.file_name} - 문서 상세`}
                    </h2>
                </div>
                <div className={styles.headerRight}>
                    {viewMode === 'collections' && (
                        <button onClick={() => setShowCreateModal(true)} className={`${styles.button} ${styles.primary}`}>
                            새 컬렉션 생성
                        </button>
                    )}
                    {viewMode === 'documents' && (
                        <>
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
                            {collections.map((collection) => (
                                <div
                                    key={collection.collection_name}
                                    className={styles.collectionCard}
                                >
                                    <div
                                        className={styles.collectionContent}
                                        onClick={() => handleSelectCollection(collection)}
                                    >
                                        <h4>{collection.collection_make_name}</h4>
                                        <p className={styles.docInfo}>
                                            {collection.description}
                                        </p>
                                    </div>
                                    <button
                                        className={`${styles.deleteButton}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteCollectionRequest(collection);
                                        }}
                                        title="컬렉션 삭제"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 문서 목록 보기 */}
            {viewMode === 'documents' && (
                <div className={styles.documentViewContainer}>
                    {uploadProgress.length > 0 && (
                        <div className={styles.uploadProgressContainer}>
                            <div className={styles.progressHeader}>
                                <h4>업로드 진행 상태</h4>
                                <div className={styles.progressSummary}>
                                    <span className={styles.totalCount}>
                                        총 {uploadProgress.length}개 파일
                                    </span>
                                    <span className={styles.successCount}>
                                        성공: {uploadProgress.filter(item => item.status === 'success').length}
                                    </span>
                                    <span className={styles.errorCount}>
                                        실패: {uploadProgress.filter(item => item.status === 'error').length}
                                    </span>
                                    <span className={styles.uploadingCount}>
                                        진행 중: {uploadProgress.filter(item => item.status === 'uploading').length}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.progressList}>
                                {uploadProgress.map((item, index) => (
                                    <div key={index} className={`${styles.progressItem} ${styles[item.status]}`}>
                                        <div className={styles.fileInfo}>
                                            <span className={styles.fileName} title={item.fileName}>
                                                {item.fileName}
                                            </span>
                                            {item.status === 'uploading' && (
                                                <span className={styles.progressPercent}>
                                                    {item.progress}%
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.progressStatus}>
                                            {item.status === 'uploading' && (
                                                <div className={styles.progressBar}>
                                                    <div 
                                                        className={styles.progressFill}
                                                        style={{ width: `${item.progress}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                            <span className={`${styles.statusText} ${styles[item.status]}`}>
                                                {item.status === 'uploading' && '📤 업로드 중...'}
                                                {item.status === 'success' && '✅ 완료'}
                                                {item.status === 'error' && `❌ ${item.error || '실패'}`}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
                                            <h4>{doc.file_name}</h4>
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
                            <h4>검색 결과 ({searchResults.length}개)</h4>
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
                            <div className={styles.documentMeta}>
                                <h3>{documentDetails.file_name}</h3>
                                <div className={styles.metaInfo}>
                                    <span>파일 타입: {documentDetails.file_type.toUpperCase()}</span>
                                    <span>전체 청크: {documentDetails.total_chunks}개</span>
                                    <span>업로드 시간: {getRelativeTime(documentDetails.processed_at)}</span>
                                </div>
                            </div>

                            <div className={styles.chunksContainer}>
                                <h4>문서 내용</h4>
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

            {/* 컬렉션 생성 모달 */}
            {showCreateModal && (
                <div className={styles.modalBackdrop} onClick={() => setShowCreateModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>새 컬렉션 생성</h3>
                        <div className={styles.formGroup}>
                            <label>컬렉션 이름 *</label>
                            <input
                                type="text"
                                value={newCollectionName}
                                onChange={(e) => setNewCollectionName(e.target.value)}
                                placeholder="예: project_documents"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>설명 (선택사항)</label>
                            <textarea
                                value={newCollectionDescription}
                                onChange={(e) => setNewCollectionDescription(e.target.value)}
                                placeholder="컬렉션에 대한 간단한 설명을 입력하세요."
                            />
                        </div>
                        <div className={styles.modalActions}>
                            <button 
                                onClick={() => setShowCreateModal(false)} 
                                className={`${styles.button} ${styles.secondary}`}
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button 
                                onClick={handleCreateCollection} 
                                className={`${styles.button} ${styles.primary}`}
                                disabled={loading}
                            >
                                {loading ? '생성 중...' : '생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 컬렉션 삭제 모달 */}
            {showDeleteModal && collectionToDelete && (
                <div className={styles.modalBackdrop} onClick={() => setShowDeleteModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>컬렉션 삭제 확인</h3>
                        <p>
                            '<strong>{collectionToDelete.collection_make_name}</strong>' 컬렉션을 정말로 삭제하시겠습니까?<br/>
                            이 작업은 되돌릴 수 없으며, 컬렉션에 포함된 모든 문서가 삭제됩니다.
                        </p>
                        <div className={styles.modalActions}>
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setCollectionToDelete(null);
                                }}
                                className={`${styles.button} ${styles.secondary}`}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleConfirmDeleteCollection}
                                className={`${styles.button} ${styles.danger}`}
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
};

export default Documents;
