'use client';

import React, { useState, useEffect } from 'react';
import { getAllIOLogs } from '@/app/admin/api/workflow';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminWorkflowLogsContent.module.scss';

interface WorkflowLog {
    id: number;
    user_id: number | null;
    interaction_id: string;
    workflow_id: string;
    workflow_name: string;
    input_data: string | null;
    output_data: string | null;
    expected_output: string | null;
    llm_eval_score: number | null;
    test_mode: boolean;
    user_score: number;
    created_at: string;
    updated_at: string;
}

const AdminWorkflowLogsContent: React.FC = () => {
    const [logs, setLogs] = useState<WorkflowLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<keyof WorkflowLog>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // 로그 데이터 로드
    const loadLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            const logData = await getAllIOLogs();
            setLogs(logData || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'IO 로그 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load workflow logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    // 검색 필터링
    const filteredLogs = logs.filter(log => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        const workflowId = log.workflow_id?.toLowerCase() || '';
        const workflowName = log.workflow_name?.toLowerCase() || '';
        const interactionId = log.interaction_id?.toLowerCase() || '';
        const userId = log.user_id?.toString() || '';

        return workflowId.includes(searchLower) ||
               workflowName.includes(searchLower) ||
               interactionId.includes(searchLower) ||
               userId.includes(searchLower);
    });

    // 정렬
    const sortedLogs = [...filteredLogs].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        // undefined/null 값 처리
        if (aValue === undefined || aValue === null) {
            if (bValue === undefined || bValue === null) return 0;
            return 1;
        }
        if (bValue === undefined || bValue === null) return -1;
        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // 정렬 핸들러
    const handleSort = (field: keyof WorkflowLog) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // 날짜 포맷팅
    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // 점수 표시 함수
    const formatScore = (score: number | null) => {
        if (score === null || score === undefined) return '-';
        return score.toFixed(2);
    };

    // 테스트 모드 배지 렌더링
    const renderTestModeBadge = (testMode: boolean) => (
        <span className={`${styles.badge} ${testMode ? styles.badgeTest : styles.badgeProduction}`}>
            {testMode ? '테스트' : '운영'}
        </span>
    );

    // 데이터 미리보기 (긴 텍스트 줄이기)
    const truncateText = (text: string | null, maxLength = 50) => {
        if (!text) return '-';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>워크플로우 로그를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h3>오류 발생</h3>
                    <p>{error}</p>
                    <button onClick={loadLogs} className={styles.retryButton}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 상단 컨트롤 */}
            <div className={styles.controls}>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="워크플로우 ID, 이름, 상호작용 ID, 사용자 ID로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>
                <div className={styles.stats}>
                    <span>총 {logs.length}개의 로그</span>
                    {searchTerm && (
                        <span>({filteredLogs.length}개 검색됨)</span>
                    )}
                </div>
                <button onClick={loadLogs} className={styles.refreshButton}>
                    새로고침
                </button>
            </div>

            {/* 로그 테이블 */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('id')}
                            >
                                ID
                                {sortField === 'id' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('user_id')}
                            >
                                사용자 ID
                                {sortField === 'user_id' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('workflow_name')}
                            >
                                워크플로우명
                                {sortField === 'workflow_name' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('interaction_id')}
                            >
                                상호작용 ID
                                {sortField === 'interaction_id' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th>입력 데이터</th>
                            <th>출력 데이터</th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('llm_eval_score')}
                            >
                                LLM 평가점수
                                {sortField === 'llm_eval_score' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('user_score')}
                            >
                                사용자 점수
                                {sortField === 'user_score' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('test_mode')}
                            >
                                모드
                                {sortField === 'test_mode' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('created_at')}
                            >
                                생성일
                                {sortField === 'created_at' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedLogs.length === 0 ? (
                            <tr>
                                <td colSpan={10} className={styles.noData}>
                                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 로그가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            sortedLogs.map((log) => (
                                <tr key={log.id} className={styles.tableRow}>
                                    <td className={styles.logId}>{log.id}</td>
                                    <td className={styles.userId}>{log.user_id || '-'}</td>
                                    <td className={styles.workflowName} title={log.workflow_name}>
                                        {truncateText(log.workflow_name, 30)}
                                    </td>
                                    <td className={styles.interactionId} title={log.interaction_id}>
                                        {truncateText(log.interaction_id, 20)}
                                    </td>
                                    <td className={styles.dataCell} title={log.input_data || ''}>
                                        {truncateText(log.input_data)}
                                    </td>
                                    <td className={styles.dataCell} title={log.output_data || ''}>
                                        {truncateText(log.output_data)}
                                    </td>
                                    <td className={styles.score}>
                                        {formatScore(log.llm_eval_score)}
                                    </td>
                                    <td className={styles.score}>
                                        {log.user_score}
                                    </td>
                                    <td>{renderTestModeBadge(log.test_mode)}</td>
                                    <td>{formatDate(log.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminWorkflowLogsContent;
