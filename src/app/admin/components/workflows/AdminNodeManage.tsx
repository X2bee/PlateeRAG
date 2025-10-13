'use client';

import React, { useState, useEffect } from 'react';
import { FiRefreshCw, FiChevronDown, FiChevronRight, FiInfo, FiGrid, FiList } from 'react-icons/fi';
import { getNodes, refreshNodes } from '@/app/_common/api/nodeAPI';
import { NodeCategory, Node, TreeNode } from './types';
import styles from '@/app/admin/assets/workflows/AdminNodeManage.module.scss';

const AdminNodeManage: React.FC = () => {
    const [nodes, setNodes] = useState<NodeCategory[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const [activeView, setActiveView] = useState<'tree' | 'table'>('table');

    // 노드 데이터 로드
    const loadNodes = async () => {
        try {
            setLoading(true);
            setError(null);
            // refresh를 먼저 호출하고, 완료되면 getNodes 수행
            await refreshNodes();
            const nodeData = await getNodes();
            setNodes(nodeData as NodeCategory[]);
        } catch (err) {
            console.error('Failed to load nodes:', err);
            setError(err instanceof Error ? err.message : '노드 정보를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 노드 새로고침
    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            setError(null);
            // refresh를 먼저 호출하고, 완료되면 getNodes 수행
            await refreshNodes();
            const refreshedNodes = await getNodes();
            setNodes(refreshedNodes as NodeCategory[]);
        } catch (err) {
            console.error('Failed to refresh nodes:', err);
            setError(err instanceof Error ? err.message : '노드 새로고침에 실패했습니다.');
        } finally {
            setRefreshing(false);
        }
    };

    // 트리 아이템 확장/축소 토글
    const toggleExpanded = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    // 노드 선택 처리
    const handleNodeSelect = (node: Node) => {
        setSelectedNode(selectedNode?.id === node.id ? null : node);
    };

    // 컴포넌트 마운트 시 데이터 로드
    useEffect(() => {
        loadNodes();
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner} />
                <p>노드 정보를 불러오는 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{error}</p>
                <button onClick={loadNodes} className={styles.retryButton}>
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className={styles.nodeManageContainer}>
            <div className={styles.nodeManageHeader}>
                <div className={styles.tabButtons}>
                    <button
                        onClick={() => setActiveView('table')}
                        className={`${styles.tabButton} ${activeView === 'table' ? styles.active : ''}`}
                    >
                        <FiList />
                        테이블 뷰
                    </button>
                    <button
                        onClick={() => setActiveView('tree')}
                        className={`${styles.tabButton} ${activeView === 'tree' ? styles.active : ''}`}
                    >
                        <FiGrid />
                        트리 뷰
                    </button>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`${styles.refreshButton} ${refreshing ? styles.refreshing : ''}`}
                >
                    <FiRefreshCw className={refreshing ? styles.spinning : ''} />
                    {refreshing ? '새로고침 중...' : '새로고침'}
                </button>
            </div>

            {activeView === 'table' ? (
                <NodeTableView nodes={nodes} />
            ) : (
                <div className={styles.nodeContent}>
                    <div className={styles.nodeTree}>
                        <div className={styles.treeHeader}>
                            <h3>노드 트리</h3>
                            <span className={styles.nodeCount}>
                                총 {nodes.reduce((acc, category) =>
                                    acc + category.functions.reduce((funcAcc, func) =>
                                        funcAcc + func.nodes.length, 0), 0)} 개의 노드
                            </span>
                        </div>
                        <div className={styles.treeContent}>
                            {nodes.map((category) => (
                                <CategoryItem
                                    key={category.categoryId}
                                    category={category}
                                    expandedItems={expandedItems}
                                    onToggleExpand={toggleExpanded}
                                    onNodeSelect={handleNodeSelect}
                                    selectedNodeId={selectedNode?.id}
                                />
                            ))}
                        </div>
                    </div>

                    <div className={styles.nodeDetail}>
                        {selectedNode ? (
                            <NodeDetail node={selectedNode} onClose={() => setSelectedNode(null)} />
                        ) : (
                            <div className={styles.noSelection}>
                                <FiInfo size={48} />
                                <h3>노드를 선택하세요</h3>
                                <p>왼쪽 트리에서 노드를 클릭하면 상세 정보를 확인할 수 있습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 카테고리 아이템 컴포넌트
const CategoryItem: React.FC<{
    category: NodeCategory;
    expandedItems: Set<string>;
    onToggleExpand: (id: string) => void;
    onNodeSelect: (node: Node) => void;
    selectedNodeId?: string;
}> = ({ category, expandedItems, onToggleExpand, onNodeSelect, selectedNodeId }) => {
    const isExpanded = expandedItems.has(category.categoryId);

    return (
        <div className={styles.treeItem}>
            <div
                className={`${styles.treeItemHeader} ${styles.categoryHeader}`}
                onClick={() => onToggleExpand(category.categoryId)}
            >
                <div className={styles.treeItemIcon}>
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                </div>
                <span className={styles.treeItemName}>{category.categoryName}</span>
                <span className={styles.itemCount}>
                    ({category.functions.reduce((acc, func) => acc + func.nodes.length, 0)})
                </span>
            </div>
            {isExpanded && (
                <div className={styles.treeItemChildren}>
                    {category.functions.map((func) => (
                        <FunctionItem
                            key={func.functionId}
                            categoryId={category.categoryId}
                            function={func}
                            expandedItems={expandedItems}
                            onToggleExpand={onToggleExpand}
                            onNodeSelect={onNodeSelect}
                            selectedNodeId={selectedNodeId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// 함수 아이템 컴포넌트
const FunctionItem: React.FC<{
    categoryId: string;
    function: { functionId: string; functionName: string; nodes: Node[] };
    expandedItems: Set<string>;
    onToggleExpand: (id: string) => void;
    onNodeSelect: (node: Node) => void;
    selectedNodeId?: string;
}> = ({ categoryId, function: func, expandedItems, onToggleExpand, onNodeSelect, selectedNodeId }) => {
    const functionKey = `${categoryId}-${func.functionId}`;
    const isExpanded = expandedItems.has(functionKey);

    return (
        <div className={styles.treeItem}>
            <div
                className={`${styles.treeItemHeader} ${styles.functionHeader}`}
                onClick={() => onToggleExpand(functionKey)}
            >
                <div className={styles.treeItemIcon}>
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                </div>
                <span className={styles.treeItemName}>{func.functionName}</span>
                <span className={styles.itemCount}>({func.nodes.length})</span>
            </div>
            {isExpanded && (
                <div className={styles.treeItemChildren}>
                    {func.nodes.map((node) => (
                        <div
                            key={node.id}
                            className={`${styles.treeItemHeader} ${styles.nodeHeader} ${
                                selectedNodeId === node.id ? styles.selected : ''
                            } ${node.disable ? styles.disabledNode : ''}`}
                            onClick={() => onNodeSelect(node)}
                        >
                            <span className={styles.treeItemName}>
                                {node.nodeName}
                                {node.disable && <span className={styles.disabledLabel}> (비활성화)</span>}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 노드 상세 정보 컴포넌트
const NodeDetail: React.FC<{
    node: Node;
    onClose: () => void;
}> = ({ node, onClose }) => {
    return (
        <div className={styles.nodeDetailContent}>
            <div className={styles.nodeDetailHeader}>
                <div>
                    <h3>{node.nodeName}</h3>
                    <p className={styles.nodeId}>{node.id}</p>
                </div>
                <button onClick={onClose} className={styles.closeButton}>
                    ×
                </button>
            </div>

            <div className={styles.nodeDetailBody}>
                <section className={styles.nodeSection}>
                    <h4>상태</h4>
                    <span className={`${styles.statusBadge} ${node.disable ? styles.disabled : styles.enabled}`}>
                        {node.disable ? '비활성화' : '활성화'}
                    </span>
                </section>

                <section className={styles.nodeSection}>
                    <h4>설명</h4>
                    <p>{node.description}</p>
                </section>

                <section className={styles.nodeSection}>
                    <h4>태그</h4>
                    <div className={styles.tagList}>
                        {node.tags.map((tag, index) => (
                            <span key={index} className={styles.tag}>{tag}</span>
                        ))}
                    </div>
                </section>

                <section className={styles.nodeSection}>
                    <h4>입력 ({node.inputs.length})</h4>
                    <div className={styles.parameterList}>
                        {node.inputs.map((input) => (
                            <div key={input.id} className={styles.parameterItem}>
                                <div className={styles.parameterHeader}>
                                    <span className={styles.parameterName}>{input.name}</span>
                                    <span className={styles.parameterType}>{input.type}</span>
                                    {input.required && <span className={styles.required}>*</span>}
                                </div>
                                <div className={styles.parameterMeta}>
                                    ID: {input.id} | Multi: {input.multi ? 'Yes' : 'No'}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.nodeSection}>
                    <h4>출력 ({node.outputs.length})</h4>
                    <div className={styles.parameterList}>
                        {node.outputs.map((output) => (
                            <div key={output.id} className={styles.parameterItem}>
                                <div className={styles.parameterHeader}>
                                    <span className={styles.parameterName}>{output.name}</span>
                                    <span className={styles.parameterType}>{output.type}</span>
                                    {output.required && <span className={styles.required}>*</span>}
                                </div>
                                <div className={styles.parameterMeta}>
                                    ID: {output.id} | Multi: {output.multi ? 'Yes' : 'No'} | Stream: {output.stream ? 'Yes' : 'No'}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={styles.nodeSection}>
                    <h4>매개변수 ({node.parameters.length})</h4>
                    <div className={styles.parameterList}>
                        {node.parameters.map((param) => (
                            <div key={param.id} className={styles.parameterItem}>
                                <div className={styles.parameterHeader}>
                                    <span className={styles.parameterName}>{param.name}</span>
                                    <span className={styles.parameterType}>{param.type}</span>
                                    {param.required && <span className={styles.required}>*</span>}
                                </div>
                                {param.description && (
                                    <p className={styles.parameterDescription}>{param.description}</p>
                                )}
                                <div className={styles.parameterMeta}>
                                    ID: {param.id}
                                    {param.value !== undefined && ` | Default: ${JSON.stringify(param.value)}`}
                                    {param.min !== undefined && ` | Min: ${param.min}`}
                                    {param.max !== undefined && ` | Max: ${param.max}`}
                                    {param.step !== undefined && ` | Step: ${param.step}`}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

// 노드 테이블 뷰 컴포넌트
const NodeTableView: React.FC<{ nodes: NodeCategory[] }> = ({ nodes }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<'categoryName' | 'functionName' | 'nodeName'>('categoryName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // 노드를 플랫 리스트로 변환
    const flatNodes = nodes.flatMap(category =>
        category.functions.flatMap(func =>
            func.nodes.map(node => ({
                ...node,
                categoryId: category.categoryId,
                categoryName: category.categoryName,
                categoryIcon: category.icon,
                functionId: func.functionId,
                functionName: func.functionName
            }))
        )
    );

    // 검색 필터링
    const filteredNodes = flatNodes.filter(node => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        return (
            node.categoryName.toLowerCase().includes(searchLower) ||
            node.functionName.toLowerCase().includes(searchLower) ||
            node.nodeName.toLowerCase().includes(searchLower) ||
            node.description.toLowerCase().includes(searchLower) ||
            node.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
    });

    // 정렬
    const sortedNodes = [...filteredNodes].sort((a, b) => {
        let aValue: string;
        let bValue: string;

        switch (sortField) {
            case 'categoryName':
                aValue = a.categoryName;
                bValue = b.categoryName;
                break;
            case 'functionName':
                aValue = a.functionName;
                bValue = b.functionName;
                break;
            case 'nodeName':
                aValue = a.nodeName;
                bValue = b.nodeName;
                break;
            default:
                aValue = a.nodeName;
                bValue = b.nodeName;
        }

        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // 정렬 핸들러
    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="노드 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.stats}>
                    <span>총 {flatNodes.length}개의 노드</span>
                    {searchTerm && (
                        <span>({sortedNodes.length}개 검색됨)</span>
                    )}
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('categoryName')}
                            >
                                카테고리
                                {sortField === 'categoryName' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('functionName')}
                            >
                                함수
                                {sortField === 'functionName' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('nodeName')}
                            >
                                노드명
                                {sortField === 'nodeName' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th>설명</th>
                            <th>태그</th>
                            <th>상태</th>
                            <th>입력</th>
                            <th>출력</th>
                            <th>매개변수</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedNodes.length === 0 ? (
                            <tr>
                                <td colSpan={9} className={styles.noData}>
                                    {searchTerm ? '검색 결과가 없습니다.' : '노드가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            sortedNodes.map((node) => (
                                <tr key={node.id} className={styles.tableRow}>
                                    <td className={styles.categoryCell}>
                                        <div className={styles.categoryBadge}>
                                            {node.categoryName}
                                        </div>
                                    </td>
                                    <td className={styles.functionCell}>
                                        <div className={styles.functionBadge}>
                                            {node.functionName}
                                        </div>
                                    </td>
                                    <td className={styles.nodeNameCell}>
                                        <div className={styles.nodeName}>
                                            {node.nodeName}
                                        </div>
                                        <div className={styles.nodeId}>
                                            {node.id}
                                        </div>
                                    </td>
                                    <td className={styles.dataCell}>
                                        {node.description}
                                    </td>
                                    <td className={styles.tagsCell}>
                                        <div className={styles.tagsList}>
                                            {node.tags.slice(0, 3).map((tag, index) => (
                                                <span key={index} className={styles.tagBadge}>
                                                    {tag}
                                                </span>
                                            ))}
                                            {node.tags.length > 3 && (
                                                <span className={styles.tagMore}>
                                                    +{node.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={styles.statusCell}>
                                        <span className={`${styles.statusBadge} ${node.disable ? styles.disabled : styles.enabled}`}>
                                            {node.disable ? '비활성화' : '활성화'}
                                        </span>
                                    </td>
                                    <td className={styles.countCell}>
                                        <span className={styles.countBadge}>
                                            {node.inputs.length}
                                        </span>
                                    </td>
                                    <td className={styles.countCell}>
                                        <span className={styles.countBadge}>
                                            {node.outputs.length}
                                        </span>
                                    </td>
                                    <td className={styles.countCell}>
                                        <span className={styles.countBadge}>
                                            {node.parameters.length}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminNodeManage;
