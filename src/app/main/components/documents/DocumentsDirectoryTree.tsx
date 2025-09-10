'use client';
import React, { useState, useEffect } from 'react';
import { FiFolder, FiFile, FiChevronRight, FiChevronDown, FiDatabase } from 'react-icons/fi';
import styles from '@/app/main/assets/DocumentsDirectoryTree.module.scss';
import { Collection, DocumentInCollection, Folder } from '@/app/main/types/index';

interface DocumentsDirectoryTreeProps {
    loading: boolean;
    selectedCollection: Collection | null;
    folders: Folder[];
    documents: DocumentInCollection[];
    onFileSelect?: (document: DocumentInCollection) => void;
    expandedNodes?: Set<string>;
    onToggleNode?: (updater: (prev: Set<string>) => Set<string>) => void;
    currentFolder?: Folder | null;
}

interface TreeNode {
    id: string;
    name: string;
    type: 'folder' | 'file';
    path: string;
    children: TreeNode[];
    data?: Folder | DocumentInCollection;
    expanded?: boolean;
}

const DocumentsDirectoryTree: React.FC<DocumentsDirectoryTreeProps> = ({
    loading,
    selectedCollection,
    folders,
    documents,
    onFileSelect,
    expandedNodes = new Set<string>(),
    onToggleNode,
    currentFolder
}) => {
    const [treeData, setTreeData] = useState<TreeNode[]>([]);

    // 트리 데이터 구성
    useEffect(() => {
        if (!selectedCollection) {
            setTreeData([]);
            return;
        }

        const buildTree = (): TreeNode[] => {
            const nodeMap = new Map<string, TreeNode>();
            const rootNodes: TreeNode[] = [];

            // 컬렉션 루트 노드 생성
            const collectionRootPath = `/${selectedCollection.collection_make_name}`;
            const rootNode: TreeNode = {
                id: 'root',
                name: selectedCollection.collection_make_name,
                type: 'folder',
                path: collectionRootPath,
                children: [],
                expanded: true
            };
            nodeMap.set('root', rootNode);
            rootNodes.push(rootNode);

            // 폴더 노드 생성
            folders.forEach(folder => {
                const node: TreeNode = {
                    id: `folder-${folder.id}`,
                    name: folder.folder_name,
                    type: 'folder',
                    path: folder.full_path,
                    children: [],
                    data: folder,
                    expanded: expandedNodes.has(`folder-${folder.id}`)
                };
                nodeMap.set(`folder-${folder.id}`, node);
            });

            // 문서 노드 생성
            documents.forEach(doc => {
                const node: TreeNode = {
                    id: `file-${doc.document_id}`,
                    name: doc.file_name,
                    type: 'file',
                    path: doc.metadata?.directory_full_path || collectionRootPath,
                    children: [],
                    data: doc
                };
                nodeMap.set(`file-${doc.document_id}`, node);
            });

            // 트리 구조 구성
            nodeMap.forEach(node => {
                if (node.id === 'root') return;

                // 부모 찾기
                let parentNode: TreeNode | undefined;

                if (node.type === 'folder' && node.data) {
                    const folderData = node.data as Folder;
                    if (folderData.is_root) {
                        parentNode = rootNode;
                    } else {
                        // 부모 폴더 찾기
                        const parentFolder = folders.find(f => f.id === folderData.parent_folder_id);
                        if (parentFolder) {
                            parentNode = nodeMap.get(`folder-${parentFolder.id}`);
                        } else {
                            parentNode = rootNode;
                        }
                    }
                } else if (node.type === 'file') {
                    // 문서의 directory_full_path를 기반으로 부모 폴더 찾기
                    const docPath = node.path;
                    if (docPath === collectionRootPath || !docPath || docPath === '') {
                        parentNode = rootNode;
                    } else {
                        // 경로와 일치하는 폴더 찾기
                        const parentFolder = folders.find(f => f.full_path === docPath);
                        if (parentFolder) {
                            parentNode = nodeMap.get(`folder-${parentFolder.id}`);
                        } else {
                            parentNode = rootNode;
                        }
                    }
                }

                if (parentNode) {
                    parentNode.children.push(node);
                }
            });

            // 자식 노드 정렬 (폴더 먼저, 그 다음 파일)
            const sortChildren = (node: TreeNode) => {
                node.children.sort((a, b) => {
                    if (a.type !== b.type) {
                        return a.type === 'folder' ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                });
                node.children.forEach(sortChildren);
            };

            rootNodes.forEach(sortChildren);
            return rootNodes;
        };

        setTreeData(buildTree());
    }, [selectedCollection, folders, documents, expandedNodes]);

    const toggleNode = (nodeId: string) => {
        if (onToggleNode) {
            onToggleNode(prev => {
                const newSet = new Set(prev);
                if (newSet.has(nodeId)) {
                    newSet.delete(nodeId);
                } else {
                    newSet.add(nodeId);
                }
                return newSet;
            });
        }
    };

    const handleFileClick = (node: TreeNode) => {
        if (node.type === 'file' && node.data && onFileSelect) {
            onFileSelect(node.data as DocumentInCollection);
        }
    };

    const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
        const hasChildren = node.children.length > 0;
        const isExpanded = node.expanded || expandedNodes.has(node.id);

        // 현재 폴더인지 확인
        const isCurrentFolder = currentFolder
            ? (node.type === 'folder' && node.data && (node.data as Folder).id === currentFolder.id)
            : (node.id === 'root' && !currentFolder);

        return (
            <div key={node.id} className={styles.treeNode}>
                <div
                    className={`${styles.nodeContent} ${node.type === 'file' ? styles.fileNode : styles.folderNode} ${isCurrentFolder ? styles.currentFolder : ''}`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => {
                        if (node.type === 'folder') {
                            toggleNode(node.id);
                        } else {
                            handleFileClick(node);
                        }
                    }}
                >
                    <div className={styles.nodeIcon}>
                        {node.type === 'folder' && hasChildren && (
                            <span className={styles.expandIcon}>
                                {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                            </span>
                        )}
                        {node.type === 'folder' ? (
                            node.id === 'root' ? (
                                <FiDatabase className={styles.folderIcon} />
                            ) : (
                                <FiFolder className={styles.folderIcon} />
                            )
                        ) : (
                            <FiFile className={styles.fileIcon} />
                        )}
                    </div>
                    <span className={styles.nodeName}>{node.name}</span>
                    {node.type === 'file' && node.data && (
                        <span className={styles.fileInfo}>
                            ({(node.data as DocumentInCollection).actual_chunks} 청크)
                        </span>
                    )}
                </div>

                {node.type === 'folder' && hasChildren && isExpanded && (
                    <div className={styles.nodeChildren}>
                        {node.children.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={styles.directoryTreeContainer}>
            <div className={styles.treeHeader}>
                <h3>디렉토리 구조</h3>
                {selectedCollection && (
                    <p>컬렉션: {selectedCollection.collection_make_name}</p>
                )}
            </div>

            {loading ? (
                <div className={styles.loading}>디렉토리 구조를 불러오는 중...</div>
            ) : (
                <div className={styles.treeContent}>
                    {treeData.length === 0 ? (
                        <div className={styles.emptyState}>
                            표시할 디렉토리가 없습니다.
                        </div>
                    ) : (
                        <div className={styles.treeView}>
                            {treeData.map(node => renderTreeNode(node))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DocumentsDirectoryTree;
