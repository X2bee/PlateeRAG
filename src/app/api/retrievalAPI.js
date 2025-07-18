// RAG API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/utils/logger';
import { API_BASE_URL } from '@/app/config.js';

// =============================================================================
// Health Check
// =============================================================================

/**
 * RAG 시스템의 연결 상태를 확인하는 함수
 * @returns {Promise<Object>} 헬스 체크 결과
 */
export const checkRagHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/retrieval/health`);

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/collections`);

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
 * @param {string} collectionName - 컬렉션 이름
 * @param {string} distance - 거리 메트릭 ("Cosine", "Euclidean", "Dot")
 * @param {string} description - 컬렉션 설명 (선택사항)
 * @param {Object} metadata - 커스텀 메타데이터 (선택사항)
 * @returns {Promise<Object>} 생성된 컬렉션 정보
 */
export const createCollection = async (collectionName, distance = "Cosine", description = null, metadata = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/retrieval/collections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collection_name: collectionName,
                distance: distance,
                description: description,
                metadata: metadata
            }),
        });

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/collections`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collection_name: collectionName
            }),
        });

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/collections/${collectionName}`);

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
 * @param {boolean} processChunks - 청크 처리 여부 (기본값: true)
 * @param {Object} metadata - 문서 메타데이터 (선택사항)
 * @returns {Promise<Object>} 업로드 결과
 */
export const uploadDocument = async (file, collectionName, chunkSize = 1000, chunkOverlap = 200, processChunks = true, metadata = null) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('collection_name', collectionName);
        formData.append('chunk_size', chunkSize.toString());
        formData.append('chunk_overlap', chunkOverlap.toString());
        formData.append('process_chunks', processChunks.toString());
        
        if (metadata) {
            formData.append('metadata', JSON.stringify(metadata));
        }

        const response = await fetch(`${API_BASE_URL}/api/retrieval/documents/upload`, {
            method: 'POST',
            body: formData,
        });

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
export const searchDocuments = async (collectionName, queryText, limit = 5, scoreThreshold = 0.7, filter = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/retrieval/documents/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collection_name: collectionName,
                query_text: queryText,
                limit: limit,
                score_threshold: scoreThreshold,
                filter: filter
            }),
        });

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents`);

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents/${documentId}`);

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
export const deleteDocumentFromCollection = async (collectionName, documentId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents/${documentId}`, {
            method: 'DELETE',
        });

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/points`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collection_name: collectionName,
                points: points
            }),
        });

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/points`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                collection_name: collectionName,
                point_ids: pointIds
            }),
        });

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
export const searchPoints = async (collectionName, queryVector, limit = 10, scoreThreshold = null, filter = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/retrieval/search`, {
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
                    filter: filter
                }
            }),
        });

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
        const response = await fetch(`${API_BASE_URL}/api/retrieval/config`);

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