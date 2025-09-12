'use client';

import React, { useState, useEffect } from 'react';
import { getAllIOLogs } from '@/app/admin/api/workflow';
import { devLog } from '@/app/_common/utils/logger';
import { showValidationErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/admin/assets/AdminWorkflowLogsContent.module.scss';

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

const AdminWorkflowChatLogsContent: React.FC = () => {
    const [logs, setLogs] = useState<WorkflowLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [userIdSearch, setUserIdSearch] = useState('');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<keyof WorkflowLog>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [modeSortOrder, setModeSortOrder] = useState<'deploy' | 'production' | 'test'>('deploy'); // 모드 정렬 우선순위
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);
    const [showProcessedOutput, setShowProcessedOutput] = useState(true); // 기본값: 가공

    const PAGE_SIZE = 250;

    const parseActualOutput = (output: string | null | undefined): string => {
        if (!output) return '';

        // output을 적절한 형태로 변환
        let processedOutput = convertOutputToString(output);

        // 이미 문자열로 변환된 결과에서 태그 제거
        processedOutput = processedOutput.replace(/<think>[\s\S]*?<\/think>/gi, '');

        if (processedOutput.includes('<TOOLUSELOG>') && processedOutput.includes('</TOOLUSELOG>')) {
            processedOutput = processedOutput.replace(/<TOOLUSELOG>[\s\S]*?<\/TOOLUSELOG>/g, '');
        }

        if (processedOutput.includes('<TOOLOUTPUTLOG>') && processedOutput.includes('</TOOLOUTPUTLOG>')) {
            processedOutput = processedOutput.replace(/<TOOLOUTPUTLOG>[\s\S]*?<\/TOOLOUTPUTLOG>/g, '');
        }

        if (processedOutput.includes('[Cite.') && processedOutput.includes('}]')) {
            processedOutput = processedOutput.replace(/\[Cite\.\s*\{[\s\S]*?\}\]/g, '');
        }

        return processedOutput.trim();
    };

    // ChatParserNonStr 로직을 적용한 변환 함수
    const convertOutputToString = (data: any): string => {
        // null이나 undefined인 경우
        if (data === null || data === undefined) {
            return '';
        }

        // 이미 문자열인 경우
        if (typeof data === 'string') {
            // JSON 문자열인지 확인 (객체나 배열 형태)
            if (isJsonString(data)) {
                try {
                    // JSON 파싱 후 다시 보기 좋게 포맷팅
                    const parsed = JSON.parse(data);
                    return JSON.stringify(parsed, null, 2);
                } catch (error) {
                    return data;
                }
            }
            return data;
        }

        // 숫자나 불린값인 경우
        if (typeof data === 'number' || typeof data === 'boolean') {
            return String(data);
        }

        // 배열이나 객체인 경우 JSON 형태로 변환
        if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
            try {
                return JSON.stringify(data, null, 2);
            } catch (error) {
                return String(data);
            }
        }

        // 기타 경우 문자열로 변환
        return String(data);
    };

    // 문자열이 JSON 형태인지 확인
    const isJsonString = (str: string): boolean => {
        try {
            const trimmed = str.trim();
            if (!trimmed) return false;

            // JSON 객체나 배열로 시작하는지 확인
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                JSON.parse(trimmed);
                return true;
            }
            return false;
        } catch (error) {
            return false;
        }
    };

    // 로그 데이터 로드
    const loadLogs = async (page: number = 1, resetLogs: boolean = true, userId: number | null = null) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getAllIOLogs(page, PAGE_SIZE, userId) as any;
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

    // 다음 페이지 로드
    const loadNextPage = () => {
        if (hasNextPage && !loading) {
            loadLogs(currentPage + 1, false, currentUserId);
        }
    };

    // 이전 페이지 로드
    const loadPrevPage = () => {
        if (currentPage > 1 && !loading) {
            // 이전 페이지로 돌아가기 위해 전체를 다시 로드
            const targetPage = currentPage - 1;
            loadLogsRange(1, targetPage, currentUserId);
        }
    };

    // 특정 범위의 페이지들을 로드하는 함수
    const loadLogsRange = async (startPage: number, endPage: number, userId: number | null = null) => {
        try {
            setLoading(true);
            setError(null);
            let allLogs: WorkflowLog[] = [];
            let lastPagination: any = null;

            for (let page = startPage; page <= endPage; page++) {
                const response = await getAllIOLogs(page, PAGE_SIZE, userId) as any;
                const pageLogs = response.io_logs || [];
                allLogs = [...allLogs, ...pageLogs];
                lastPagination = response.pagination;

                // 만약 페이지에서 반환된 로그가 PAGE_SIZE보다 적다면 더 이상 페이지가 없음
                if (pageLogs.length < PAGE_SIZE) {
                    break;
                }
            }

            setLogs(allLogs);
            setCurrentPage(endPage);
            setPagination(lastPagination);

            // 다음 페이지 존재 여부 확인
            if (lastPagination && lastPagination.total_returned === PAGE_SIZE) {
                // 마지막 페이지가 풀로 로드되었으면 다음 페이지가 있을 가능성
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

    // 새로고침 핸들러
    const handleRefresh = () => {
        setCurrentPage(1);
        loadLogs(1, true, currentUserId);
    };

    // ID 검색 핸들러
    const handleUserIdSearch = () => {
        const userId = userIdSearch.trim();
        if (userId === '') {
            // 빈 값이면 전체 검색으로 리셋
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

    // ID 검색 리셋 핸들러
    const handleResetUserIdSearch = () => {
        setUserIdSearch('');
        setCurrentUserId(null);
        setCurrentPage(1);
        loadLogs(1, true, null);
    };

    useEffect(() => {
        loadLogs(1, true, null);
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

    // 모드 정렬을 위한 우선순위 함수
    const getModePriority = (log: WorkflowLog): number => {
        const isDeployMode = log.interaction_id?.toLowerCase().startsWith('deploy');
        const isTestMode = log.test_mode;

        if (isDeployMode) {
            return modeSortOrder === 'deploy' ? 0 : modeSortOrder === 'production' ? 2 : 1;
        } else if (isTestMode) {
            return modeSortOrder === 'test' ? 0 : modeSortOrder === 'deploy' ? 2 : 1;
        } else {
            // 운영 모드
            return modeSortOrder === 'production' ? 0 : modeSortOrder === 'test' ? 2 : 1;
        }
    };

    // 정렬 (검색이 활성화된 경우에만 클라이언트 정렬 적용)
    const sortedLogs = searchTerm ? [...filteredLogs].sort((a, b) => {
        if (sortField === 'test_mode') {
            // 모드 컬럼의 경우 우선순위 정렬
            const aPriority = getModePriority(a);
            const bPriority = getModePriority(b);
            return aPriority - bPriority;
        }

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
    }) : [...logs].sort((a, b) => {
        if (sortField === 'test_mode') {
            // 모드 컬럼의 경우 우선순위 정렬
            const aPriority = getModePriority(a);
            const bPriority = getModePriority(b);
            return aPriority - bPriority;
        }

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
    }); // 검색이 없어도 클라이언트 정렬 적용

    // 표시할 로그 결정
    const displayLogs = searchTerm ? sortedLogs : sortedLogs;

    // 정렬 핸들러
    const handleSort = (field: keyof WorkflowLog) => {
        if (field === 'test_mode') {
            // 모드 컬럼의 경우 특별한 우선순위 정렬
            const nextOrder = modeSortOrder === 'deploy' ? 'production' :
                             modeSortOrder === 'production' ? 'test' : 'deploy';
            setModeSortOrder(nextOrder);
            setSortField(field);
            // 방향은 항상 asc로 설정 (우선순위 기반이므로)
            setSortDirection('asc');
        } else {
            // 다른 컬럼의 경우 기존 로직
            if (sortField === field) {
                setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
            } else {
                setSortField(field);
                setSortDirection('asc');
            }
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
    const renderTestModeBadge = (testMode: boolean, interactionId: string) => {
        // 상호작용 ID가 deploy로 시작하는 경우 배포 모드로 표시
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

    // 사용자 정보 포맷팅 함수
    const formatUserInfo = (username: string | null, userId: number | null) => {
        if (!username && !userId) return '-';
        if (username && userId) return `${username}(${userId})`;
        if (username) return username;
        if (userId) return userId.toString();
        return '-';
    };

    // 데이터 미리보기 (긴 텍스트 줄이기)
    const truncateText = (text: string | null, maxLength = 50) => {
        if (!text) return '-';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    // 출력 데이터 처리 함수
    const getDisplayOutput = (outputData: string | null) => {
        if (showProcessedOutput) {
            return parseActualOutput(outputData);
        }
        // 원본 출력도 같은 변환 로직 적용
        return convertOutputToString(outputData);
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
            {/* 상단 컨트롤 */}
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
                                    <td className={styles.interactionId} title={log.interaction_id}>
                                        {truncateText(log.interaction_id, 20)}
                                    </td>
                                    <td className={styles.dataCell} title={log.input_data || ''}>
                                        {truncateText(log.input_data)}
                                    </td>
                                    <td className={styles.dataCell} title={getDisplayOutput(log.output_data) || ''}>
                                        {truncateText(getDisplayOutput(log.output_data))}
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
        </div>
    );
};

export default AdminWorkflowChatLogsContent;
