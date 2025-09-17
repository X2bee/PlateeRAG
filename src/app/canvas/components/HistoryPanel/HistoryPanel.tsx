import React, { useState } from 'react';
import { HistoryEntry, HistoryActionType } from '../Canvas/hooks/useHistoryManagement';
import styles from './HistoryPanel.module.scss';

interface HistoryPanelProps {
    history: HistoryEntry[];
    isOpen: boolean;
    onClose: () => void;
    onClearHistory?: () => void;
}

const actionTypeColors: Record<HistoryActionType, string> = {
    'NODE_MOVE': '#3B82F6',      // blue
    'NODE_CREATE': '#10B981',    // green
    'NODE_DELETE': '#EF4444',    // red
    'EDGE_CREATE': '#8B5CF6',    // purple
    'EDGE_DELETE': '#F59E0B',    // amber
    'NODE_UPDATE': '#06B6D4',    // cyan
    'EDGE_UPDATE': '#EC4899'     // pink
};

const actionTypeLabels: Record<HistoryActionType, string> = {
    'NODE_MOVE': '이동',
    'NODE_CREATE': '생성',
    'NODE_DELETE': '삭제',
    'EDGE_CREATE': '연결',
    'EDGE_DELETE': '연결해제',
    'NODE_UPDATE': '수정',
    'EDGE_UPDATE': '연결수정'
};

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    history,
    isOpen,
    onClose,
    onClearHistory
}) => {
    const [filterType, setFilterType] = useState<HistoryActionType | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHistory = history.filter(entry => {
        const matchesFilter = filterType === 'ALL' || entry.actionType === filterType;
        const matchesSearch = searchTerm === '' ||
            entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.details.nodeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.details.edgeId?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    const formatTimestamp = (timestamp: Date) => {
        return timestamp.toLocaleString('ko-KR', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    if (!isOpen) return null;

    return (
        <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
            {/* Header */}
            <div className={styles.header}>
                <h2 className={styles.title}>작업 히스토리</h2>
                <div className={styles.headerControls}>
                    <span className={styles.count}>총 {history.length}개 / 50개</span>
                    {onClearHistory && (
                        <button
                            className={styles.clearButton}
                            onClick={onClearHistory}
                            disabled={history.length === 0}
                        >
                            전체 삭제
                        </button>
                    )}
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label>필터:</label>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as HistoryActionType | 'ALL')}
                        className={styles.select}
                    >
                        <option value="ALL">전체</option>
                        {Object.entries(actionTypeLabels).map(([type, label]) => (
                            <option key={type} value={type}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className={styles.filterGroup}>
                    <input
                        type="text"
                        placeholder="검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
            </div>

            {/* History List */}
            <div className={styles.historyList}>
                {filteredHistory.length === 0 ? (
                    <div className={styles.emptyState}>
                        {history.length === 0 ? '아직 기록된 작업이 없습니다.' : '검색 결과가 없습니다.'}
                    </div>
                ) : (
                    filteredHistory.map((entry) => (
                        <div key={entry.id} className={styles.historyItem}>
                            <div className={styles.itemHeader}>
                                <span
                                    className={styles.actionBadge}
                                    style={{ backgroundColor: actionTypeColors[entry.actionType] }}
                                >
                                    {actionTypeLabels[entry.actionType]}
                                </span>
                                <span className={styles.timestamp}>
                                    {formatTimestamp(entry.timestamp)}
                                </span>
                            </div>
                            <div className={styles.description}>
                                {entry.description}
                            </div>
                            {Object.keys(entry.details).length > 0 && (
                                <div className={styles.details}>
                                    {entry.details.nodeId && (
                                        <span className={styles.detailItem}>
                                            Node: {entry.details.nodeId}
                                        </span>
                                    )}
                                    {entry.details.edgeId && (
                                        <span className={styles.detailItem}>
                                            Edge: {entry.details.edgeId}
                                        </span>
                                    )}
                                    {entry.details.fromPosition && entry.details.toPosition && (
                                        <span className={styles.detailItem}>
                                            Position: ({entry.details.fromPosition.x.toFixed(1)}, {entry.details.fromPosition.y.toFixed(1)}) →
                                            ({entry.details.toPosition.x.toFixed(1)}, {entry.details.toPosition.y.toFixed(1)})
                                        </span>
                                    )}
                                    {entry.details.sourceId && entry.details.targetId && (
                                        <span className={styles.detailItem}>
                                            Connection: {entry.details.sourceId} → {entry.details.targetId}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
