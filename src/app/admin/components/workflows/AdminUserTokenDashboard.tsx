'use client';

import React, { useState, useEffect } from 'react';
import { getUserTokenUsage } from '@/app/admin/api/workflow';
import { devLog } from '@/app/_common/utils/logger';
import { showValidationErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/admin/assets/workflows/AdminUserTokenDashboard.module.scss';

interface UserTokenUsage {
    user_id: number;
    username: string | null;
    total_interactions: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    average_input_tokens: number;
    average_output_tokens: number;
    first_interaction: string;
    last_interaction: string;
    most_used_workflow: string | null;
    workflow_usage_count: number;
}

interface PaginationInfo {
    page: number;
    page_size: number;
    total_users: number;
    total_pages: number;
}

const AdminUserTokenDashboard: React.FC = () => {
    const [tokenUsageData, setTokenUsageData] = useState<UserTokenUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] =
        useState<keyof UserTokenUsage>('total_tokens');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
        start: '',
        end: '',
    });

    const PAGE_SIZE = 50;

    // 토큰 사용량 데이터 로드
    const loadTokenUsage = async (
        page: number = 1,
        startDate?: string,
        endDate?: string,
    ) => {
        try {
            setLoading(true);
            setError(null);
            const response = (await getUserTokenUsage(
                page,
                PAGE_SIZE,
                startDate,
                endDate,
            )) as any;

            setTokenUsageData(response.users || []);
            setPagination(response.pagination);
            setCurrentPage(page);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : '토큰 사용량 데이터를 불러오는데 실패했습니다.',
            );
            devLog.error('Failed to load token usage data:', err);
        } finally {
            setLoading(false);
        }
    };

    // 새로고침 핸들러
    const handleRefresh = () => {
        setCurrentPage(1);
        loadTokenUsage(1, dateRange.start, dateRange.end);
    };

    // 날짜 범위 적용 핸들러
    const handleDateRangeApply = () => {
        setCurrentPage(1);
        loadTokenUsage(1, dateRange.start, dateRange.end);
    };

    // 날짜 범위 리셋 핸들러
    const handleDateRangeReset = () => {
        setDateRange({ start: '', end: '' });
        setCurrentPage(1);
        loadTokenUsage(1);
    };

    // 페이지 변경 핸들러
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && pagination && newPage <= pagination.total_pages) {
            loadTokenUsage(newPage, dateRange.start, dateRange.end);
        }
    };

    useEffect(() => {
        loadTokenUsage(1);
    }, []);

    // 검색 필터링
    const filteredData = tokenUsageData.filter((user) => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;

        const username = user.username?.toLowerCase() || '';
        const userId = user.user_id?.toString() || '';
        const mostUsedWorkflow = user.most_used_workflow?.toLowerCase() || '';

        return (
            username.includes(searchLower) ||
            userId.includes(searchLower) ||
            mostUsedWorkflow.includes(searchLower)
        );
    });

    // 정렬
    const sortedData = [...filteredData].sort((a, b) => {
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
    const handleSort = (field: keyof UserTokenUsage) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc'); // 숫자 필드는 기본적으로 내림차순
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
            minute: '2-digit',
        });
    };

    // 숫자 포맷팅 (천 단위 구분자)
    const formatNumber = (num: number) => {
        return num.toLocaleString('ko-KR');
    };

    // 사용자 정보 포맷팅
    const formatUserInfo = (username: string | null, userId: number) => {
        if (username) return `${username} (${userId})`;
        return userId.toString();
    };

    // 토큰 사용량 바 차트 컴포넌트
    const TokenUsageBar = ({
        inputTokens,
        outputTokens,
        totalTokens,
        maxTokens,
    }: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        maxTokens: number;
    }) => {
        const inputPercentage =
            maxTokens > 0 ? (inputTokens / maxTokens) * 100 : 0;
        const outputPercentage =
            maxTokens > 0 ? (outputTokens / maxTokens) * 100 : 0;

        return (
            <div className={styles.tokenBar}>
                <div className={styles.tokenBarContainer}>
                    <div
                        className={styles.inputTokenBar}
                        style={{ width: `${inputPercentage}%` }}
                        title={`입력 토큰: ${formatNumber(inputTokens)}`}
                    />
                    <div
                        className={styles.outputTokenBar}
                        style={{
                            width: `${outputPercentage}%`,
                            marginLeft: `${inputPercentage}%`,
                        }}
                        title={`출력 토큰: ${formatNumber(outputTokens)}`}
                    />
                </div>
                <span className={styles.tokenBarLabel}>
                    {formatNumber(totalTokens)}
                </span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>토큰 사용량 데이터를 불러오는 중...</p>
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
                    <button
                        onClick={handleRefresh}
                        className={styles.retryButton}
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    // 최대 토큰 수 계산 (차트 스케일링용)
    const maxTokens = Math.max(
        ...tokenUsageData.map((user) => user.total_tokens),
        1,
    );

    return (
        <div className={styles.container}>
            {/* 상단 컨트롤 */}
            <div className={styles.controls}>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder="사용자명, ID, 워크플로우명으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.dateRangeContainer}>
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) =>
                            setDateRange((prev) => ({
                                ...prev,
                                start: e.target.value,
                            }))
                        }
                        className={styles.dateInput}
                    />
                    <span>~</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) =>
                            setDateRange((prev) => ({
                                ...prev,
                                end: e.target.value,
                            }))
                        }
                        className={styles.dateInput}
                    />
                    <button
                        onClick={handleDateRangeApply}
                        className={styles.applyButton}
                    >
                        적용
                    </button>
                    <button
                        onClick={handleDateRangeReset}
                        className={styles.resetButton}
                    >
                        리셋
                    </button>
                </div>

                <div className={styles.stats}>
                    <span>총 {tokenUsageData.length}명의 사용자</span>
                    {searchTerm && <span>({sortedData.length}명 검색됨)</span>}
                    {pagination && (
                        <>
                            <span>|</span>
                            <span>
                                페이지 {pagination.page}/
                                {pagination.total_pages}
                            </span>
                        </>
                    )}
                </div>

                <button
                    onClick={handleRefresh}
                    className={styles.refreshButton}
                >
                    새로고침
                </button>
            </div>

            {/* 요약 통계 */}
            <div className={styles.summaryStats}>
                <div className={styles.statCard}>
                    <h3>총 토큰 사용량</h3>
                    <p className={styles.statValue}>
                        {formatNumber(
                            tokenUsageData.reduce(
                                (sum, user) => sum + user.total_tokens,
                                0,
                            ),
                        )}
                    </p>
                </div>
                <div className={styles.statCard}>
                    <h3>총 상호작용</h3>
                    <p className={styles.statValue}>
                        {formatNumber(
                            tokenUsageData.reduce(
                                (sum, user) => sum + user.total_interactions,
                                0,
                            ),
                        )}
                    </p>
                </div>
                <div className={styles.statCard}>
                    <h3>평균 토큰/상호작용</h3>
                    <p className={styles.statValue}>
                        {tokenUsageData.length > 0
                            ? Math.round(
                                  tokenUsageData.reduce(
                                      (sum, user) => sum + user.total_tokens,
                                      0,
                                  ) /
                                      tokenUsageData.reduce(
                                          (sum, user) =>
                                              sum + user.total_interactions,
                                          0,
                                      ),
                              )
                            : 0}
                    </p>
                </div>
                <div className={styles.statCard}>
                    <h3>활성 사용자</h3>
                    <p className={styles.statValue}>
                        {
                            tokenUsageData.filter(
                                (user) => user.total_interactions > 0,
                            ).length
                        }
                    </p>
                </div>
            </div>

            {/* 토큰 사용량 테이블 */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('user_id')}
                            >
                                사용자
                                {sortField === 'user_id' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('total_interactions')}
                            >
                                총 상호작용
                                {sortField === 'total_interactions' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('total_tokens')}
                            >
                                총 토큰
                                {sortField === 'total_tokens' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('total_input_tokens')}
                            >
                                입력 토큰
                                {sortField === 'total_input_tokens' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() =>
                                    handleSort('total_output_tokens')
                                }
                            >
                                출력 토큰
                                {sortField === 'total_output_tokens' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th>토큰 사용량 분포</th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('most_used_workflow')}
                            >
                                주요 워크플로우
                                {sortField === 'most_used_workflow' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                            <th
                                className={styles.sortable}
                                onClick={() => handleSort('last_interaction')}
                            >
                                마지막 활동
                                {sortField === 'last_interaction' && (
                                    <span className={styles.sortIcon}>
                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                    </span>
                                )}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length === 0 ? (
                            <tr>
                                <td colSpan={8} className={styles.noData}>
                                    {searchTerm
                                        ? '검색 결과가 없습니다.'
                                        : '토큰 사용 데이터가 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            sortedData.map((user) => (
                                <tr
                                    key={user.user_id}
                                    className={styles.tableRow}
                                >
                                    <td className={styles.userInfo}>
                                        {formatUserInfo(
                                            user.username,
                                            user.user_id,
                                        )}
                                    </td>
                                    <td className={styles.numberCell}>
                                        {formatNumber(user.total_interactions)}
                                    </td>
                                    <td className={styles.numberCell}>
                                        <strong>
                                            {formatNumber(user.total_tokens)}
                                        </strong>
                                    </td>
                                    <td className={styles.numberCell}>
                                        {formatNumber(user.total_input_tokens)}
                                    </td>
                                    <td className={styles.numberCell}>
                                        {formatNumber(user.total_output_tokens)}
                                    </td>
                                    <td className={styles.tokenBarCell}>
                                        <TokenUsageBar
                                            inputTokens={
                                                user.total_input_tokens
                                            }
                                            outputTokens={
                                                user.total_output_tokens
                                            }
                                            totalTokens={user.total_tokens}
                                            maxTokens={maxTokens}
                                        />
                                    </td>
                                    <td className={styles.workflowCell}>
                                        {user.most_used_workflow ? (
                                            <div>
                                                <div
                                                    className={
                                                        styles.workflowName
                                                    }
                                                >
                                                    {user.most_used_workflow}
                                                </div>
                                                <div
                                                    className={
                                                        styles.workflowCount
                                                    }
                                                >
                                                    (
                                                    {formatNumber(
                                                        user.workflow_usage_count,
                                                    )}
                                                    회)
                                                </div>
                                            </div>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className={styles.dateCell}>
                                        {formatDate(user.last_interaction)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            {pagination && pagination.total_pages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className={styles.paginationButton}
                    >
                        이전
                    </button>

                    <div className={styles.pageNumbers}>
                        {Array.from(
                            { length: Math.min(5, pagination.total_pages) },
                            (_, i) => {
                                const pageNum =
                                    Math.max(
                                        1,
                                        Math.min(
                                            pagination.total_pages - 4,
                                            currentPage - 2,
                                        ),
                                    ) + i;

                                if (pageNum <= pagination.total_pages) {
                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() =>
                                                handlePageChange(pageNum)
                                            }
                                            className={`${styles.pageNumber} ${
                                                pageNum === currentPage
                                                    ? styles.active
                                                    : ''
                                            }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                }
                                return null;
                            },
                        )}
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= pagination.total_pages}
                        className={styles.paginationButton}
                    >
                        다음
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminUserTokenDashboard;