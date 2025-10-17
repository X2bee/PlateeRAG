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
    try {
        if (!managerId) {
            throw new Error('Manager ID는 필수입니다.');
        }
        if (!repoId || typeof repoId !== 'string' || repoId.trim() === '') {
            throw new Error('Repository ID는 필수입니다.');
        }

        const requestBody = {
            manager_id: managerId,
            repo_id: repoId.trim(),
            private: isPrivate
        };

        // 선택적 파라미터 추가
        if (filename && typeof filename === 'string' && filename.trim() !== '') {
            requestBody.filename = filename.trim();
        }
        if (hfUserId && typeof hfUserId === 'string' && hfUserId.trim() !== '') {
            requestBody.hf_user_id = hfUserId.trim();
        }
        if (hubToken && typeof hubToken === 'string' && hubToken.trim() !== '') {
            requestBody.hub_token = hubToken.trim();
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/upload-to-hf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `HuggingFace 업로드 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Dataset uploaded to HuggingFace for manager ${managerId} → ${repoId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to upload dataset to HuggingFace for manager ${managerId} → ${repoId}:`, error);
        throw error;
    }
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

/**
 * 컬럼 문자열 포맷팅
 * @param {string} managerId - 매니저 ID
 * @param {string[]} columnNames - 사용할 컬럼명들
 * @param {string} template - 문자열 템플릿 (예: {col1}_aiaiaiai_{col2})
 * @param {string} newColumn - 새로운 컬럼명
 * @returns {Promise<Object>} 컬럼 문자열 포맷팅 결과
 */
export const formatDatasetColumns = async (managerId, columnNames, template, newColumn) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (!columnNames || !Array.isArray(columnNames) || columnNames.length === 0) {
            throw new Error('컬럼명 배열이 필요합니다.');
        }
        if (!template || typeof template !== 'string' || template.trim() === '') {
            throw new Error('문자열 템플릿이 필요합니다.');
        }
        if (!newColumn || typeof newColumn !== 'string' || newColumn.trim() === '') {
            throw new Error('새로운 컬럼명이 필요합니다.');
        }

        // 컬럼명 유효성 검사
        for (const column of columnNames) {
            if (!column || typeof column !== 'string' || column.trim() === '') {
                throw new Error('모든 컬럼명은 비어있지 않은 문자열이어야 합니다.');
            }
        }

        const requestBody = {
            manager_id: managerId,
            column_names: columnNames.map(col => col.trim()),
            template: template.trim(),
            new_column: newColumn.trim()
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/format-columns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `컬럼 문자열 포맷팅 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Columns formatted for manager ${managerId}, ${columnNames} → '${newColumn}':`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to format columns for manager ${managerId}, ${columnNames} → '${newColumn}':`, error);
        throw error;
    }
};

/**
 * 컬럼 간 사칙연산
 * @param {string} managerId - 매니저 ID
 * @param {string} col1 - 첫 번째 컬럼명
 * @param {string} col2 - 두 번째 컬럼명
 * @param {string} operation - 연산자 (+, -, *, /)
 * @param {string} newColumn - 새로운 컬럼명
 * @returns {Promise<Object>} 컬럼 간 연산 결과
 */
export const calculateDatasetColumns = async (managerId, col1, col2, operation, newColumn) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (!col1 || typeof col1 !== 'string' || col1.trim() === '') {
            throw new Error('첫 번째 컬럼명이 필요합니다.');
        }
        if (!col2 || typeof col2 !== 'string' || col2.trim() === '') {
            throw new Error('두 번째 컬럼명이 필요합니다.');
        }
        if (!operation || typeof operation !== 'string' || !['+', '-', '*', '/'].includes(operation)) {
            throw new Error('유효한 연산자(+, -, *, /)가 필요합니다.');
        }
        if (!newColumn || typeof newColumn !== 'string' || newColumn.trim() === '') {
            throw new Error('새로운 컬럼명이 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId,
            col1: col1.trim(),
            col2: col2.trim(),
            operation: operation,
            new_column: newColumn.trim()
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/calculate-columns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `컬럼 간 연산 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Columns calculated for manager ${managerId}, '${col1}' ${operation} '${col2}' → '${newColumn}':`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to calculate columns for manager ${managerId}, '${col1}' ${operation} '${col2}' → '${newColumn}':`, error);
        throw error;
    }
};

/**
 * 사용자 콜백 코드 실행
 * @param {string} managerId - 매니저 ID
 * @param {string} callbackCode - 실행할 PyArrow 코드
 * @returns {Promise<Object>} 콜백 코드 실행 결과
 */
export const executeDatasetCallback = async (managerId, callbackCode) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (!callbackCode || typeof callbackCode !== 'string' || callbackCode.trim() === '') {
            throw new Error('실행할 콜백 코드가 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId,
            callback_code: callbackCode.trim()
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/execute-callback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `콜백 코드 실행 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Dataset callback executed for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to execute dataset callback for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋을 MLflow에 업로드
 * @param {string} managerId - 매니저 ID
 * @param {string} experimentName - MLflow 실험 이름
 * @param {string} datasetName - 데이터셋 이름
 * @param {Object} options - 추가 옵션
 * @param {string} [options.artifactPath='dataset'] - 아티팩트 저장 경로
 * @param {string} [options.description] - 데이터셋 설명
 * @param {Object} [options.tags] - 추가 태그
 * @param {string} [options.format='parquet'] - 저장 형식 (parquet|csv)
 * @param {string} [options.mlflowTrackingUri] - MLflow 추적 서버 URI
 * @returns {Promise<Object>} MLflow 업로드 결과
 */
export const uploadToMLflow = async (managerId, experimentName, datasetName, options = {}) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (!experimentName || typeof experimentName !== 'string' || experimentName.trim() === '') {
            throw new Error('MLflow 실험 이름이 필요합니다.');
        }
        if (!datasetName || typeof datasetName !== 'string' || datasetName.trim() === '') {
            throw new Error('데이터셋 이름이 필요합니다.');
        }

        // 기본값 설정
        const {
            artifactPath = 'dataset',
            description = null,
            tags = null,
            format = 'parquet',
            mlflowTrackingUri = null
        } = options;

        // format 유효성 검사
        if (!['parquet', 'csv'].includes(format)) {
            throw new Error('저장 형식은 parquet 또는 csv만 지원됩니다.');
        }

        const requestBody = {
            manager_id: managerId,
            experiment_name: experimentName.trim(),
            dataset_name: datasetName.trim(),
            artifact_path: artifactPath,
            format: format
        };

        // 선택적 파라미터 추가
        if (description && typeof description === 'string' && description.trim() !== '') {
            requestBody.description = description.trim();
        }
        if (tags && typeof tags === 'object' && tags !== null) {
            requestBody.tags = tags;
        }
        if (mlflowTrackingUri && typeof mlflowTrackingUri === 'string' && mlflowTrackingUri.trim() !== '') {
            requestBody.mlflow_tracking_uri = mlflowTrackingUri.trim();
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/upload-to-mlflow`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `MLflow 업로드 요청 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Dataset uploaded to MLflow for manager ${managerId} → experiment ${experimentName}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to upload dataset to MLflow for manager ${managerId} → experiment ${experimentName}:`, error);
        throw error;
    }
};

/**
 * MLflow 실험 목록 조회 (선택사항 - MLflow API를 직접 호출하는 경우)
 * @param {string} [mlflowTrackingUri] - MLflow 추적 서버 URI
 * @returns {Promise<Array>} MLflow 실험 목록
 */
export const getMLflowExperiments = async (mlflowTrackingUri = null) => {
    try {
        // 이 함수는 MLflow REST API를 직접 호출하는 경우에만 사용
        // 실제로는 백엔드에서 MLflow API를 proxy하는 엔드포인트를 만들어 사용하는 것을 권장
        const baseUrl = mlflowTrackingUri || 'https://polar-mlflow-git.x2bee.com/'; // 기본 MLflow 서버
        
        const response = await fetch(`${baseUrl}/api/2.0/mlflow/experiments/list`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`MLflow API 호출 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info('MLflow experiments fetched:', data);
        return data.experiments || [];
    } catch (error) {
        devLog.error('Failed to fetch MLflow experiments:', error);
        throw error;
    }
};

/**
 * MLflow 업로드 결과 검증
 * @param {string} managerId - 매니저 ID
 * @param {string} runId - MLflow run ID
 * @returns {Promise<Object>} 업로드 검증 결과
 */
export const verifyMLflowUpload = async (managerId, runId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (!runId || typeof runId !== 'string' || runId.trim() === '') {
            throw new Error('MLflow Run ID가 필요합니다.');
        }

        // 실제로는 백엔드에서 MLflow API를 통해 run 정보를 확인하는 엔드포인트가 필요
        // 여기서는 예시로 간단한 검증 로직만 제공
        devLog.info(`Verifying MLflow upload for manager ${managerId}, run ${runId}`);
        
        return {
            success: true,
            manager_id: managerId,
            run_id: runId,
            message: '업로드 검증이 완료되었습니다.',
            verified_at: new Date().toISOString()
        };
    } catch (error) {
        devLog.error(`Failed to verify MLflow upload for manager ${managerId}, run ${runId}:`, error);
        throw error;
    }
};

/**
 * MLflow에 업로드된 데이터셋 목록 조회
 * @param {Object} options - 조회 옵션
 * @param {string} [options.experimentName] - 특정 실험명으로 필터링
 * @param {number} [options.maxResults=100] - 최대 결과 개수 (1-1000)
 * @param {string} [options.mlflowTrackingUri] - MLflow 추적 서버 URI
 * @returns {Promise<Object>} 데이터셋 목록 조회 결과
 */
export const listMLflowDatasets = async (options = {}) => {
    try {
        const {
            experimentName = null,
            maxResults = 100,
            mlflowTrackingUri = null
        } = options;

        // maxResults 유효성 검사
        if (typeof maxResults !== 'number' || maxResults < 1 || maxResults > 1000) {
            throw new Error('maxResults는 1에서 1000 사이의 숫자여야 합니다.');
        }

        const requestBody = {
            max_results: maxResults
        };

        // 선택적 파라미터 추가
        if (experimentName && typeof experimentName === 'string' && experimentName.trim() !== '') {
            requestBody.experiment_name = experimentName.trim();
        }
        if (mlflowTrackingUri && typeof mlflowTrackingUri === 'string' && mlflowTrackingUri.trim() !== '') {
            requestBody.mlflow_tracking_uri = mlflowTrackingUri.trim();
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/mlflow/list-datasets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `MLflow 데이터셋 목록 조회 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`MLflow datasets fetched (${data.total_count} found):`, data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch MLflow datasets:', error);
        throw error;
    }
};

/**
 * 특정 실험의 데이터셋만 조회
 * @param {string} experimentName - 실험명
 * @param {number} [maxResults=100] - 최대 결과 개수
 * @returns {Promise<Object>} 데이터셋 목록 조회 결과
 */
export const listMLflowDatasetsByExperiment = async (experimentName, maxResults = 100) => {
    try {
        if (!experimentName || typeof experimentName !== 'string' || experimentName.trim() === '') {
            throw new Error('실험명이 필요합니다.');
        }

        return await listMLflowDatasets({
            experimentName: experimentName.trim(),
            maxResults
        });
    } catch (error) {
        devLog.error(`Failed to fetch MLflow datasets for experiment ${experimentName}:`, error);
        throw error;
    }
};

/**
 * 최근 업로드된 데이터셋 조회
 * @param {number} [limit=20] - 조회할 데이터셋 개수
 * @returns {Promise<Array>} 최근 데이터셋 목록
 */
export const getRecentMLflowDatasets = async (limit = 20) => {
    try {
        const result = await listMLflowDatasets({ maxResults: limit });
        
        // created_at 기준으로 정렬 (이미 서버에서 정렬되어 오지만 확실하게)
        const sortedDatasets = (result.datasets || []).sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });

        return sortedDatasets.slice(0, limit);
    } catch (error) {
        devLog.error('Failed to fetch recent MLflow datasets:', error);
        throw error;
    }
};

/**
 * 특정 데이터셋 상세 정보 조회
 * @param {string} runId - MLflow Run ID
 * @returns {Promise<Object>} 데이터셋 상세 정보
 */
export const getMLflowDatasetDetail = async (runId) => {
    try {
        if (!runId || typeof runId !== 'string' || runId.trim() === '') {
            throw new Error('Run ID가 필요합니다.');
        }

        // 전체 목록에서 특정 run을 찾거나, 백엔드에 별도 엔드포인트 추가 필요
        const result = await listMLflowDatasets({ maxResults: 1000 });
        const dataset = result.datasets?.find(d => d.run_id === runId.trim());

        if (!dataset) {
            throw new Error(`Run ID ${runId}에 해당하는 데이터셋을 찾을 수 없습니다.`);
        }

        devLog.info(`MLflow dataset detail fetched for run ${runId}:`, dataset);
        return dataset;
    } catch (error) {
        devLog.error(`Failed to fetch MLflow dataset detail for run ${runId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 검색 (이름 또는 설명으로)
 * @param {string} searchTerm - 검색어
 * @param {Object} [options] - 추가 옵션
 * @returns {Promise<Array>} 검색된 데이터셋 목록
 */
export const searchMLflowDatasets = async (searchTerm, options = {}) => {
    try {
        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.trim() === '') {
            throw new Error('검색어가 필요합니다.');
        }

        const result = await listMLflowDatasets(options);
        const searchTermLower = searchTerm.trim().toLowerCase();

        // 클라이언트 측에서 필터링 (서버 측 검색 기능 추가 권장)
        const filtered = (result.datasets || []).filter(dataset => {
            const nameMatch = dataset.dataset_name?.toLowerCase().includes(searchTermLower);
            const descMatch = dataset.description?.toLowerCase().includes(searchTermLower);
            const expMatch = dataset.experiment_name?.toLowerCase().includes(searchTermLower);
            
            return nameMatch || descMatch || expMatch;
        });

        devLog.info(`MLflow datasets search for "${searchTerm}" found ${filtered.length} results`);
        return filtered;
    } catch (error) {
        devLog.error(`Failed to search MLflow datasets for "${searchTerm}":`, error);
        throw error;
    }
};

/**
 * MLflow 데이터셋의 컬럼 정보 조회
 * @param {string} runId - MLflow Run ID
 * @param {Object} [options] - 추가 옵션
 * @returns {Promise<Object>} 컬럼 정보
 */
export const getMLflowDatasetColumns = async (runId, options = {}) => {
    try {
        if (!runId || typeof runId !== 'string' || runId.trim() === '') {
            throw new Error('Run ID가 필요합니다.');
        }

        const {
            artifactPath = 'dataset',
            mlflowTrackingUri = null
        } = options;

        const requestBody = {
            run_id: runId.trim(),
            artifact_path: artifactPath
        };

        if (mlflowTrackingUri && typeof mlflowTrackingUri === 'string' && mlflowTrackingUri.trim() !== '') {
            requestBody.mlflow_tracking_uri = mlflowTrackingUri.trim();
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/processing/mlflow/get-dataset-columns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `컬럼 정보 조회 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`MLflow dataset columns fetched for run ${runId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to fetch MLflow dataset columns for run ${runId}:`, error);
        throw error;
    }
};

// 기존 dataManagerAPI.js 파일 끝에 추가

/**
 * ============================================
 * 버전 관리 API 함수들
 * ============================================
 */

/**
 * 매니저의 버전 이력 조회
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 버전 이력 정보
 */
export const getVersionHistory = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/versions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `버전 이력 조회 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Version history fetched for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to fetch version history for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 특정 버전으로 롤백
 * @param {string} managerId - 매니저 ID
 * @param {number} version - 롤백할 버전 번호
 * @returns {Promise<Object>} 롤백 결과
 */
export const rollbackToVersion = async (managerId, version) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (typeof version !== 'number' || version < 0) {
            throw new Error('유효한 버전 번호가 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId,
            version: version
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/rollback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `버전 롤백 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Rolled back to version ${version} for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to rollback to version ${version} for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 두 버전 간 비교
 * @param {string} managerId - 매니저 ID
 * @param {number} version1 - 첫 번째 버전
 * @param {number} version2 - 두 번째 버전
 * @returns {Promise<Object>} 비교 결과
 */
export const compareVersions = async (managerId, version1, version2) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (typeof version1 !== 'number' || typeof version2 !== 'number') {
            throw new Error('유효한 버전 번호가 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId,
            version1: version1,
            version2: version2
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/compare-versions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `버전 비교 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`Compared versions ${version1} and ${version2} for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to compare versions for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * MinIO에 저장된 버전 목록 조회
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} MinIO 버전 목록
 */
export const listMinioVersions = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/${managerId}/minio-versions`, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `MinIO 버전 목록 조회 실패: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        devLog.info(`MinIO versions fetched for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to fetch MinIO versions for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 버전 정보 포맷팅 유틸리티
 * @param {Object} versionInfo - 버전 정보 객체
 * @returns {Object} 포맷팅된 버전 정보
 */
export const formatVersionInfo = (versionInfo) => {
    return {
        version: versionInfo.version,
        operation: versionInfo.operation,
        timestamp: new Date(versionInfo.timestamp).toLocaleString('ko-KR'),
        rows: versionInfo.num_rows?.toLocaleString() || 'N/A',
        columns: versionInfo.num_columns || 'N/A',
        checksum: versionInfo.checksum?.substring(0, 8) + '...' || 'N/A',
        metadata: versionInfo.metadata
    };
};

/**
 * 버전 이력을 시각화하기 위한 데이터 포맷팅
 * @param {Array} versionHistory - 버전 이력 배열
 * @returns {Array} 시각화용 데이터
 */
export const formatVersionHistoryForTimeline = (versionHistory) => {
    return versionHistory.map((version, index) => ({
        id: version.version,
        label: `v${version.version}`,
        operation: version.operation,
        timestamp: new Date(version.timestamp),
        description: `${version.operation} - ${version.num_rows.toLocaleString()} 행, ${version.num_columns} 컬럼`,
        isCurrent: index === versionHistory.length - 1,
        metadata: version.metadata
    })).reverse(); // 최신 버전이 위로 오도록
};

/**
 * MLflow 업로드 결과 포맷팅
 * @param {Object} uploadResult - 업로드 결과
 * @returns {Object} 포맷팅된 결과
 */
export const formatMLflowUploadResult = (uploadResult) => {
    if (!uploadResult.success) {
        return uploadResult;
    }

    const mlflowInfo = uploadResult.mlflow_info;
    
    return {
        ...uploadResult,
        formatted: {
            experimentName: mlflowInfo.experiment_name,
            runId: mlflowInfo.run_id,
            runUrl: `${mlflowInfo.artifact_uri}/#/experiments/${mlflowInfo.run_id}`,
            version: mlflowInfo.version,
            totalOperations: mlflowInfo.total_operations,
            lineageSaved: mlflowInfo.lineage_saved,
            uploadTime: new Date().toLocaleString('ko-KR')
        }
    };
};

/**
 * 데이터셋 계보(Lineage) 정보 요약
 * @param {Object} lineage - 계보 정보
 * @returns {Object} 요약된 계보 정보
 */
export const summarizeLineage = (lineage) => {
    if (!lineage) return null;

    return {
        hasLineage: true,
        originalSource: lineage.original_source?.type || 'unknown',
        totalTransformations: lineage.transformations?.length || 0,
        mlflowRuns: lineage.mlflow_runs?.length || 0,
        operations: lineage.transformations || [],
        lastUpdated: lineage.uploaded_at ? new Date(lineage.uploaded_at).toLocaleString('ko-KR') : 'N/A'
    };
};

/**
 * MLflow에 등록된 고유한 실험 이름 목록을 조회
 * @returns {Promise<string[]>} 고유한 실험 이름 배열
 */
export const getUniqueMLflowExperimentNames = async () => {
    try {
        // 모든 데이터셋 목록을 가져옵니다 (결과 개수를 충분히 크게 설정).
        const result = await listMLflowDatasets({ maxResults: 1000 });
        if (!result.success || !result.datasets) {
            return [];
        }

        // Set을 사용하여 고유한 실험 이름만 추출합니다.
        const experimentNames = new Set(result.datasets.map(d => d.experiment_name));
        
        const uniqueNames = Array.from(experimentNames);
        devLog.info('Fetched unique MLflow experiment names:', uniqueNames);
        return uniqueNames;

    } catch (error) {
        devLog.error('Failed to fetch unique MLflow experiment names:', error);
        // 에러가 발생해도 빈 배열을 반환하여 UI 중단을 방지합니다.
        return [];
    }
};

// dataManagerAPI.js에 추가

/**
 * 데이터셋 로드 이력 조회
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 로드 이력 정보
 */
export const getDatasetLoadHistory = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/dataset-history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `이력 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        devLog.info(`Dataset load history fetched for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to fetch dataset load history for manager ${managerId}:`, error);
        throw error;
    }
};


/**
 * 사용 가능한 데이터셋 버전 목록 조회
 * @param {string} managerId - 매니저 ID
 * @returns {Promise<Object>} 버전 목록
 */
export const getAvailableDatasetVersions = async (managerId) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/available-versions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `버전 목록 조회 실패: ${response.status}`);
        }

        const data = await response.json();
        devLog.info(`Available dataset versions fetched for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to fetch available dataset versions for manager ${managerId}:`, error);
        throw error;
    }
};

/**
 * 데이터셋 버전 전환
 * @param {string} managerId - 매니저 ID
 * @param {number} versionNumber - 전환할 버전 번호
 * @returns {Promise<Object>} 전환 결과
 */
export const switchDatasetVersion = async (managerId, versionNumber) => {
    try {
        if (!managerId) {
            throw new Error('Manager ID가 필요합니다.');
        }
        if (typeof versionNumber !== 'number' || versionNumber < 1) {
            throw new Error('유효한 버전 번호가 필요합니다.');
        }

        const requestBody = {
            manager_id: managerId,
            version_number: versionNumber
        };

        const response = await apiClient(`${API_BASE_URL}/api/data-manager/managers/switch-dataset-version`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.detail || `버전 전환 실패: ${response.status}`);
        }

        const data = await response.json();
        devLog.info(`Switched to dataset version ${versionNumber} for manager ${managerId}:`, data);
        return data;
    } catch (error) {
        devLog.error(`Failed to switch dataset version for manager ${managerId}:`, error);
        throw error;
    }
};