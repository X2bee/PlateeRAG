'use client';
import React from 'react';
import {
    FiFolder,
    FiUser,
    FiTrash2,
    FiBarChart,
    FiClock,
} from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/Documents.module.scss';
import { Collection, DocumentInCollection, Folder } from '@/app/main/workflowSection/types/index';
import { getRelativeTime } from '@/app/_common/api/rag/retrievalAPI';
import DocumentsDirectoryTree from './DocumentsDirectoryTree';

interface DocumentDocumentsSectionProps {
    selectedCollection: Collection | null;
    folders: Folder[];
    documents: DocumentInCollection[];
    currentFolder: Folder | null;
    folderPath: Folder[];
    loading: boolean;
    expandedNodes: Set<string>;
    showDirectorySidebar: boolean;
    onSelectDocument: (document: DocumentInCollection) => void;
    onNavigateToFolder: (folder: Folder) => void;
    onNavigateUp: () => void;
    onDeleteDocument: (document: DocumentInCollection) => void;
    onDeleteFolder: (folder: Folder) => void;
    onSetCurrentFolder: (folder: Folder | null) => void;
    onSetFolderPath: (path: Folder[]) => void;
    onToggleNode: (updater: (prev: Set<string>) => Set<string>) => void;
}

const DocumentDocumentsSection: React.FC<DocumentDocumentsSectionProps> = ({
    selectedCollection,
    folders,
    documents,
    currentFolder,
    folderPath,
    loading,
    expandedNodes,
    showDirectorySidebar,
    onSelectDocument,
    onNavigateToFolder,
    onNavigateUp,
    onDeleteDocument,
    onDeleteFolder,
    onSetCurrentFolder,
    onSetFolderPath,
    onToggleNode,
}) => {
    // 현재 폴더에 속한 하위 폴더들을 필터링
    const getCurrentFolders = () => {
        if (!selectedCollection) return [];

        return folders.filter(folder => {
            if (currentFolder) {
                // 현재 폴더의 직계 자식 폴더들만 표시
                return folder.parent_folder_id === currentFolder.id;
            } else {
                // 루트 폴더들만 표시 (is_root가 true인 것들)
                return folder.is_root === true;
            }
        });
    };

    // 현재 폴더에 속한 문서들을 필터링
    const getCurrentDocuments = () => {
        if (!selectedCollection) return [];

        return documents.filter(doc => {
            if (currentFolder) {
                // 현재 폴더의 full_path와 문서의 directory_full_path 비교
                const currentFolderFullPath = currentFolder.full_path;
                const docDirectoryFullPath = doc.metadata?.directory_full_path || '';
                return docDirectoryFullPath === currentFolderFullPath;
            } else {
                // 루트에 있는 문서들만 표시
                const docDirectoryFullPath = doc.metadata?.directory_full_path || '';
                const collectionRootPath = `/${selectedCollection.collection_make_name}`;

                // directory_full_path가 없거나, 빈 문자열이거나, 컬렉션 루트 경로인 경우 루트로 간주
                return docDirectoryFullPath === '' ||
                       !doc.metadata?.directory_full_path ||
                       docDirectoryFullPath === collectionRootPath;
            }
        });
    };

    return (
        <div className={styles.documentViewContainer}>
            <div className={styles.documentMainContent}>
                {showDirectorySidebar && (
                    <div className={styles.documentSidePanel}>
                        <DocumentsDirectoryTree
                            loading={loading}
                            selectedCollection={selectedCollection}
                            folders={folders}
                            documents={documents}
                            onFileSelect={onSelectDocument}
                            expandedNodes={expandedNodes}
                            onToggleNode={onToggleNode}
                            currentFolder={currentFolder}
                            onNavigateToFolder={(folder) => {
                                if (folder && (folder as any).id === 'root' && (folder as any).isRoot) {
                                    // 루트로 이동
                                    onSetCurrentFolder(null);
                                    onSetFolderPath([]);
                                } else {
                                    // 일반 폴더로 이동
                                    onNavigateToFolder(folder);
                                }
                            }}
                        />
                    </div>
                )}
                <div className={styles.documentListContainer}>
                    {loading ? (
                        <div className={styles.loading}>로딩 중...</div>
                    ) : getCurrentDocuments().length === 0 && getCurrentFolders().length === 0 ? (
                        <div className={styles.emptyState}>
                            {currentFolder ? '이 폴더에는 문서가 없습니다.' : '이 컬렉션에는 문서가 없습니다.'}
                        </div>
                    ) : (
                        <div className={styles.documentGrid}>
                            {/* 현재 폴더의 하위 폴더들 먼저 표시 */}
                            {getCurrentFolders().map((folder) => (
                                <div
                                    key={`folder-${folder.id}`}
                                    className={styles.documentCard}
                                    onClick={() => onNavigateToFolder(folder)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.collectionIcon}>
                                            <FiFolder />
                                        </div>
                                        <div className={`${styles.status} ${styles.statusFolder}`}>
                                            폴더
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <h3 className={styles.collectionName}>{folder.folder_name}</h3>
                                        <div className={styles.collectionMeta}>
                                            <div className={styles.metaItem}>
                                                <FiFolder />
                                                <span>경로: {folder.full_path}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <button
                                            className={`${styles.actionButton} ${styles.danger}`}
                                            title="폴더 삭제"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteFolder(folder);
                                            }}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* 현재 폴더의 문서들 표시 */}
                            {getCurrentDocuments().map((doc) => (
                                <div
                                    key={doc.document_id}
                                    className={styles.documentCard}
                                    onClick={() => onSelectDocument(doc)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.collectionIcon}>
                                            <FiUser />
                                        </div>
                                        <div className={`${styles.status} ${styles.statusPersonal}`}>
                                            문서
                                        </div>
                                    </div>

                                    <div className={styles.cardContent}>
                                        <h3 className={styles.collectionName}>{doc.file_name}</h3>
                                        <div className={styles.collectionMeta}>
                                            <div className={styles.metaItem}>
                                                <FiBarChart />
                                                <span>청크: {doc.actual_chunks}개</span>
                                            </div>
                                            <div className={styles.metaItem}>
                                                <FiClock />
                                                <span>업로드: {getRelativeTime(doc.processed_at)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.cardActions}>
                                        <button
                                            className={`${styles.actionButton} ${styles.danger}`}
                                            title="문서 삭제"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteDocument(doc);
                                            }}
                                        >
                                            <FiTrash2 />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentDocumentsSection;
