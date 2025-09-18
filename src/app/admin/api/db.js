// Database 관리 API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 데이터베이스의 모든 테이블 목록을 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Array>} 테이블 목록 배열
 */
export const getTableList = async () => {
    try {
        const url = `${API_BASE_URL}/api/admin/database/tables`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log('Get table list result:', data);

        if (!response.ok) {
            devLog.error('Failed to get table list:', data);
            throw new Error(data.detail || 'Failed to get table list');
        }

        return data.tables;
    } catch (error) {
        devLog.error('Failed to get table list:', error);
        throw error;
    }
};

/**
 * 임의의 SQL 쿼리를 실행하는 함수 (슈퍼유저 권한 필요)
 * 보안상 SELECT 쿼리만 허용됩니다.
 * @param {string} query - 실행할 SQL 쿼리
 * @param {Array} [params] - 쿼리 파라미터 배열 (선택사항)
 * @returns {Promise<Object>} 쿼리 실행 결과 { success, data, row_count, error }
 */
export const executeQuery = async (query, params = null) => {
    try {
        const requestBody = {
            query: query,
            params: params
        };

        const response = await apiClient(`${API_BASE_URL}/api/admin/database/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        devLog.log('Execute query result:', data);

        if (!response.ok) {
            devLog.error('Failed to execute query:', data);
            throw new Error(data.detail || 'Failed to execute query');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to execute query:', error);
        throw error;
    }
};

/**
 * 특정 테이블의 구조(컬럼 정보)를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {string} tableName - 테이블명
 * @returns {Promise<Object>} 테이블 구조 정보 { success, table_name, columns, error }
 */
export const getTableStructure = async (tableName) => {
    try {
        const url = `${API_BASE_URL}/api/admin/database/table/${encodeURIComponent(tableName)}/structure`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log(`Get table structure result for ${tableName}:`, data);

        if (!response.ok) {
            devLog.error(`Failed to get table structure for ${tableName}:`, data);
            throw new Error(data.detail || 'Failed to get table structure');
        }

        return data;
    } catch (error) {
        devLog.error(`Failed to get table structure for ${tableName}:`, error);
        throw error;
    }
};

/**
 * 특정 테이블의 샘플 데이터를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {string} tableName - 테이블명
 * @param {number} [limit=100] - 가져올 데이터 개수 제한 (기본값: 100, 최대: 1000)
 * @returns {Promise<Object>} 테이블 샘플 데이터 { success, table_name, data, row_count, limit, error }
 */
export const getTableSampleData = async (tableName, limit = 100) => {
    try {
        // limit 값 검증
        if (limit < 1 || limit > 1000) {
            limit = 100;
        }

        const url = `${API_BASE_URL}/api/admin/database/table/${encodeURIComponent(tableName)}/sample?limit=${limit}`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log(`Get table sample data result for ${tableName}:`, data);

        if (!response.ok) {
            devLog.error(`Failed to get table sample data for ${tableName}:`, data);
            throw new Error(data.detail || 'Failed to get table sample data');
        }

        return data;
    } catch (error) {
        devLog.error(`Failed to get table sample data for ${tableName}:`, error);
        throw error;
    }
};

/**
 * 데이터베이스 기본 정보를 가져오는 함수 (슈퍼유저 권한 필요)
 * @returns {Promise<Object>} 데이터베이스 정보 { success, database_info, error }
 */
export const getDatabaseInfo = async () => {
    try {
        const url = `${API_BASE_URL}/api/admin/database/database/info`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log('Get database info result:', data);

        if (!response.ok) {
            devLog.error('Failed to get database info:', data);
            throw new Error(data.detail || 'Failed to get database info');
        }

        return data;
    } catch (error) {
        devLog.error('Failed to get database info:', error);
        throw error;
    }
};

/**
 * 특정 테이블의 행 개수를 가져오는 함수 (슈퍼유저 권한 필요)
 * @param {string} tableName - 테이블명
 * @returns {Promise<Object>} 테이블 행 개수 정보 { success, table_name, row_count, error }
 */
export const getTableRowCount = async (tableName) => {
    try {
        const url = `${API_BASE_URL}/api/admin/database/table/${encodeURIComponent(tableName)}/count`;
        const response = await apiClient(url);
        const data = await response.json();
        devLog.log(`Get table row count result for ${tableName}:`, data);

        if (!response.ok) {
            devLog.error(`Failed to get table row count for ${tableName}:`, data);
            throw new Error(data.detail || 'Failed to get table row count');
        }

        return data;
    } catch (error) {
        devLog.error(`Failed to get table row count for ${tableName}:`, error);
        throw error;
    }
};

/**
 * 데이터베이스 연결 상태를 확인하는 유틸리티 함수
 * @returns {Promise<boolean>} 연결 상태 (true/false)
 */
export const checkDatabaseConnection = async () => {
    try {
        const dbInfo = await getDatabaseInfo();
        return dbInfo.database_info?.connection_status === 'connected';
    } catch (error) {
        devLog.error('Failed to check database connection:', error);
        return false;
    }
};

/**
 * 테이블명 유효성 검증 함수
 * @param {string} tableName - 검증할 테이블명
 * @returns {boolean} 유효성 여부
 */
export const validateTableName = (tableName) => {
    if (!tableName || typeof tableName !== 'string') {
        return false;
    }

    // 기본적인 SQL 인젝션 방지를 위한 간단한 검증
    // 알파벳, 숫자, 언더스코어, 하이픈만 허용
    const cleanName = tableName.replace(/[_-]/g, '');
    return cleanName.match(/^[a-zA-Z0-9]+$/) !== null;
};

/**
 * SQL 쿼리가 SELECT 쿼리인지 확인하는 함수
 * @param {string} query - 검증할 SQL 쿼리
 * @returns {boolean} SELECT 쿼리 여부
 */
export const isSelectQuery = (query) => {
    if (!query || typeof query !== 'string') {
        return false;
    }

    const trimmedQuery = query.trim().toLowerCase();
    return trimmedQuery.startsWith('select');
};

/**
 * 데이터베이스 타입별로 적절한 쿼리 문법을 반환하는 유틸리티 함수
 * @param {string} dbType - 데이터베이스 타입 ('postgresql' 또는 'sqlite')
 * @param {string} query - 기본 쿼리
 * @param {string} [postgresqlVersion] - PostgreSQL용 쿼리
 * @param {string} [sqliteVersion] - SQLite용 쿼리
 * @returns {string} 적절한 쿼리
 */
export const getQueryForDbType = (dbType, query, postgresqlVersion = null, sqliteVersion = null) => {
    if (dbType === 'postgresql' && postgresqlVersion) {
        return postgresqlVersion;
    } else if (dbType === 'sqlite' && sqliteVersion) {
        return sqliteVersion;
    }
    return query;
};

/**
 * 모든 테이블의 기본 정보를 한번에 가져오는 함수 (테이블명, 행 개수 포함)
 * @returns {Promise<Array>} 테이블 정보 배열 [{ name, row_count, structure_available }]
 */
export const getAllTablesInfo = async () => {
    try {
        const tables = await getTableList();
        const tablesInfo = [];

        // 각 테이블의 행 개수를 병렬로 가져오기
        const countPromises = tables.map(async (table) => {
            try {
                const tableName = typeof table === 'string' ? table : table.name;
                const countResult = await getTableRowCount(tableName);
                return {
                    name: tableName,
                    row_count: countResult.row_count || 0,
                    structure_available: true
                };
            } catch (error) {
                devLog.warn(`Failed to get row count for table ${table}:`, error);
                return {
                    name: typeof table === 'string' ? table : table.name,
                    row_count: 0,
                    structure_available: false
                };
            }
        });

        const results = await Promise.all(countPromises);
        tablesInfo.push(...results);

        devLog.log('Get all tables info result:', tablesInfo);
        return tablesInfo;
    } catch (error) {
        devLog.error('Failed to get all tables info:', error);
        throw error;
    }
};

/**
 * 테이블 데이터를 CSV 형식으로 내보내는 함수 (클라이언트 사이드)
 * @param {string} tableName - 테이블명
 * @param {number} [limit=1000] - 내보낼 데이터 개수 제한
 * @returns {Promise<string>} CSV 형식의 문자열
 */
export const exportTableToCSV = async (tableName, limit = 1000) => {
    try {
        const sampleData = await getTableSampleData(tableName, limit);

        if (!sampleData.success || !sampleData.data || sampleData.data.length === 0) {
            throw new Error('No data to export');
        }

        const data = sampleData.data;
        const headers = Object.keys(data[0]);

        // CSV 헤더 생성
        let csv = headers.join(',') + '\n';

        // CSV 데이터 생성
        data.forEach(row => {
            const values = headers.map(header => {
                const value = row[header];
                // 값에 쉼표나 따옴표가 있으면 따옴표로 감싸기
                if (value === null || value === undefined) {
                    return '';
                }
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return '"' + stringValue.replace(/"/g, '""') + '"';
                }
                return stringValue;
            });
            csv += values.join(',') + '\n';
        });

        devLog.log(`Exported ${data.length} rows from table ${tableName} to CSV`);
        return csv;
    } catch (error) {
        devLog.error(`Failed to export table ${tableName} to CSV:`, error);
        throw error;
    }
};
