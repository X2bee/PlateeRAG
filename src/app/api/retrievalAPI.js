// RAG API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config.js';
import { apiClient } from '@/app/api/apiClient';

// =============================================================================
// Health Check
// =============================================================================

/**
 * RAG 시스템의 연결 상태를 확인하는 함수
 * @returns {Promise<Object>} 헬스 체크 결과
 */
export const checkRagHealth = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/health`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('RAG health check completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to check RAG health:', error);
        throw error;
    }
};

// =============================================================================
// Collection Management
// =============================================================================

/**
 * 모든 컬렉션 목록을 조회하는 함수
 * @returns {Promise<Object>} 컬렉션 목록
 */
export const listCollections = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Collections fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch collections:', error);
        throw error;
    }
};

/**
 * 새 컬렉션을 생성하는 함수
 * @param {string} collectionMakeName - 컬렉션 이름
 * @param {string} distance - 거리 메트릭 ("Cosine", "Euclidean", "Dot")
 * @param {string} description - 컬렉션 설명 (선택사항)
 * @param {Object} metadata - 커스텀 메타데이터 (선택사항)
 * @returns {Promise<Object>} 생성된 컬렉션 정보
 */
export const createCollection = async (
    collectionMakeName,
    distance = 'Cosine',
    description = null,
    metadata = null,
) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_make_name: collectionMakeName,
                    distance: distance,
                    description: description,
                    metadata: metadata,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Collection created:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to create collection:', error);
        throw error;
    }
};

/**
 * 컬렉션을 삭제하는 함수
 * @param {string} collectionName - 삭제할 컬렉션 이름
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteCollection = async (collectionName) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_name: collectionName,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Collection deleted:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete collection:', error);
        throw error;
    }
};

/**
 * 특정 컬렉션의 정보를 조회하는 함수
 * @param {string} collectionName - 조회할 컬렉션 이름
 * @returns {Promise<Object>} 컬렉션 정보
 */
export const getCollectionInfo = async (collectionName) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/${collectionName}`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Collection info fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch collection info:', error);
        throw error;
    }
};

// =============================================================================
// Document Management
// =============================================================================

/**
 * 문서를 업로드하고 처리하는 함수
 * @param {File} file - 업로드할 파일
 * @param {string} collectionName - 대상 컬렉션 이름
 * @param {number} chunkSize - 청크 크기 (기본값: 1000)
 * @param {number} chunkOverlap - 청크 겹침 크기 (기본값: 200)
 * @param {Object} metadata - 문서 메타데이터 (선택사항)
 * @returns {Promise<Object>} 업로드 결과
 */
export const uploadDocument = async (
    file,
    collectionName,
    chunkSize = 1000,
    chunkOverlap = 200,
    metadata = null,
) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collection_name', collectionName);
        formData.append('chunk_size', chunkSize.toString());
        formData.append('chunk_overlap', chunkOverlap.toString());

        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const response = await fetch(
            `${API_BASE_URL}/api/retrieval/documents/upload`,
            {
                method: 'POST',
                body: formData,
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Document uploaded:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to upload document:', error);
        throw error;
    }
};

/**
 * 문서를 검색하는 함수
 * @param {string} collectionName - 검색할 컬렉션 이름
 * @param {string} queryText - 검색 쿼리 텍스트
 * @param {number} limit - 반환할 결과 수 (기본값: 5)
 * @param {number} scoreThreshold - 점수 임계값 (기본값: 0.7)
 * @param {Object} filter - 검색 필터 (선택사항)
 * @returns {Promise<Object>} 검색 결과
 */
export const searchDocuments = async (
    collectionName,
    queryText,
    limit = 5,
    scoreThreshold = 0.7,
    filter = null,
) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/documents/search`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_name: collectionName,
                    query_text: queryText,
                    limit: limit,
                    score_threshold: scoreThreshold,
                    filter: filter,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Document search completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to search documents:', error);
        throw error;
    }
};

/**
 * 컬렉션 내 모든 문서 목록을 조회하는 함수
 * @param {string} collectionName - 컬렉션 이름
 * @returns {Promise<Object>} 문서 목록
 */
export const listDocumentsInCollection = async (collectionName) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Documents in collection fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch documents in collection:', error);
        throw error;
    }
};

/**
 * 특정 문서의 상세 정보를 조회하는 함수
 * @param {string} collectionName - 컬렉션 이름
 * @param {string} documentId - 문서 ID
 * @returns {Promise<Object>} 문서 상세 정보
 */
export const getDocumentDetails = async (collectionName, documentId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents/${documentId}`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Document details fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch document details:', error);
        throw error;
    }
};

/**
 * 컬렉션에서 특정 문서를 삭제하는 함수
 * @param {string} collectionName - 컬렉션 이름
 * @param {string} documentId - 삭제할 문서 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteDocumentFromCollection = async (
    collectionName,
    documentId,
) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents/${documentId}`,
            {
                method: 'DELETE',
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Document deleted from collection:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete document from collection:', error);
        throw error;
    }
};

// =============================================================================
// Vector Operations (Legacy Support)
// =============================================================================

/**
 * 벡터 포인트를 삽입하는 함수
 * @param {string} collectionName - 대상 컬렉션 이름
 * @param {Array} points - 삽입할 포인트 배열
 * @returns {Promise<Object>} 삽입 결과
 */
export const insertPoints = async (collectionName, points) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/points`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_name: collectionName,
                    points: points,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Points inserted:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to insert points:', error);
        throw error;
    }
};

/**
 * 벡터 포인트를 삭제하는 함수
 * @param {string} collectionName - 대상 컬렉션 이름
 * @param {Array} pointIds - 삭제할 포인트 ID 배열
 * @returns {Promise<Object>} 삭제 결과
 */
export const deletePoints = async (collectionName, pointIds) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/points`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_name: collectionName,
                    point_ids: pointIds,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Points deleted:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete points:', error);
        throw error;
    }
};

/**
 * 벡터 유사도 검색을 수행하는 함수
 * @param {string} collectionName - 검색할 컬렉션 이름
 * @param {Array<number>} queryVector - 검색 벡터
 * @param {number} limit - 반환할 결과 수 (기본값: 10)
 * @param {number} scoreThreshold - 점수 임계값 (선택사항)
 * @param {Object} filter - 검색 필터 (선택사항)
 * @returns {Promise<Object>} 검색 결과
 */
export const searchPoints = async (
    collectionName,
    queryVector,
    limit = 10,
    scoreThreshold = null,
    filter = null,
) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/search`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_name: collectionName,
                    query: {
                        vector: queryVector,
                        limit: limit,
                        score_threshold: scoreThreshold,
                        filter: filter,
                    },
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Points search completed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to search points:', error);
        throw error;
    }
};

// =============================================================================
// Configuration
// =============================================================================

/**
 * RAG 시스템 설정을 조회하는 함수
 * @returns {Promise<Object>} RAG 설정 정보
 */
export const getRagConfig = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/config`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('RAG config fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch RAG config:', error);
        throw error;
    }
};

// =============================================================================
// Utility Functions
// =============================================================================
/**
 * 컬렉션 이름의 유효성을 검사하는 함수
 * @param {string} name - 컬렉션 이름
 * @returns {boolean} 유효성 여부
 */
export const isValidCollectionName = (name) => {
    // 한글, 영문, 숫자, 언더스코어, 하이픈만 허용 (3~63자)
    const regex = /^[\uAC00-\uD7A3a-zA-Z0-9_-]+$/;
    return regex.test(name);
};

/**
 * 임베딩 제공자 이름을 한국어로 변환하는 함수
 * @param {string} provider - 제공자 이름
 * @returns {string} 한국어 제공자 이름
 */
export const getProviderDisplayName = (provider) => {
    const providerNames = {
        openai: 'OpenAI',
        huggingface: 'HuggingFace',
        custom_http: '커스텀 HTTP',
        local: '로컬',
    };
    return providerNames[provider?.toLowerCase()] || provider;
};

/**
 * 파일 확장자에서 MIME 타입을 추출하는 함수
 * @param {string} filename - 파일명
 * @returns {string} MIME 타입
 */
export const getMimeTypeFromFilename = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
        pdf: 'application/pdf',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        doc: 'application/msword',
        txt: 'text/plain',
    };
    return mimeTypes[extension] || 'application/octet-stream';
};

/**
 * 바이트 크기를 사람이 읽기 쉬운 형태로 변환하는 함수
 * @param {number} bytes - 바이트 크기
 * @param {number} decimals - 소수점 자릿수
 * @returns {string} 포맷된 크기 문자열
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * 날짜를 상대적 시간으로 표시하는 함수
 * @param {string} dateString - ISO 날짜 문자열
 * @returns {string} 상대적 시간 문자열
 */
export const getRelativeTime = (dateString) => {
    if (!dateString) return '알 수 없음';

    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
        return '방금 전';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}시간 전`;
    } else {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days}일 전`;
    }
};

/**
 * 임베딩 모델명에 따른 벡터 차원을 자동으로 반환하는 함수
 * @param {string} provider - 임베딩 제공자 ('openai', 'huggingface', 'custom_http')
 * @param {string} model - 모델명
 * @returns {number} 벡터 차원
 */
export const getEmbeddingDimension = (provider, model) => {
    if (!provider || !model) return 1536; // 기본값

    switch (provider.toLowerCase()) {
        case 'openai':
            switch (model) {
                case 'text-embedding-3-large':
                    return 3072;
                case 'text-embedding-3-small':
                case 'text-embedding-ada-002':
                default:
                    return 1536;
            }

        case 'huggingface': {
            const commonModels = {
                'sentence-transformers/all-MiniLM-L6-v2': 384,
                'sentence-transformers/all-MiniLM-L12-v2': 384,
                'sentence-transformers/all-mpnet-base-v2': 768,
                'sentence-transformers/all-distilroberta-v1': 768,
                'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2': 384,
                'BAAI/bge-large-en-v1.5': 1024,
                'BAAI/bge-base-en-v1.5': 768,
                'BAAI/bge-small-en-v1.5': 384,
                'Qwen/Qwen3-Embedding-0.6B': 1024,
            };
            return commonModels[model] || 768; // 일반적인 기본값
        }

        case 'custom_http':
        case 'vllm':
            // VLLM은 모델에 따라 다르므로 일반적인 기본값 반환
            return 1536;

        default:
            return 1536;
    }
};

/**
 * 현재 설정된 임베딩 제공자와 모델에 따른 벡터 차원을 조회하는 함수
 * @returns {Promise<Object>} 벡터 차원 정보
 */
export const getCurrentEmbeddingDimension = async (provider, model) => {
    try {
        const dimension = getEmbeddingDimension(provider, model);
        return {
            provider,
            model,
            dimension,
            auto_detected: true,
        };
    } catch (error) {
        devLog.error('Failed to get current embedding dimension:', error);
        return {
            provider: 'openai',
            model: 'text-embedding-3-small',
            dimension: 1536,
            auto_detected: false,
            error: error.message,
        };
    }
};

// /**
//  * 현재 설정된 임베딩 제공자와 모델에 따른 벡터 차원을 조회하는 함수
//  * @returns {Promise<Object>} 벡터 차원 정보
//  */
// export const getCurrentEmbeddingDimension = async () => {
//     try {
//         const status = await getEmbeddingStatus();

//         if (status && status.provider_info) {
//             const provider = status.provider_info.provider || 'openai';
//             const model = status.provider_info.model || 'text-embedding-3-small';
//             const dimension = getEmbeddingDimension(provider, model);

//             return {
//                 provider,
//                 model,
//                 dimension,
//                 auto_detected: true
//             };
//         }

//         return {
//             provider: 'openai',
//             model: 'text-embedding-3-small',
//             dimension: 1536,
//             auto_detected: false
//         };
//     } catch (error) {
//         devLog.error('Failed to get current embedding dimension:', error);
//         return {
//             provider: 'openai',
//             model: 'text-embedding-3-small',
//             dimension: 1536,
//             auto_detected: false,
//             error: error.message
//         };
//     }
// };
