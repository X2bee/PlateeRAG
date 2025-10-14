'use client';

import React, { useState, useEffect } from 'react';
import { getAllIOLogs } from '@/app/admin/api/workflow';
import { devLog } from '@/app/_common/utils/logger';
import { parseActualOutput, convertOutputToString } from '@/app/_common/utils/stringParser';
import { showValidationErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/admin/assets/workflows/AdminWorkflowLogTab.module.scss';
import AdminWorkflowChatLogsDetailModal from './AdminWorkflowChatLogsDetailModal';

interface WorkflowLog {
    id: number;
    user_id: number | null;
    username: string | null;
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

interface PaginationInfo {
    page: number;
    page_size: number;
    offset: number;
    total_returned: number;
}

interface AdminWorkflowLogTabProps {
    workflowId: string;
    workflowName: string;
    userId: number;
}

const AdminWorkflowLogTab: React.FC<AdminWorkflowLogTabProps> = ({ workflowId, workflowName, userId }) => {
    const [logs, setLogs] = useState<WorkflowLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [userIdSearch, setUserIdSearch] = useState('');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<keyof WorkflowLog>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [modeSortOrder, setModeSortOrder] = useState<'deploy' | 'production' | 'test'>('deploy');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [showProcessedOutput, setShowProcessedOutput] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);

    const PAGE_SIZE = 250;

    // parseActualOutput과 convertOutputToString은 stringParser에서 import하여 사용

    const loadLogs = async (page: number = 1, resetLogs: boolean = true, searchUserId: number | null = null) => {
        try {
            setLoading(true);
            setError(null);
            // searchUserId가 있으면 그것을 사용, 없으면 props로 받은 userId 사용
            const targetUserId = searchUserId !== null ? searchUserId : userId;
            const response = await getAllIOLogs(page, PAGE_SIZE, targetUserId, null, workflowName) as any;
            const newLogs = response.io_logs || [];

            if (resetLogs) {
                setLogs(newLogs);
            } else {
                setLogs(prevLogs => [...prevLogs, ...newLogs]);
            }

            setPagination(response.pagination);
            setHasNextPage(newLogs.length === PAGE_SIZE);
            setCurrentPage(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'IO 로그 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load workflow logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadNextPage = () => {
        if (hasNextPage && !loading) {
            loadLogs(currentPage + 1, false, currentUserId);
        }
    };

    const loadPrevPage = () => {
        if (currentPage > 1 && !loading) {
            const targetPage = currentPage - 1;
            loadLogsRange(1, targetPage, currentUserId);
        }
    };

    const loadLogsRange = async (startPage: number, endPage: number, searchUserId: number | null = null) => {
        try {
            setLoading(true);
            setError(null);
            let allLogs: WorkflowLog[] = [];
            let lastPagination: any = null;

            for (let page = startPage; page <= endPage; page++) {
                // searchUserId가 있으면 그것을 사용, 없으면 props로 받은 userId 사용
                const targetUserId = searchUserId !== null ? searchUserId : userId;
                const response = await getAllIOLogs(page, PAGE_SIZE, targetUserId, null, workflowName) as any;
                const pageLogs = response.io_logs || [];
                allLogs = [...allLogs, ...pageLogs];
                lastPagination = response.pagination;

                if (pageLogs.length < PAGE_SIZE) {
                    break;
                }
            }

            setLogs(allLogs);
            setCurrentPage(endPage);
            setPagination(lastPagination);

            if (lastPagination && lastPagination.total_returned === PAGE_SIZE) {
                setHasNextPage(true);
            } else {
                setHasNextPage(false);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'IO 로그 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load workflow logs range:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setCurrentPage(1);
        loadLogs(1, true, currentUserId);
    };

    const handleUserIdSearch = () => {
        const userId = userIdSearch.trim();
        if (userId === '') {
            setCurrentUserId(null);
            setCurrentPage(1);
            loadLogs(1, true, null);
        } else {
            const parsedUserId = parseInt(userId);
            if (isNaN(parsedUserId)) {
                showValidationErrorToastKo('유효한 사용자 ID를 입력해주세요.');
                return;
            }
            setCurrentUserId(parsedUserId);
            setCurrentPage(1);
            loadLogs(1, true, parsedUserId);
        }
    };

    const handleResetUserIdSearch = () => {
        setUserIdSearch('');
        setCurrentUserId(null);
        setCurrentPage(1);
        loadLogs(1, true, null);
    };

    useEffect(() => {
        loadLogs(1, true, null);
    }, [workflowId]);

    const filteredLogs = logs.filter(log => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        const workflowIdStr = log.workflow_id?.toLowerCase() || '';
        const workflowNameStr = log.workflow_name?.toLowerCase() || '';
        const interactionId = log.interaction_id?.toLowerCase() || '';
        const userId = log.user_id?.toString() || '';

        return workflowIdStr.includes(searchLower) ||
               workflowNameStr.includes(searchLower) ||
               interactionId.includes(searchLower) ||
               userId.includes(searchLower);
    });

    const getModePriority = (log: WorkflowLog): number => {
        const isDeployMode = log.interaction_id?.toLowerCase().startsWith('deploy');
        const isTestMode = log.test_mode;

        if (isDeployMode) {
            return modeSortOrder === 'deploy' ? 0 : modeSortOrder === 'production' ? 2 : 1;
        } else if (isTestMode) {
            return modeSortOrder === 'test' ? 0 : modeSortOrder === 'deploy' ? 2 : 1;
        } else {
            return modeSortOrder === 'production' ? 0 : modeSortOrder === 'test' ? 2 : 1;
        }
    };

    const sortedLogs = searchTerm ? [...filteredLogs].sort((a, b) => {
        if (sortField === 'test_mode') {
            const aPriority = getModePriority(a);
            const bPriority = getModePriority(b);
            return aPriority - bPriority;
        }

        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === undefined || aValue === null) {
            if (bValue === undefined || bValue === null) return 0;
            return 1;
        }
        if (bValue === undefined || bValue === null) return -1;
        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
    }) : [...logs].sort((a, b) => {
        if (sortField === 'test_mode') {
            const aPriority = getModePriority(a);
            const bPriority = getModePriority(b);
            return aPriority - bPriority;
        }

        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === undefined || aValue === null) {
            if (bValue === undefined || bValue === null) return 0;
            return 1;
        }
        if (bValue === undefined || bValue === null) return -1;
        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    const displayLogs = searchTerm ? sortedLogs : sortedLogs;

    const handleSort = (field: keyof WorkflowLog) => {
        if (field === 'test_mode') {
            const nextOrder = modeSortOrder === 'deploy' ? 'production' :
                             modeSortOrder === 'production' ? 'test' : 'deploy';
            setModeSortOrder(nextOrder);
            setSortField(field);
            setSortDirection('asc');
        } else {
            if (sortField === field) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortField(field);
                setSortDirection('asc');
            }
        }
    };

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

    const formatScore = (score: number | null) => {
        if (score === null || score === undefined) return '-';
        return score.toFixed(2);
    };

    const renderTestModeBadge = (testMode: boolean, interactionId: string) => {
        if (interactionId?.toLowerCase().startsWith('deploy')) {
            return (
                <span className={`${styles.badge} ${styles.badgeDeploy}`}>
                    배포
                </span>
            );
        }

        return (
            <span className={`${styles.badge} ${testMode ? styles.badgeTest : styles.badgeProduction}`}>
                {testMode ? '테스트' : '운영'}
            </span>
        );
    };

    const formatUserInfo = (username: string | null, userId: number | null) => {
        if (!username && !userId) return '-';
        if (username && userId) return `${username}(${userId})`;
        if (username) return username;
        if (userId) return userId.toString();
        return '-';
    };

    const truncateText = (text: string | null, maxLength = 50) => {
        if (!text) return '-';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    const getDisplayOutput = (outputData: string | null) => {
        if (showProcessedOutput) {
            return parseActualOutput(outputData);
        }
        return convertOutputToString(outputData);
    };

    const openModal = (content: string) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    const renderCellValue = (value: any, maxLength: number = 50) => {
        if (value === null || value === undefined) {
            return '-';
        }

        const stringValue = String(value);
        if (stringValue.length <= maxLength) {
            return stringValue;
        }

        return (
            <div className={styles.cellContent}>
                <span>{stringValue.substring(0, maxLength)}</span>
                <button
                    className={styles.expandButton}
                    onClick={() => openModal(stringValue)}
                    title="전체 내용 보기"
                >
                    ...
                </button>
            </div>
        );
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
                    <button onClick={() => loadLogs(1, true, currentUserId)} className={styles.retryButton}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.controls}>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="결과 필터링..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.stats}>
                    <span>총 {logs.length}개의 로그 로드됨</span>
                    {currentUserId && (
                        <span>(사용자 ID: {currentUserId})</span>
                    )}
                    {searchTerm && (
                        <span>({sortedLogs.length}개 검색됨)</span>
                    )}
                    {pagination && !searchTerm && (
                        <>
                            <span>|</span>
                            <span>페이지 {pagination.page}</span>
                            <span>표시: {pagination.total_returned}개</span>
                            <span>크기: {pagination.page_size}</span>
                        </>
                    )}
                    {searchTerm && (
                        <>
                            <span>|</span>
                            <span>검색 모드: 로드된 모든 로그 검색</span>
                        </>
                    )}
                </div>

                <div className={styles.actionButtons}>
                    {!searchTerm && (
                        <div className={styles.paginationButtons}>
                            <button
                                onClick={loadPrevPage}
                                disabled={loading || currentPage <= 1}
                                className={styles.paginationButton}
                            >
                                이전
                            </button>
                            <button
                                onClick={loadNextPage}
                                disabled={loading || !hasNextPage}
                                className={styles.paginationButton}
                            >
                                다음
                            </button>
                        </div>
                    )}
                    <div className={styles.userIdSearchContainer}>
                        <input
                            type="text"
                            placeholder="사용자 ID"
                            value={currentUserId ? currentUserId.toString() : userIdSearch}
                            onChange={(e) => setUserIdSearch(e.target.value)}
                            className={styles.userIdInput}
                            onKeyPress={(e) => e.key === 'Enter' && !currentUserId && handleUserIdSearch()}
                            disabled={currentUserId !== null}
                        />
                        {currentUserId ? (
                            <button
                                onClick={handleResetUserIdSearch}
                                className={styles.refreshButton}
                            >
                                리셋
                            </button>
                        ) : (
                            <button
                                onClick={handleUserIdSearch}
                                className={styles.refreshButton}
                            >
                                검색
                            </button>
                        )}
                    </div>

                    <div className={styles.toggleButtons}>
                        <button
                            onClick={() => setShowProcessedOutput(false)}
                            className={`${styles.toggleButton} ${!showProcessedOutput ? styles.active : ''}`}
                        >
                            원본
                        </button>
                        <button
                            onClick={() => setShowProcessedOutput(true)}
                            className={`${styles.toggleButton} ${showProcessedOutput ? styles.active : ''}`}
                        >
                            가공
                        </button>
                    </div>

                    <button onClick={handleRefresh} className={styles.refreshButton}>
                        새로고침
                    </button>
                </div>
            </div>

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
                        {displayLogs.length === 0 ? (
                            <tr>
                                <td colSpan={10} className={styles.noData}>
                                    {searchTerm ? '검색 결과가 없습니다.' : '등록된 로그가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            displayLogs.map((log) => (
                                <tr key={log.id} className={styles.tableRow}>
                                    <td className={styles.logId}>{log.id}</td>
                                    <td className={styles.userId}>{formatUserInfo(log.username, log.user_id)}</td>
                                    <td className={styles.workflowName} title={log.workflow_name}>
                                        {truncateText(log.workflow_name, 30)}
                                    </td>
                                    <td className={styles.interactionId}>
                                        {renderCellValue(log.interaction_id, 20)}
                                    </td>
                                    <td className={styles.dataCell}>
                                        {renderCellValue(getDisplayOutput(log.input_data))}
                                    </td>
                                    <td className={styles.dataCell}>
                                        {renderCellValue(getDisplayOutput(log.output_data))}
                                    </td>
                                    <td className={styles.score}>
                                        {formatScore(log.llm_eval_score)}
                                    </td>
                                    <td className={styles.score}>
                                        {log.user_score}
                                    </td>
                                    <td>{renderTestModeBadge(log.test_mode, log.interaction_id)}</td>
                                    <td>{formatDate(log.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <AdminWorkflowChatLogsDetailModal
                isOpen={isModalOpen}
                content={modalContent}
                onClose={closeModal}
            />
        </div>
    );
};

export default AdminWorkflowLogTab;
