import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient, apiClientV2 } from '@/app/_common/api/helper/apiClient';

/**
 * Data Manager API 함수들을 관리하는 파일
 * Data Manager 인스턴스의 생성, 관리, 삭제 및 Huggingface 데이터 관리를 위한 RESTful API
 */

/**
 * Data Manager 서비스 상태 확인
 * @returns {Promise<Object>} 서비스 상태 정보
 */
export const getDataManagerHealth = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/health`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Data Manager health status fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Data Manager health status:', error);
        throw error;
    }
};

/**
 * 새로운 Data Manager 인스턴스 생성
 * @returns {Promise<Object>} 생성된 매니저 정보
 */
export const createDataManager = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info('Data Manager created successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to create Data Manager:', error);
        throw error;
    }
};

/**
 * Data Manager 목록 조회
 * @param {boolean} allUsers - 모든 사용자의 매니저를 조회할지 여부 (기본값: false)
 * @returns {Promise<Object>} 매니저 목록
 */
export const listDataManagers = async (allUsers = false) => {
    try {
        const queryParam = allUsers ? '?all_users=true' : '';
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers${queryParam}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Data Manager list fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Data Manager list:', error);
        throw error;
    }
};

/**
 * 특정 Data Manager의 상태 조회
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 매니저 상태 정보
 */
export const getDataManagerStatus = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                manager_id: managerId,
            }),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Data Manager ${managerId} status fetched:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to fetch Data Manager ${managerId} status:`, error);
        throw error;
    }
};

/**
 * Data Manager 삭제
 * @param {string} managerId - 삭제할 매니저 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteDataManager = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                manager_id: managerId,
            }),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Data Manager ${managerId} deleted successfully:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to delete Data Manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 전체 Data Manager 통계 조회
 * @returns {Promise<Object>} 전체 통계 정보
 */
export const getDataManagerStats = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/data-manager/stats`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Data Manager stats fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Data Manager stats:', error);
        throw error;
    }
};

/**
 * Data Manager 유틸리티 함수들
 */

/**
 * 매니저 ID 유효성 검사
 * @param {string} managerId - 검사할 매니저 ID
 * @returns {boolean} 유효성 여부
 */
export const isValidManagerId = (managerId) => {
    return typeof managerId === 'string' && managerId.length > 0;
};

/**
 * 데이터셋 키 생성 (클라이언트 사이드에서 예측)
 * @param {string} datasetName - 데이터셋 이름
 * @param {string} [configName] - 설정 이름
 * @param {string} [split] - 데이터 분할
 * @returns {string} 생성된 데이터셋 키
 */
export const generateDatasetKey = (datasetName, configName = null, split = null) => {
    let key = datasetName;
    if (configName) {
        key += `__${configName}`;
    }
    if (split) {
        key += `__${split}`;
    }
    return key;
};

/**
 * 파일 키 생성 (클라이언트 사이드에서 예측)
 * @param {string} repoId - 리포지토리 ID
 * @param {string} filename - 파일명
 * @returns {string} 생성된 파일 키
 */
export const generateFileKey = (repoId, filename) => {
    return `${repoId}__${filename}`;
};

/**
 * 리소스 사용량 포맷팅 함수
 * @param {number} memoryMb - 메모리 사용량 (MB)
 * @param {number} cpuPercent - CPU 사용률 (%)
 * @returns {Object} 포맷팅된 리소스 정보
 */
export const formatResourceUsage = (memoryMb, cpuPercent) => {
    return {
        memory: {
            mb: Math.round(memoryMb * 100) / 100,
            gb: Math.round((memoryMb / 1024) * 100) / 100,
            formatted: memoryMb >= 1024
                ? `${Math.round((memoryMb / 1024) * 100) / 100} GB`
                : `${Math.round(memoryMb * 100) / 100} MB`
        },
        cpu: {
            percent: Math.round(cpuPercent * 100) / 100,
            formatted: `${Math.round(cpuPercent * 100) / 100}%`
        }
    };
};

/**
 * Huggingface 데이터셋 다운로드 및 적재
 * @param {string} managerId - 매니저 ID
 * @param {string} repoId - Huggingface 리포지토리 ID (예: "squad")
 * @param {string} [filename] - 특정 파일명 (선택사항)
 * @param {string} [split] - 데이터 분할 (예: "train")
 * @returns {Promise<Object>} 다운로드 결과
 */
export const downloadDataset = async (managerId, repoId, filename = null, split = null) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }
        if (!repoId) {
            throw new Error('Repository ID is required');
        }

        const requestBody = {
            manager_id: managerId,
            repo_id: repoId
        };

        if (filename) {
            requestBody.filename = filename;
        }
        if (split) {
            requestBody.split = split;
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/hf/download-dataset`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset downloaded and loaded for manager ${managerId} from ${repoId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to download dataset for manager ${managerId} from ${repoId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 샘플 조회
 * @param {string} managerId - 매니저 ID
 * @param {number} [numSamples=10] - 조회할 샘플 개수 (기본값: 10)
 * @returns {Promise<Object>} 데이터셋 샘플 정보
 */
export const getDatasetSample = async (managerId, numSamples = 10) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId,
            num_samples: numSamples
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/dataset/sample`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset sample retrieved for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to get dataset sample for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 삭제
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 데이터셋 삭제 결과
 */
export const removeDataset = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId,
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/dataset/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset removed for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to remove dataset for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 로컬 파일 업로드 및 자동 적재
 * @param {string} managerId - 매니저 ID
 * @param {FileList|File[]} files - 업로드할 파일들 (parquet 또는 csv)
 * @returns {Promise<Object>} 업로드 결과
 */
export const uploadLocalDataset = async (managerId, files) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }
        if (!files || files.length === 0) {
            throw new Error('Files are required');
        }

        // 파일 형식 검증
        const supportedFormats = ['.parquet', '.csv'];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const hasValidExtension = supportedFormats.some(ext =>
                file.name.toLowerCase().endsWith(ext)
            );
            if (!hasValidExtension) {
                throw new Error(`지원되지 않는 파일 형식: ${file.name}. parquet 또는 csv 파일만 지원됩니다.`);
            }
        }

        // FormData 생성
        const formData = new FormData();
        formData.append('manager_id', managerId);

        // 파일들 추가 - API 스펙에 맞게 'files' 필드명 사용
        for (let i = 0; i < files.length; i++) {
            formData.append('files', files[i]);
        }

        const response = await apiClientV2(`${API_BASE_URL}/api/data-manager/processing/local/upload-dataset`, {
            method: 'POST',
            body: formData, // FormData는 Content-Type 헤더를 자동으로 설정
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Local dataset uploaded for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to upload local dataset for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋을 CSV 파일로 내보내기
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<void>} CSV 파일 다운로드
 */
export const exportDatasetAsCSV = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId,
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/export/csv`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        // 파일 다운로드 처리
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset_${managerId}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        devLog.info(`Dataset exported as CSV for manager ${managerId}`);
    } catch (error) {
        devLog.error(`Failed to export dataset as CSV for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋을 Parquet 파일로 내보내기
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<void>} Parquet 파일 다운로드
 */
export const exportDatasetAsParquet = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId,
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/export/parquet`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        // 파일 다운로드 처리
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset_${managerId}.parquet`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        devLog.info(`Dataset exported as Parquet for manager ${managerId}`);
    } catch (error) {
        devLog.error(`Failed to export dataset as Parquet for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 기술통계정보 조회
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 기술통계정보
 */
export const getDatasetStatistics = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId,
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/statistics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset statistics retrieved for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to get dataset statistics for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 컬럼 삭제
 * @param {string} managerId - 매니저 ID
 * @param {string[]} columns - 삭제할 컬럼명들
 * @returns {Promise<Object>} 컬럼 삭제 결과
 */
export const dropDatasetColumns = async (managerId, columns) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }
        if (!columns || !Array.isArray(columns) || columns.length === 0) {
            throw new Error('Columns array is required and must contain at least one column');
        }

        // 컬럼명 유효성 검사
        for (const column of columns) {
            if (!column || typeof column !== 'string' || column.trim() === '') {
                throw new Error('All column names must be non-empty strings');
            }
        }

        const requestBody = {
            manager_id: managerId,
            columns: columns.map(col => col.trim()) // 컬럼명 공백 제거
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/drop-columns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Dataset columns dropped for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to drop dataset columns for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 컬럼 값 교체
 * @param {string} managerId - 매니저 ID
 * @param {string} columnName - 대상 컬럼명
 * @param {string} oldValue - 교체할 기존 값
 * @param {string} newValue - 새로운 값
 * @returns {Promise<Object>} 컬럼 값 교체 결과
 */
export const replaceColumnValues = async (managerId, columnName, oldValue, newValue) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }
        if (!columnName || typeof columnName !== 'string' || columnName.trim() === '') {
            throw new Error('Column name is required and must be a non-empty string');
        }
        if (oldValue === undefined || oldValue === null) {
            throw new Error('Old value is required');
        }
        if (newValue === undefined || newValue === null) {
            throw new Error('New value is required');
        }

        const requestBody = {
            manager_id: managerId,
            column_name: columnName.trim(),
            old_value: String(oldValue),
            new_value: String(newValue)
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/replace-values`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Column values replaced for manager ${managerId}, column ${columnName}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to replace column values for manager ${managerId}, column ${columnName}:`, error);
        throw error;
    }
};

/**
 * 컬럼 연산 적용
 * @param {string} managerId - 매니저 ID
 * @param {string} columnName - 대상 컬럼명
 * @param {string} operation - 연산식 (예: +4, *3+4)
 * @returns {Promise<Object>} 컬럼 연산 적용 결과
 */
export const applyColumnOperation = async (managerId, columnName, operation) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }
        if (!columnName || typeof columnName !== 'string' || columnName.trim() === '') {
            throw new Error('Column name is required and must be a non-empty string');
        }
        if (!operation || typeof operation !== 'string' || operation.trim() === '') {
            throw new Error('Operation is required and must be a non-empty string');
        }

        // 연산식 유효성 검사 (정규식)
        const operationPattern = /^[+\-*/\d.]+$/;
        if (!operationPattern.test(operation.trim())) {
            throw new Error('Invalid operation format. Only +, -, *, /, numbers, and dots are allowed');
        }

        const requestBody = {
            manager_id: managerId,
            column_name: columnName.trim(),
            operation: operation.trim()
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/apply-operation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const result = await response.json().catch(() => ({}));
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`
            );
        }

        const data = await response.json();
        devLog.info(`Column operation applied for manager ${managerId}, column ${columnName}, operation ${operation}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to apply column operation for manager ${managerId}, column ${columnName}, operation ${operation}:`, error);
        throw error;
    }
};

/**
 * NULL 행 제거
 * @param {string} managerId - 매니저 ID
 * @param {string|null} columnName - 대상 컬럼명 (null인 경우 전체 컬럼에서 NULL 체크)
 * @returns {Promise<Object>} NULL 행 제거 결과
 */
export const removeNullRows = async (managerId, columnName = null) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID is required');
        }

        const requestBody = {
            manager_id: managerId
        };

        // columnName이 제공된 경우에만 추가
        if (columnName && typeof columnName === 'string' && columnName.trim() !== '') {
            requestBody.column_name = columnName.trim();
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/remove-null-rows`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info(`NULL rows removed for manager ${managerId}${columnName ? ` in column ${columnName}` : ''}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to remove NULL rows for manager ${managerId}${columnName ? ` in column ${columnName}` : ''}:`, error);
        throw error;
    }
};

/**
 * 데이터셋을 HuggingFace Hub에 업로드
 * @param {string} managerId - 매니저 ID
 * @param {string} repoId - HuggingFace 리포지토리 ID (user/repo-name 또는 repo-name)
 * @param {string} [filename] - 업로드할 파일명 (미지정시 자동 생성)
 * @param {boolean} [isPrivate=false] - 프라이빗 리포지토리 여부
 * @param {string} [hfUserId] - HuggingFace 사용자 ID (미지정시 설정값 사용)
 * @param {string} [hubToken] - HuggingFace Hub 토큰 (미지정시 설정값 사용)
 * @returns {Promise<Object>} HuggingFace 업로드 결과
 */
export const uploadToHuggingFace = async (managerId, repoId, filename, isPrivate = false, hfUserId, hubToken) => {
    try {/* Lines 781-821 omitted */} catch (error) {/* Lines 822-824 omitted */}
};

/**
 * 컬럼 복사
 * @param {string} managerId - 매니저 ID
 * @param {string} sourceColumn - 복사할 원본 컬럼명
 * @param {string} newColumn - 새로운 컬럼명
 * @returns {Promise<Object>} 컬럼 복사 결과
 */
export const copyDatasetColumn = async (managerId, sourceColumn, newColumn) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (!sourceColumn || typeof sourceColumn !== 'string' || sourceColumn.trim() === '') {
            throw new Error('원본 컬럼명이 필요합니다.');
        }
        if (!newColumn || typeof newColumn !== 'string' || newColumn.trim() === '') {
            throw new Error('새로운 컬럼명이 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId,
            source_column: sourceColumn.trim(),
            new_column: newColumn.trim()
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/copy-column`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `컬럼 복사 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Column copied for manager ${managerId}, '${sourceColumn}' → '${newColumn}':`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to copy column for manager ${managerId}, '${sourceColumn}' → '${newColumn}':`, error);
        throw error;
    }
};

/**
 * 컬럼 이름 변경
 * @param {string} managerId - 매니저 ID
 * @param {string} oldName - 기존 컬럼명
 * @param {string} newName - 새로운 컬럼명
 * @returns {Promise<Object>} 컬럼 이름 변경 결과
 */
export const renameDatasetColumn = async (managerId, oldName, newName) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (!oldName || typeof oldName !== 'string' || oldName.trim() === '') {
            throw new Error('기존 컬럼명이 필요합니다.');
        }
        if (!newName || typeof newName !== 'string' || newName.trim() === '') {
            throw new Error('새로운 컬럼명이 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId,
            old_name: oldName.trim(),
            new_name: newName.trim()
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/rename-column`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `컬럼 이름 변경 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Column renamed for manager ${managerId}, '${oldName}' → '${newName}':`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to rename column for manager ${managerId}, '${oldName}' → '${newName}':`, error);
        throw error;
    }
};
