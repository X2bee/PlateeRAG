// Hugging Face API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

/**
 * Hugging Face 모델 목록을 가져오는 함수
 * @returns {Promise<Object>} Hugging Face 모델 목록
 */
export const getHuggingFaceModels = async () => {
    try {
        devLog.info('Fetching Hugging Face models...');

        const response = await apiClient(`${API_BASE_URL}/api/huggingface/models`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 404 에러 처리 (API 엔드포인트가 없거나 리소스가 없음)
            if (response.status === 404) {
                throw new Error('Hugging Face API가 설정되지 않았거나 사용할 수 없습니다. 서버 설정을 확인해주세요.');
            }

            // 422 에러 (설정 관련 에러) 처리
            if (response.status === 422) {
                let errorMessage = '';
                if (errorData.detail === 'HUGGING_FACE_USER_ID_NOT_CONFIGURED') {
                    errorMessage = 'Hugging Face 사용자 ID가 설정되지 않았습니다. 설정에서 HUGGING_FACE_USER_ID를 설정해주세요.';
                } else if (errorData.detail === 'HUGGING_FACE_HUB_TOKEN_NOT_CONFIGURED') {
                    errorMessage = 'Hugging Face 허브 토큰이 설정되지 않았습니다. 설정에서 HUGGING_FACE_HUB_TOKEN을 설정해주세요.';
                } else {
                    errorMessage = 'Hugging Face 설정이 올바르지 않습니다. 사용자 ID와 허브 토큰을 확인해주세요.';
                }
                throw new Error(errorMessage);
            }

            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Hugging Face models fetched successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Hugging Face models:', error);
        throw error;
    }
};

/**
 * Hugging Face 데이터셋 목록을 가져오는 함수
 * @returns {Promise<Object>} Hugging Face 데이터셋 목록
 */
export const getHuggingFaceDatasets = async () => {
    try {
        devLog.info('Fetching Hugging Face datasets...');

        const response = await apiClient(`${API_BASE_URL}/api/huggingface/datasets`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 404 에러 처리 (API 엔드포인트가 없거나 리소스가 없음)
            if (response.status === 404) {
                throw new Error('Hugging Face API가 설정되지 않았거나 사용할 수 없습니다. 서버 설정을 확인해주세요.');
            }

            // 422 에러 (설정 관련 에러) 처리
            if (response.status === 422) {
                let errorMessage = '';
                if (errorData.detail === 'HUGGING_FACE_USER_ID_NOT_CONFIGURED') {
                    errorMessage = 'Hugging Face 사용자 ID가 설정되지 않았습니다. 설정에서 HUGGING_FACE_USER_ID를 설정해주세요.';
                } else if (errorData.detail === 'HUGGING_FACE_HUB_TOKEN_NOT_CONFIGURED') {
                    errorMessage = 'Hugging Face 허브 토큰이 설정되지 않았습니다. 설정에서 HUGGING_FACE_HUB_TOKEN을 설정해주세요.';
                } else {
                    errorMessage = 'Hugging Face 설정이 올바르지 않습니다. 사용자 ID와 허브 토큰을 확인해주세요.';
                }
                throw new Error(errorMessage);
            }

            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Hugging Face datasets fetched successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch Hugging Face datasets:', error);
        throw error;
    }
};

/**
 * Hugging Face 모델과 데이터셋을 모두 가져오는 함수
 * @returns {Promise<Object>} 모델과 데이터셋을 포함한 객체
 */
export const getAllHuggingFaceResources = async () => {
    try {
        devLog.info('Fetching all Hugging Face resources...');

        const [modelsResponse, datasetsResponse] = await Promise.allSettled([
            getHuggingFaceModels(),
            getHuggingFaceDatasets()
        ]);

        const result = {
            success: true,
            models: {
                success: modelsResponse.status === 'fulfilled',
                data: modelsResponse.status === 'fulfilled' ? modelsResponse.value : null,
                error: modelsResponse.status === 'rejected' ? modelsResponse.reason.message : null
            },
            datasets: {
                success: datasetsResponse.status === 'fulfilled',
                data: datasetsResponse.status === 'fulfilled' ? datasetsResponse.value : null,
                error: datasetsResponse.status === 'rejected' ? datasetsResponse.reason.message : null
            }
        };

        devLog.info('All Hugging Face resources fetched:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch all Hugging Face resources:', error);
        throw error;
    }
};

/**
 * 특정 Hugging Face 모델의 상세 정보를 가져오는 함수
 * @param {string} modelId - 모델 ID
 * @returns {Promise<Object>} 모델 상세 정보
 */
export const getHuggingFaceModelDetails = async (modelId) => {
    try {
        if (!modelId) {
            throw new Error('Model ID is required');
        }

        devLog.info(`Fetching Hugging Face model details for: ${modelId}`);

        // 먼저 모든 모델을 가져온 후 해당 모델을 찾습니다
        const modelsData = await getHuggingFaceModels();
        const model = modelsData.models?.find(m => m.id === modelId);

        if (!model) {
            throw new Error(`Model with ID '${modelId}' not found`);
        }

        devLog.info(`Hugging Face model details fetched for ${modelId}:`, model);
        return { model };
    } catch (error) {
        devLog.error(`Failed to fetch Hugging Face model details for ${modelId}:`, error);
        throw error;
    }
};

/**
 * 특정 Hugging Face 데이터셋의 상세 정보를 가져오는 함수
 * @param {string} datasetId - 데이터셋 ID
 * @returns {Promise<Object>} 데이터셋 상세 정보
 */
export const getHuggingFaceDatasetDetails = async (datasetId) => {
    try {
        if (!datasetId) {
            throw new Error('Dataset ID is required');
        }

        devLog.info(`Fetching Hugging Face dataset details for: ${datasetId}`);

        // 먼저 모든 데이터셋을 가져온 후 해당 데이터셋을 찾습니다
        const datasetsData = await getHuggingFaceDatasets();
        const dataset = datasetsData.datasets?.find(d => d.id === datasetId);

        if (!dataset) {
            throw new Error(`Dataset with ID '${datasetId}' not found`);
        }

        devLog.info(`Hugging Face dataset details fetched for ${datasetId}:`, dataset);
        return { dataset };
    } catch (error) {
        devLog.error(`Failed to fetch Hugging Face dataset details for ${datasetId}:`, error);
        throw error;
    }
};

/**
 * Hugging Face 모델 목록을 필터링하는 함수
 * @param {Object} filters - 필터 조건
 * @param {boolean} filters.privateOnly - private 모델만 가져올지 여부
 * @param {number} filters.minDownloads - 최소 다운로드 수
 * @param {string} filters.searchTerm - 검색어 (모델 ID에서 검색)
 * @returns {Promise<Object>} 필터링된 모델 목록
 */
export const getFilteredHuggingFaceModels = async (filters = {}) => {
    try {
        devLog.info('Fetching filtered Hugging Face models with filters:', filters);

        const modelsData = await getHuggingFaceModels();
        let filteredModels = modelsData.models || [];

        // private 모델 필터
        if (filters.privateOnly === true) {
            filteredModels = filteredModels.filter(model => model.private === true);
        } else if (filters.privateOnly === false) {
            filteredModels = filteredModels.filter(model => model.private === false);
        }

        // 최소 다운로드 수 필터
        if (filters.minDownloads && typeof filters.minDownloads === 'number') {
            filteredModels = filteredModels.filter(model =>
                (model.downloads || 0) >= filters.minDownloads
            );
        }

        // 검색어 필터
        if (filters.searchTerm && typeof filters.searchTerm === 'string') {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredModels = filteredModels.filter(model =>
                model.id.toLowerCase().includes(searchLower) ||
                (model.author && model.author.toLowerCase().includes(searchLower))
            );
        }

        const result = {
            models: filteredModels,
            total: filteredModels.length,
            filters: filters
        };

        devLog.info('Filtered Hugging Face models:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch filtered Hugging Face models:', error);
        throw error;
    }
};

/**
 * Hugging Face 데이터셋 목록을 필터링하는 함수
 * @param {Object} filters - 필터 조건
 * @param {boolean} filters.privateOnly - private 데이터셋만 가져올지 여부
 * @param {number} filters.minDownloads - 최소 다운로드 수
 * @param {string} filters.searchTerm - 검색어 (데이터셋 ID에서 검색)
 * @returns {Promise<Object>} 필터링된 데이터셋 목록
 */
export const getFilteredHuggingFaceDatasets = async (filters = {}) => {
    try {
        devLog.info('Fetching filtered Hugging Face datasets with filters:', filters);

        const datasetsData = await getHuggingFaceDatasets();
        let filteredDatasets = datasetsData.datasets || [];

        // private 데이터셋 필터
        if (filters.privateOnly === true) {
            filteredDatasets = filteredDatasets.filter(dataset => dataset.private === true);
        } else if (filters.privateOnly === false) {
            filteredDatasets = filteredDatasets.filter(dataset => dataset.private === false);
        }

        // 최소 다운로드 수 필터
        if (filters.minDownloads && typeof filters.minDownloads === 'number') {
            filteredDatasets = filteredDatasets.filter(dataset =>
                (dataset.downloads || 0) >= filters.minDownloads
            );
        }

        // 검색어 필터
        if (filters.searchTerm && typeof filters.searchTerm === 'string') {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredDatasets = filteredDatasets.filter(dataset =>
                dataset.id.toLowerCase().includes(searchLower) ||
                (dataset.author && dataset.author.toLowerCase().includes(searchLower))
            );
        }

        const result = {
            datasets: filteredDatasets,
            total: filteredDatasets.length,
            filters: filters
        };

        devLog.info('Filtered Hugging Face datasets:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch filtered Hugging Face datasets:', error);
        throw error;
    }
};

/**
 * Hugging Face 모델을 다운로드 수에 따라 정렬하여 가져오는 함수
 * @param {boolean} descending - 내림차순 정렬 여부 (기본값: true)
 * @param {number} limit - 반환할 모델 수 제한 (선택사항)
 * @returns {Promise<Object>} 정렬된 모델 목록
 */
export const getHuggingFaceModelsByPopularity = async (descending = true, limit = null) => {
    try {
        devLog.info(`Fetching Hugging Face models by popularity (descending: ${descending}, limit: ${limit})`);

        const modelsData = await getHuggingFaceModels();
        let sortedModels = (modelsData.models || []).sort((a, b) => {
            const downloadsA = a.downloads || 0;
            const downloadsB = b.downloads || 0;
            return descending ? downloadsB - downloadsA : downloadsA - downloadsB;
        });

        if (limit && typeof limit === 'number' && limit > 0) {
            sortedModels = sortedModels.slice(0, limit);
        }

        const result = {
            models: sortedModels,
            total: sortedModels.length,
            sorted_by: 'downloads',
            descending: descending,
            limit: limit
        };

        devLog.info('Hugging Face models by popularity fetched:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch Hugging Face models by popularity:', error);
        throw error;
    }
};

/**
 * Hugging Face 데이터셋을 다운로드 수에 따라 정렬하여 가져오는 함수
 * @param {boolean} descending - 내림차순 정렬 여부 (기본값: true)
 * @param {number} limit - 반환할 데이터셋 수 제한 (선택사항)
 * @returns {Promise<Object>} 정렬된 데이터셋 목록
 */
export const getHuggingFaceDatasetsByPopularity = async (descending = true, limit = null) => {
    try {
        devLog.info(`Fetching Hugging Face datasets by popularity (descending: ${descending}, limit: ${limit})`);

        const datasetsData = await getHuggingFaceDatasets();
        let sortedDatasets = (datasetsData.datasets || []).sort((a, b) => {
            const downloadsA = a.downloads || 0;
            const downloadsB = b.downloads || 0;
            return descending ? downloadsB - downloadsA : downloadsA - downloadsB;
        });

        if (limit && typeof limit === 'number' && limit > 0) {
            sortedDatasets = sortedDatasets.slice(0, limit);
        }

        const result = {
            datasets: sortedDatasets,
            total: sortedDatasets.length,
            sorted_by: 'downloads',
            descending: descending,
            limit: limit
        };

        devLog.info('Hugging Face datasets by popularity fetched:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch Hugging Face datasets by popularity:', error);
        throw error;
    }
};

/**
 * Hugging Face 리소스 통계 정보를 가져오는 함수
 * @returns {Promise<Object>} 통계 정보
 */
export const getHuggingFaceStats = async () => {
    try {
        devLog.info('Fetching Hugging Face statistics...');

        const resourcesData = await getAllHuggingFaceResources();

        const stats = {
            models: {
                total: 0,
                private: 0,
                public: 0,
                total_downloads: 0,
                average_downloads: 0
            },
            datasets: {
                total: 0,
                private: 0,
                public: 0,
                total_downloads: 0,
                average_downloads: 0
            },
            last_updated: new Date().toISOString()
        };

        // 모델 통계
        if (resourcesData.models.success && resourcesData.models.data?.models) {
            const models = resourcesData.models.data.models;
            stats.models.total = models.length;
            stats.models.private = models.filter(m => m.private).length;
            stats.models.public = models.filter(m => !m.private).length;
            stats.models.total_downloads = models.reduce((sum, m) => sum + (m.downloads || 0), 0);
            stats.models.average_downloads = stats.models.total > 0
                ? Math.round(stats.models.total_downloads / stats.models.total)
                : 0;
        }

        // 데이터셋 통계
        if (resourcesData.datasets.success && resourcesData.datasets.data?.datasets) {
            const datasets = resourcesData.datasets.data.datasets;
            stats.datasets.total = datasets.length;
            stats.datasets.private = datasets.filter(d => d.private).length;
            stats.datasets.public = datasets.filter(d => !d.private).length;
            stats.datasets.total_downloads = datasets.reduce((sum, d) => sum + (d.downloads || 0), 0);
            stats.datasets.average_downloads = stats.datasets.total > 0
                ? Math.round(stats.datasets.total_downloads / stats.datasets.total)
                : 0;
        }

        devLog.info('Hugging Face statistics calculated:', stats);
        return stats;
    } catch (error) {
        devLog.error('Failed to fetch Hugging Face statistics:', error);
        throw error;
    }
};
