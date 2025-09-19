'use client';

import React, { useState, useEffect } from 'react';
import { getBackendLogs } from '@/app/admin/api/admin';
import { devLog } from '@/app/_common/utils/logger';
import { showValidationErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import AdminBackendLogDetailModal from '@/app/admin/components/sysmonitor/AdminBackendLogDetailModal';
import styles from '@/app/admin/assets/AdminBackendLogs.module.scss';

interface BackendLog {
    user_id: number | null;
    log_id: string;
    log_level: string;
    message: string;
    function_name: string | null;
    api_endpoint: string | null;
    metadata: { [key: string]: any } | null;
    created_at: string;
    updated_at: string;
}

interface PaginationInfo {
    page: number;
    page_size: number;
    offset: number;
    total_returned: number;
}

const AdminBackendLogs: React.FC = () => {
    const [logs, setLogs] = useState<BackendLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [userIdSearch, setUserIdSearch] = useState('');
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [sortField, setSortField] = useState<keyof BackendLog>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [levelSortOrder, setLevelSortOrder] = useState<'error' | 'warning' | 'info' | 'debug'>('error'); // 로그 레벨 정렬 우선순위
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [hasNextPage, setHasNextPage] = useState(false);

    // 모달 관련 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);

    const PAGE_SIZE = 250;

    // 메타데이터를 문자열로 변환하는 함수
    const convertMetadataToString = (data: any): string => {
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
    const loadLogs = async (page: number = 1, resetLogs: boolean = true) => {
        try {
            setLoading(true);
            setError(null);
            const response = await getBackendLogs(page, PAGE_SIZE) as any;
            const newLogs = response.logs || [];

            if (resetLogs) {
                setLogs(newLogs);
            } else {
                setLogs(prevLogs => [...prevLogs, ...newLogs]);
            }

            setPagination(response.pagination);
            setHasNextPage(newLogs.length === PAGE_SIZE);
            setCurrentPage(page);
        } catch (err) {
            setError(err instanceof Error ? err.message : '백엔드 로그 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load backend logs:', err);
        } finally {
            setLoading(false);
        }
    };

    // 다음 페이지 로드
    const loadNextPage = () => {
        if (hasNextPage && !loading) {
            loadLogs(currentPage + 1, false);
        }
    };

    // 이전 페이지 로드
    const loadPrevPage = () => {
        if (currentPage > 1 && !loading) {
            // 이전 페이지로 돌아가기 위해 전체를 다시 로드
            const targetPage = currentPage - 1;
            loadLogsRange(1, targetPage);
        }
    };

    // 특정 범위의 페이지들을 로드하는 함수
    const loadLogsRange = async (startPage: number, endPage: number) => {
        try {
            setLoading(true);
            setError(null);
            let allLogs: BackendLog[] = [];
            let lastPagination: any = null;

            for (let page = startPage; page <= endPage; page++) {
                const response = await getBackendLogs(page, PAGE_SIZE) as any;
                const pageLogs = response.logs || [];
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
            setError(err instanceof Error ? err.message : '백엔드 로그 목록을 불러오는데 실패했습니다.');
            devLog.error('Failed to load backend logs range:', err);
        } finally {
            setLoading(false);
        }
    };

    // 새로고침 핸들러
    const handleRefresh = () => {
        setCurrentPage(1);
        loadLogs(1, true);
    };

    // ID 검색 핸들러 (사용자 ID 기반 필터링은 백엔드 로그에서 제거)
    const handleUserIdSearch = () => {
        const userId = userIdSearch.trim();
        if (userId === '') {
            // 빈 값이면 전체 검색으로 리셋
            setCurrentUserId(null);
            setCurrentPage(1);
            loadLogs(1, true);
        } else {
            const parsedUserId = parseInt(userId);
            if (isNaN(parsedUserId)) {
                showValidationErrorToastKo('유효한 사용자 ID를 입력해주세요.');
                return;
            }
            setCurrentUserId(parsedUserId);
            // 클라이언트 사이드에서 필터링하도록 처리
            setCurrentPage(1);
        }
    };

    // ID 검색 리셋 핸들러
    const handleResetUserIdSearch = () => {
        setUserIdSearch('');
        setCurrentUserId(null);
        setCurrentPage(1);
    };

    useEffect(() => {
        loadLogs(1, true);
    }, []);

    // 검색 필터링
    const filteredLogs = logs.filter(log => {
        // 사용자 ID 필터링
        if (currentUserId !== null && log.user_id !== currentUserId) {
            return false;
        }

        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        const logId = log.log_id?.toLowerCase() || '';
        const logLevel = log.log_level?.toLowerCase() || '';
        const message = log.message?.toLowerCase() || '';
        const functionName = log.function_name?.toLowerCase() || '';
        const apiEndpoint = log.api_endpoint?.toLowerCase() || '';
        const userId = log.user_id?.toString() || '';

        return logId.includes(searchLower) ||
               logLevel.includes(searchLower) ||
               message.includes(searchLower) ||
               functionName.includes(searchLower) ||
               apiEndpoint.includes(searchLower) ||
               userId.includes(searchLower);
    });

    // 로그 레벨 정렬을 위한 우선순위 함수
    const getLevelPriority = (log: BackendLog): number => {
        const level = log.log_level?.toLowerCase();

        switch (level) {
            case 'error':
                return levelSortOrder === 'error' ? 0 :
                       levelSortOrder === 'warning' ? 3 :
                       levelSortOrder === 'info' ? 2 : 1;
            case 'warning':
                return levelSortOrder === 'warning' ? 0 :
                       levelSortOrder === 'error' ? 3 :
                       levelSortOrder === 'info' ? 2 : 1;
            case 'info':
                return levelSortOrder === 'info' ? 0 :
                       levelSortOrder === 'debug' ? 3 :
                       levelSortOrder === 'warning' ? 2 : 1;
            case 'debug':
                return levelSortOrder === 'debug' ? 0 :
                       levelSortOrder === 'info' ? 3 :
                       levelSortOrder === 'warning' ? 2 : 1;
            default:
                return 2; // 기본 우선순위
        }
    };

    // 정렬 (검색이 활성화된 경우에만 클라이언트 정렬 적용)
    const sortedLogs = searchTerm || currentUserId ? [...filteredLogs].sort((a, b) => {
        if (sortField === 'log_level') {
            // 로그 레벨 컬럼의 경우 우선순위 정렬
            const aPriority = getLevelPriority(a);
            const bPriority = getLevelPriority(b);
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
        if (sortField === 'log_level') {
            // 로그 레벨 컬럼의 경우 우선순위 정렬
            const aPriority = getLevelPriority(a);
            const bPriority = getLevelPriority(b);
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
    const displayLogs = (searchTerm || currentUserId) ? sortedLogs : sortedLogs;

    // 정렬 핸들러
    const handleSort = (field: keyof BackendLog) => {
        if (field === 'log_level') {
            // 로그 레벨 컬럼의 경우 특별한 우선순위 정렬
            const nextOrder = levelSortOrder === 'error' ? 'warning' :
                             levelSortOrder === 'warning' ? 'info' :
                             levelSortOrder === 'info' ? 'debug' : 'error';
            setLevelSortOrder(nextOrder);
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

    // 로그 레벨 배지 렌더링
    const renderLogLevelBadge = (logLevel: string) => {
        const level = logLevel?.toLowerCase();
        let badgeClass = styles.badgeDefault;

        switch (level) {
            case 'error':
                badgeClass = styles.badgeError;
                break;
            case 'warning':
                badgeClass = styles.badgeWarning;
                break;
            case 'info':
                badgeClass = styles.badgeInfo;
                break;
            case 'debug':
                badgeClass = styles.badgeDebug;
                break;
            case 'success':
                badgeClass = styles.badgeSuccess;
                break;
            default:
                badgeClass = styles.badgeDefault;
        }

        return (
            <span className={`${styles.badge} ${badgeClass}`}>
                {logLevel?.toUpperCase() || 'UNKNOWN'}
            </span>
        );
    };

    // 데이터 미리보기 (긴 텍스트 줄이기)
    const truncateText = (text: string | null, maxLength = 5) => {
        if (!text) return '-';
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    // 메타데이터 처리 함수
    const getDisplayMetadata = (metadataObj: any) => {
        return convertMetadataToString(metadataObj);
    };

    // 모달 열기
    const openModal = (content: string) => {
        setModalContent(content);
        setIsModalOpen(true);
    };

    // 모달 닫기
    const closeModal = () => {
        setIsModalOpen(false);
        setModalContent(null);
    };

    // 값 표시 함수 (AdminDatabase와 동일한 방식)
    const renderCellValue = (value: any, maxLength: number = 20) => {
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
                    <p>백엔드 로그를 불러오는 중...</p>
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
                    <button onClick={() => loadLogs(1, true)} className={styles.retryButton}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
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
                    {(searchTerm || currentUserId) && (
                        <span>({sortedLogs.length}개 검색됨)</span>
                    )}
                    {pagination && !(searchTerm || currentUserId) && (
                        <>
                            <span>|</span>
                            <span>페이지 {pagination.page}</span>
                            <span>표시: {pagination.total_returned}개</span>
                            <span>크기: {pagination.page_size}</span>
                        </>
                    )}
                    {(searchTerm || currentUserId) && (
                        <>
                            <span>|</span>
                            <span>검색 모드: 로드된 모든 로그 검색</span>
                        </>
                    )}
                </div>

                <div className={styles.actionButtons}>
                    {!(searchTerm || currentUserId) && (
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
                                onClick={() => handleSort('log_id')}
                            >
                                로그 ID
                                {sortField === 'log_id' && (
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
                                onClick={() => handleSort('log_level')}
                            >
                                로그 레벨
                                {sortField === 'log_level' && (
                                    <span className={styles.sortIcon}>
                                        {levelSortOrder.toUpperCase()}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('function_name')}
                            >
                                함수명
                                {sortField === 'function_name' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('api_endpoint')}
                            >
                                API 엔드포인트
                                {sortField === 'api_endpoint' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th>메시지</th>
                            <th>메타데이터</th>
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
                                <td colSpan={8} className={styles.noData}>
                                    {(searchTerm || currentUserId) ? '검색 결과가 없습니다.' : '등록된 로그가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            displayLogs.map((log, index) => (
                                <tr key={`${log.log_id}-${index}`} className={styles.tableRow}>
                                    <td className={styles.logId} title={log.log_id}>
                                        {renderCellValue(log.log_id, 20)}
                                    </td>
                                    <td className={styles.userId}>{log.user_id || '-'}</td>
                                    <td className={styles.logLevel}>
                                        {renderLogLevelBadge(log.log_level)}
                                    </td>
                                    <td className={styles.functionName} title={log.function_name || ''}>
                                        {renderCellValue(log.function_name, 20)}
                                    </td>
                                    <td className={styles.apiEndpoint} title={log.api_endpoint || ''}>
                                        {renderCellValue(log.api_endpoint, 25)}
                                    </td>
                                    <td className={styles.messageCell} title={log.message || ''}>
                                        {renderCellValue(log.message, 40)}
                                    </td>
                                    <td className={styles.metadataCell} title={getDisplayMetadata(log.metadata) || ''}>
                                        {renderCellValue(getDisplayMetadata(log.metadata), 30)}
                                    </td>
                                    <td>{formatDate(log.created_at)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* 모달 */}
        <AdminBackendLogDetailModal
            isOpen={isModalOpen}
            content={modalContent}
            onClose={closeModal}
        />
    </>
    );
};

export default AdminBackendLogs;
