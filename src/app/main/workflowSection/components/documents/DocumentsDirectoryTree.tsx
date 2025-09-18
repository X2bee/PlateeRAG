'use client';
import React, { useState, useEffect } from 'react';
import { FiFolder, FiFile, FiChevronRight, FiChevronDown, FiDatabase } from 'react-icons/fi';
import styles from '@/app/main/workflowSection/assets/DocumentsDirectoryTree.module.scss';
import { Collection, DocumentInCollection, Folder } from '@/app/main/workflowSection/types/index';

interface DocumentsDirectoryTreeProps {
    loading: boolean;
    selectedCollection: Collection | null;
    folders: Folder[];
    documents: DocumentInCollection[];
    onFileSelect?: (document: DocumentInCollection) => void;
    expandedNodes?: Set<string>;
    onToggleNode?: (updater: (prev: Set<string>) => Set<string>) => void;
    currentFolder?: Folder | null;
    onNavigateToFolder?: (folder: Folder) => void;
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
    currentFolder,
    onNavigateToFolder
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

    // 현재 폴더가 변경될 때 해당 폴더와 상위 폴더들을 자동으로 펼치기
    useEffect(() => {
        if (currentFolder && onToggleNode) {
            onToggleNode(prev => {
                const newSet = new Set(prev);

                // 현재 폴더를 펼치기
                newSet.add(`folder-${currentFolder.id}`);

                // 현재 폴더까지의 경로에 있는 모든 상위 폴더들도 펼치기
                folders.forEach(folder => {
                    if (currentFolder.full_path.startsWith(folder.full_path) && folder.id !== currentFolder.id) {
                        newSet.add(`folder-${folder.id}`);
                    }
                });

                // 루트는 항상 펼쳐진 상태로 유지
                newSet.add('root');

                return newSet;
            });
        } else if (!currentFolder && onToggleNode) {
            // 루트로 이동했을 때도 루트를 펼쳐진 상태로 유지
            onToggleNode(prev => {
                const newSet = new Set(prev);
                newSet.add('root');
                return newSet;
            });
        }
    }, [currentFolder, folders, onToggleNode]);

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
            : (node.id === 'root' && currentFolder === null);        return (
            <div key={node.id} className={styles.treeNode}>
                <div
                    className={`${styles.nodeContent} ${node.type === 'file' ? styles.fileNode : styles.folderNode} ${isCurrentFolder ? styles.currentFolder : ''}`}
                    style={{ paddingLeft: `${level * 20 + 8}px` }}
                    onClick={() => {
                        if (node.type === 'folder') {
                            // 폴더 클릭 시 네비게이션과 펼침을 동시에 처리
                            if (node.id === 'root') {
                                // 루트 클릭 시 루트로 이동 (currentFolder를 null로 설정)
                                if (onNavigateToFolder && currentFolder !== null) {
                                    // DocumentDocumentsSection에서 null을 받으면 루트로 이동하도록 처리
                                    // 임시로 특별한 객체를 만들어서 루트임을 표시
                                    const rootFolder = { id: 'root', isRoot: true } as any;
                                    onNavigateToFolder(rootFolder);
                                }
                            } else if (node.data && onNavigateToFolder) {
                                // 일반 폴더 클릭 시 해당 폴더로 이동
                                onNavigateToFolder(node.data as Folder);
                            }
                            // 펼침/접힘 처리
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
