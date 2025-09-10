'use client';
import React, { useState, useEffect } from 'react';
import styles from '@/app/main/assets/Documents.module.scss';
import DocumentsGraph from '@/app/main/components/documents/DocumentsGraph';
import DocumentsDirectoryTree from '@/app/main/components/documents/DocumentsDirectoryTree';
import CollectionEditModal from '@/app/main/components/documents/CollectionEditModal';
import DocumentCollectionModal from '@/app/main/components/documents/DocumentCollectionModal';
import DocumentDirectoryModal from '@/app/main/components/documents/DocumentDirectoryModal';
import DocumentCollectionsSection from '@/app/main/components/documents/DocumentCollectionsSection';
import DocumentDocumentsSection from '@/app/main/components/documents/DocumentDocumentsSection';
import DocumentDetailSection from '@/app/main/components/documents/DocumentDetailSection';
import DocumentHeader from '@/app/main/components/documents/DocumentHeader';

import {
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
    remakeCollection,
} from '@/app/api/rag/retrievalAPI';
import { getEmbeddingConfigStatus } from '@/app/api/rag/embeddingAPI';
import { handleDeleteFolderRequest } from '@/app/main/components/documents/DocumentDirectory';
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
    Folder,
} from '@/app/main/types/index';

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
const Documents: React.FC = () => {
    const { user } = useAuth();
    const { openModal, setOnUploadComplete } = useDocumentFileModal();
    const [viewMode, setViewMode] = useState<ViewMode>('collections');
    const [previousViewMode, setPreviousViewMode] = useState<ViewMode>('documents');
    const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all');
    const [collections, setCollections] = useState<Collection[]>([]);
    const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
    const [documentsInCollection, setDocumentsInCollection] = useState<DocumentInCollection[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<DocumentInCollection | null>(null);
    const [documentDetails, setDocumentDetails] = useState<DocumentInCollection | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [documentDetailMeta, setDocumentDetailMeta] = useState<any>(null);
    const [documentDetailEdges, setDocumentDetailEdges] = useState<any>(null);

    // Graph 데이터 상태
    const [allDocumentDetailMeta, setAllDocumentDetailMeta] = useState<any>(null);
    const [allDocumentDetailEdges, setAllDocumentDetailEdges] = useState<any>(null);

    // 모달 상태
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [collectionToEdit, setCollectionToEdit] = useState<Collection | null>(null);

    // 폴더 관련 상태
    const [folders, setFolders] = useState<Folder[]>([]);
    const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
    const [folderPath, setFolderPath] = useState<Folder[]>([]);
    const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

    // 디렉토리 트리 펼침 상태
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // 로딩 및 에러 상태
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Embedding 설정 상태
    const [embeddingConfig, setEmbeddingConfig] = useState<EmbeddingConfig | null>(null);
    const [embeddingLoading, setEmbeddingLoading] = useState(false);



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

    // Embedding 설정 로드
    const loadEmbeddingConfig = async () => {
        try {
            setEmbeddingLoading(true);
            const config = await getEmbeddingConfigStatus() as EmbeddingConfig;
            setEmbeddingConfig(config);
        } catch (err) {
            console.error('Failed to load embedding config:', err);
        } finally {
            setEmbeddingLoading(false);
        }
    };

    // 컬렉션 내 문서 목록 로드
    const loadDocumentsInCollection = async (collectionName: string) => {
        try {
            setLoading(true);
            setError(null);
            const response = await listDocumentsInCollection(collectionName) as DocumentsInCollectionResponse;
            setDocumentsInCollection(response.documents || []);

            // directory_info에서 폴더 정보 추출
            if (response.directory_info) {
                setFolders(response.directory_info);
            } else {
                setFolders([]);
            }
        } catch (err) {
            setError('문서 목록을 불러오는데 실패했습니다.');
            console.error('Failed to load documents in collection:', err);
            setDocumentsInCollection([]);
            setFolders([]);
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

    // 폴더 삭제 래퍼 함수
    const handleDeleteFolder = (folder: Folder) => {
        handleDeleteFolderRequest(
            folder,
            selectedCollection!,
            documentsInCollection,
            () => {
                // 삭제 성공 후 컬렉션 데이터 새로고침
                if (selectedCollection) {
                    loadDocumentsInCollection(selectedCollection.collection_name);
                }
            }
        );
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



    // 폴더로 이동
    const handleNavigateToFolder = (folder: Folder) => {
        setCurrentFolder(folder);
        // 현재 폴더까지의 경로 업데이트
        // full_path를 파싱하여 정확한 경로 생성
        if (selectedCollection) {
            const pathParts = folder.full_path
                .replace(`/${selectedCollection.collection_make_name}`, '')
                .split('/')
                .filter(part => part.length > 0);

            // 전체 경로에서 폴더들을 찾아서 folderPath 구성
            const newPath: Folder[] = [];
            let currentPath = `/${selectedCollection.collection_make_name}`;

            for (const part of pathParts) {
                currentPath += `/${part}`;
                const pathFolder = folders.find(f => f.full_path === currentPath);
                if (pathFolder) {
                    newPath.push(pathFolder);
                }
            }

            setFolderPath(newPath);
        }
    };

    // 상위 폴더로 이동
    const handleNavigateUp = () => {
        if (folderPath.length === 0) {
            // 컬렉션 루트로 이동
            setCurrentFolder(null);
            setFolderPath([]);
        } else {
            // 이전 폴더로 이동
            const newPath = folderPath.slice(0, -1);
            setFolderPath(newPath);
            setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1] : null);
        }
    };

    // 컬렉션 리메이크
    const handleRemakeCollection = async () => {
        if (!selectedCollection) return;

        showDeleteConfirmToastKo({
            title: '컬렉션 리메이크 확인',
            message: `임베딩을 다시 만들겠습니까? 이 작업은 되돌릴 수 없으며 상당한 시간이 소요될 수 있습니다.\n\n컬렉션: ${selectedCollection.collection_make_name}`,
            itemName: selectedCollection.collection_make_name,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const remakeResult = await remakeCollection(selectedCollection.collection_name);

                    showDeleteSuccessToastKo({
                        itemName: selectedCollection.collection_make_name,
                        itemType: '컬렉션 리메이크',
                    });

                    await Promise.all([
                        loadCollections(),
                        loadEmbeddingConfig()
                    ]);

                    if (remakeResult && (remakeResult as any).new_collection_name) {
                        const updatedCollections = await listCollections() as CollectionsResponse;
                        const newCollection = updatedCollections.find(
                            col => col.collection_name === (remakeResult as any).new_collection_name
                        );

                        if (newCollection) {
                            setSelectedCollection(newCollection);
                            await loadDocumentsInCollection(newCollection.collection_name);
                        }
                    }
                } catch (error) {
                    console.error('Failed to remake collection:', error);
                    showDeleteErrorToastKo({
                        itemName: selectedCollection.collection_make_name,
                        itemType: '컬렉션 리메이크',
                        error: error instanceof Error ? error : 'Unknown error',
                    });
                } finally {
                    setLoading(false);
                }
            },
            confirmText: '리메이크',
            cancelText: '취소',
        });
    };

    // 문서 삭제 (Toast 확인 후 삭제)
    const handleDeleteDocument = async (document: DocumentInCollection) => {
        if (!selectedCollection) return;

        showDeleteConfirmToastKo({
            title: '문서 삭제 확인',
            message: `'${document.file_name}' 문서를 정말로 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: document.file_name,
            onConfirm: async () => {
                try {
                    setLoading(true);
                    setError(null);
                    await deleteDocumentFromCollection(selectedCollection.collection_name, document.document_id);

                    if (selectedDocument?.document_id === document.document_id) {
                        setSelectedDocument(null);
                        setDocumentDetails(null);
                        setViewMode('documents');
                    }

                    showDeleteSuccessToastKo({
                        itemName: document.file_name,
                        itemType: '문서',
                    });

                    await loadDocumentsInCollection(selectedCollection.collection_name);
                } catch (error) {
                    console.error('Failed to delete document:', error);
                    showDeleteErrorToastKo({
                        itemName: document.file_name,
                        itemType: '문서',
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

    // 컬렉션 선택
    const handleSelectCollection = async (collection: Collection) => {
        setSelectedCollection(collection);
        setSelectedDocument(null);
        setDocumentDetails(null);
        setSearchQuery('');
        setSearchResults([]);
        // 폴더 상태 초기화
        setCurrentFolder(null);
        setFolderPath([]);
        setFolders([]);
        // 디렉토리 트리 펼침 상태 초기화
        setExpandedNodes(new Set());
        setViewMode('documents');
        await Promise.all([
            loadDocumentsInCollection(collection.collection_name),
            loadEmbeddingConfig()
        ]);
    };

    // 문서 선택
    const handleSelectDocument = async (document: DocumentInCollection) => {
        if (!selectedCollection) return;

        // 현재 뷰 모드를 이전 뷰 모드로 저장
        setPreviousViewMode(viewMode);
        setSelectedDocument(document);
        setSearchQuery('');
        setSearchResults([]);
        setViewMode('document-detail');
        await loadDocumentDetails(selectedCollection.collection_name, document.document_id);
    };

    // 뒤로 가기
    const handleGoBack = () => {
        if (viewMode === 'document-detail') {
            // 이전 뷰 모드로 돌아가기 (디렉토리 트리 상태 유지)
            setViewMode(previousViewMode);
            setSelectedDocument(null);
            setDocumentDetails(null);
            setSearchQuery('');
            setSearchResults([]);
        } else if (viewMode === 'documents-graph') {
            setViewMode('documents');
            setDocumentDetailMeta(null);
            setDocumentDetailEdges(null);
        } else if (viewMode === 'documents-directory') {
            setViewMode('documents');
        } else if (viewMode === 'documents') {
            setViewMode('collections');
            setSelectedCollection(null);
            setDocumentsInCollection([]);
            // 폴더 상태 초기화
            setCurrentFolder(null);
            setFolderPath([]);
            setFolders([]);
            // 디렉토리 트리 펼침 상태 초기화
            setExpandedNodes(new Set());
        } else if (viewMode === 'all-documents-graph') {
            setViewMode('collections');
        }
    };

    // 파일 업로드 처리 (전역 모달 사용)
    const handleSingleFileUpload = () => {
        if (selectedCollection) {
            openModal(selectedCollection, false, currentFolder);
        }
    };

    const handleFolderUpload = () => {
        if (selectedCollection) {
            openModal(selectedCollection, true, currentFolder);
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

    const handleSwitchToDirectoryView = () => {
        setViewMode('documents-directory');
    };

    // 새로고침 함수
    const handleRefresh = async () => {
        if (viewMode === 'collections') {
            await loadCollections();
        } else if (selectedCollection && (viewMode === 'documents' || viewMode === 'documents-graph' || viewMode === 'documents-directory')) {
            await loadDocumentsInCollection(selectedCollection.collection_name);
        } else if (viewMode === 'document-detail' && selectedCollection && selectedDocument) {
            await loadDocumentDetails(selectedCollection.collection_name, selectedDocument.document_id);
        }
    };

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <DocumentHeader
                viewMode={viewMode}
                collectionFilter={collectionFilter}
                selectedCollection={selectedCollection}
                selectedDocument={selectedDocument}
                loading={loading}
                embeddingLoading={embeddingLoading}
                embeddingConfig={embeddingConfig}
                onGoBack={handleGoBack}
                onSetCollectionFilter={setCollectionFilter}
                onRefresh={handleRefresh}
                onSwitchToAllGraphView={handleSwitchToAllGraphView}
                onShowCreateModal={() => setShowCreateModal(true)}
                onSwitchToGraphView={handleSwitchToGraphView}
                onSwitchToDirectoryView={handleSwitchToDirectoryView}
                onShowCreateFolderModal={() => setShowCreateFolderModal(true)}
                onSingleFileUpload={handleSingleFileUpload}
                onFolderUpload={handleFolderUpload}
                onRemakeCollection={handleRemakeCollection}
            />

            {error && <div className={styles.error}>{error}</div>}

            {/* 컬렉션 목록 보기 */}
            {viewMode === 'collections' && (
                <DocumentCollectionsSection
                    collections={collections}
                    collectionFilter={collectionFilter}
                    loading={loading}
                    userId={user?.user_id}
                    onSelectCollection={handleSelectCollection}
                    onEditCollection={handleEditCollectionRequest}
                    onDeleteCollection={handleDeleteCollectionRequest}
                />
            )}

            {/* 문서 목록 보기 */}
            {viewMode === 'documents' && (
                <DocumentDocumentsSection
                    selectedCollection={selectedCollection}
                    folders={folders}
                    documents={documentsInCollection}
                    currentFolder={currentFolder}
                    folderPath={folderPath}
                    loading={loading}
                    expandedNodes={expandedNodes}
                    onSelectDocument={handleSelectDocument}
                    onNavigateToFolder={handleNavigateToFolder}
                    onNavigateUp={handleNavigateUp}
                    onDeleteDocument={handleDeleteDocument}
                    onDeleteFolder={handleDeleteFolder}
                    onSetCurrentFolder={setCurrentFolder}
                    onSetFolderPath={setFolderPath}
                    onToggleNode={setExpandedNodes}
                />
            )}

            {/* 문서 상세 보기 */}
            {viewMode === 'document-detail' && (
                <DocumentDetailSection
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    isSearching={isSearching}
                    documentDetails={documentDetails}
                    loading={loading}
                    onSearchQueryChange={setSearchQuery}
                    onSearch={handleDocumentSearch}
                />
            )}

            {/* 문서 그래프 보기 */}
            {viewMode === 'documents-graph' && (
                <DocumentsGraph
                    loading={loading}
                    documentDetailMeta={documentDetailMeta}
                    documentDetailEdges={documentDetailEdges}
                />
            )}

            {/* 디렉토리 구조 보기 */}
            {viewMode === 'documents-directory' && (
                <DocumentsDirectoryTree
                    loading={loading}
                    selectedCollection={selectedCollection}
                    folders={folders}
                    documents={documentsInCollection}
                    onFileSelect={handleSelectDocument}
                    expandedNodes={expandedNodes}
                    onToggleNode={setExpandedNodes}
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

            {/* 폴더 생성 모달 */}
            <DocumentDirectoryModal
                isOpen={showCreateFolderModal}
                onClose={() => setShowCreateFolderModal(false)}
                selectedCollection={selectedCollection}
                currentFolder={currentFolder}
                folderPath={folderPath}
                onSuccess={() => {
                    if (selectedCollection) {
                        loadDocumentsInCollection(selectedCollection.collection_name);
                    }
                }}
            />

        </div>
    );
};

export default Documents;
