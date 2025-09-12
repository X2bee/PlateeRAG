'use client';

import React, { useState, useEffect } from 'react';
import {
    getTableList,
    executeQuery,
    getTableSampleData,
    getDatabaseInfo,
    checkDatabaseConnection
} from '@/app/admin/api/db';
import { devLog } from '@/app/_common/utils/logger';
import styles from '@/app/admin/assets/AdminDatabase.module.scss';
import {
    showSuccessToastKo,
    showErrorToastKo
} from '@/app/_common/utils/toastUtilsKo';
import AdminDatabaseDetailModal from './AdminDatabaseDetailModal';

interface Table {
    name: string;
    row_count?: number;
}

interface QueryResult {
    success: boolean;
    data: any[];
    row_count: number;
    error?: string;
}

interface DatabaseInfo {
    database_type: string;
    connection_status: string;
    version?: string;
    table_count: number;
}

const AdminDatabase: React.FC = () => {
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTable, setSelectedTable] = useState<string>('');
    const [query, setQuery] = useState<string>('');
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [queryLoading, setQueryLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [modalContent, setModalContent] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortField, setSortField] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // 데이터베이스 정보 및 테이블 목록 로드
    const loadDatabaseData = async () => {
        try {
            setLoading(true);
            setError(null);

            // 데이터베이스 연결 상태 확인
            const connected = await checkDatabaseConnection();
            setIsConnected(connected);

            if (!connected) {
                setError('데이터베이스에 연결할 수 없습니다.');
                return;
            }

            // 데이터베이스 정보 로드
            const dbInfoResponse = await getDatabaseInfo() as any;
            if (dbInfoResponse.success) {
                setDbInfo(dbInfoResponse.database_info);
            }

            // 테이블 목록 로드
            const tableList = await getTableList() as any[];
            devLog.log('Raw table list from API:', tableList);

            const tablesWithInfo = tableList.map((table: any) => {
                const tableName = typeof table === 'string' ? table : (table.table_name || table.name);
                devLog.log('Processing table:', table, 'Extracted name:', tableName);
                return {
                    name: tableName,
                    row_count: typeof table === 'object' ? table.row_count : undefined
                };
            });
            setTables(tablesWithInfo);

            devLog.log('Database data loaded successfully:', {
                dbInfo: dbInfoResponse.database_info,
                tables: tablesWithInfo
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '데이터베이스 정보를 불러오는데 실패했습니다.';
            setError(errorMessage);
            devLog.error('Failed to load database data:', err);
        } finally {
            setLoading(false);
        }
    };

    // 테이블 선택 핸들러
    const handleTableSelect = async (tableName: string) => {
        try {
            setSelectedTable(tableName);
            setQuery(`SELECT * FROM ${tableName} LIMIT 100`);
            setQueryLoading(true);

            // 선택된 테이블의 샘플 데이터 로드
            const sampleData = await getTableSampleData(tableName, 100) as any;

            if (sampleData.success) {
                setQueryResult({
                    success: true,
                    data: sampleData.data,
                    row_count: sampleData.row_count,
                });
                showSuccessToastKo(`테이블 "${tableName}"의 데이터를 성공적으로 로드했습니다.`);
            } else {
                setQueryResult({
                    success: false,
                    data: [],
                    row_count: 0,
                    error: sampleData.error
                });
                showErrorToastKo(`테이블 데이터 로드 실패: ${sampleData.error}`);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '테이블 데이터를 불러오는데 실패했습니다.';
            setQueryResult({
                success: false,
                data: [],
                row_count: 0,
                error: errorMessage
            });
            devLog.error('Failed to load table data:', err);
            showErrorToastKo(`테이블 데이터 로드 실패: ${errorMessage}`);
        } finally {
            setQueryLoading(false);
        }
    };

    // 쿼리 실행 핸들러
    const handleExecuteQuery = async () => {
        if (!query.trim()) {
            showErrorToastKo('쿼리를 입력해주세요.');
            return;
        }

        try {
            setQueryLoading(true);

            const result = await executeQuery(query.trim()) as any;
            setQueryResult(result);

            if (result.success) {
                showSuccessToastKo(`쿼리가 성공적으로 실행되었습니다. (${result.row_count}행 반환)`);
            } else {
                showErrorToastKo(`쿼리 실행 실패: ${result.error}`);
            }

            devLog.log('Query executed:', { query: query.trim(), result });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '쿼리 실행에 실패했습니다.';
            setQueryResult({
                success: false,
                data: [],
                row_count: 0,
                error: errorMessage
            });
            devLog.error('Failed to execute query:', err);
            showErrorToastKo(`쿼리 실행 실패: ${errorMessage}`);
        } finally {
            setQueryLoading(false);
        }
    };

    // 새로고침 핸들러
    const handleRefresh = () => {
        loadDatabaseData();
        setSelectedTable('');
        setQuery('');
        setQueryResult(null);
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

    // 값 표시 함수 (20자 제한)
    const renderCellValue = (value: any) => {
        if (value === null || value === undefined) {
            return <span className={styles.nullValue}>NULL</span>;
        }

        const stringValue = String(value);
        if (stringValue.length <= 20) {
            return stringValue;
        }

        return (
            <div className={styles.cellContent}>
                <span>{stringValue.substring(0, 20)}</span>
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

    // 정렬 핸들러
    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    useEffect(() => {
        loadDatabaseData();
    }, []);

    // 결과 테이블 렌더링
    const renderResultTable = () => {
        if (!queryResult) return null;

        if (!queryResult.success) {
            return (
                <div className={styles.queryError}>
                    <h4>쿼리 실행 오류</h4>
                    <p>{queryResult.error}</p>
                </div>
            );
        }

        if (queryResult.data.length === 0) {
            return (
                <div className={styles.noData}>
                    결과가 없습니다.
                </div>
            );
        }

        const columns = Object.keys(queryResult.data[0]);

        // 정렬된 데이터 생성
        const sortedData = sortField ? [...queryResult.data].sort((a, b) => {
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
        }) : queryResult.data;

        return (
            <div className={styles.resultContainer}>
                {/* <div className={styles.resultHeader}>
                    <h4>쿼리 결과</h4>
                    <span className={styles.resultCount}>
                        {queryResult.row_count}행 반환됨
                    </span>
                </div> */}
                <div className={styles.tableContainer}>
                    <table className={styles.resultTable}>
                        <thead>
                            <tr>
                                {columns.map((column) => (
                                    <th
                                        key={column}
                                        className={styles.sortable}
                                        onClick={() => handleSort(column)}
                                    >
                                        {column}
                                        {sortField === column && (
                                            <span className={styles.sortIcon}>
                                                {sortDirection === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map((row, index) => (
                                <tr key={index}>
                                    {columns.map((column) => (
                                        <td key={column}>
                                            {renderCellValue(row[column])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>데이터베이스 정보를 불러오는 중...</p>
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
                    <button onClick={handleRefresh} className={styles.retryButton}>
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 상단 정보 바 */}
            <div className={styles.infoBar}>
                <div className={styles.dbInfo}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>데이터베이스:</span>
                        <span className={styles.infoValue}>
                            {dbInfo?.database_type || 'Unknown'}
                        </span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>상태:</span>
                        <span className={`${styles.infoValue} ${
                            isConnected ? styles.connected : styles.disconnected
                        }`}>
                            {isConnected ? '연결됨' : '연결 안됨'}
                        </span>
                    </div>
                    {dbInfo?.version && (
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>버전:</span>
                            <span className={styles.infoValue}>{dbInfo.version}</span>
                        </div>
                    )}
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>테이블 수:</span>
                        <span className={styles.infoValue}>{tables.length}</span>
                    </div>
                </div>
                <button onClick={handleRefresh} className={styles.refreshButton}>
                    새로고침
                </button>
            </div>

            {/* 메인 컨텐츠 */}
            <div className={styles.mainContent}>
                {/* 좌측 테이블 목록 */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        <h3>테이블 목록</h3>
                        <span className={styles.tableCount}>{tables.length}개</span>
                    </div>
                    <div className={styles.tableList}>
                        {tables.length === 0 ? (
                            <div className={styles.noTables}>
                                테이블이 없습니다.
                            </div>
                        ) : (
                            tables.map((table) => (
                                <div
                                    key={table.name}
                                    className={`${styles.tableItem} ${
                                        selectedTable === table.name ? styles.selected : ''
                                    }`}
                                    onClick={() => handleTableSelect(table.name)}
                                >
                                    <div className={styles.tableName}>
                                        {table.name}
                                    </div>
                                    {table.row_count !== undefined && (
                                        <div className={styles.rowCount}>
                                            {table.row_count.toLocaleString()}행
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* 우측 쿼리 및 결과 영역 */}
                <div className={styles.queryArea}>
                    {/* 쿼리 입력 영역 */}
                    <div className={styles.queryInput}>
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="SELECT * FROM table_name LIMIT 100"
                            className={styles.queryTextarea}
                            rows={6}
                        />
                        <div className={styles.queryActions}>
                            <button
                                onClick={handleExecuteQuery}
                                disabled={queryLoading || !query.trim()}
                                className={styles.executeButton}
                            >
                                {queryLoading ? 'Executing...' : 'Execute'}
                            </button>
                        </div>
                    </div>

                    {/* 결과 영역 */}
                    <div className={styles.resultArea}>
                        {queryLoading ? (
                            <div className={styles.loading}>
                                <div className={styles.spinner}></div>
                                <p>쿼리를 실행하는 중...</p>
                            </div>
                        ) : (
                            renderResultTable()
                        )}
                    </div>
                </div>
            </div>

            {/* 모달 */}
            <AdminDatabaseDetailModal
                isOpen={isModalOpen}
                content={modalContent}
                onClose={closeModal}
            />
        </div>
    );
};

export default AdminDatabase;
