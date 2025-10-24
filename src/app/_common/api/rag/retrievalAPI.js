// RAG API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';
import { getAuthCookie } from '@/app/_common/utils/cookieUtils';

const getUserId = () => {
    return getAuthCookie('user_id');
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
 * 컬렉션 정보를 업데이트하는 함수
 * @param {string} collectionName - 업데이트할 컬렉션 이름
 * @param {Object} updateDict - 업데이트할 정보 객체
 * @param {boolean} updateDict.is_shared - 공유 여부
 * @param {string|null} updateDict.share_group - 공유 그룹
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateCollection = async (collectionName, updateDict) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/update/collections`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_name: collectionName,
                    ...updateDict
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Collection updated:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to update collection:', error);
        throw error;
    }
};

/**
 * 사용자 그룹의 공유 컬렉션 목록을 조회하는 함수
 * @returns {Promise<Object>} 공유 컬렉션 목록
 */
export const listSharedCollections = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/group/collections`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Shared collections fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch shared collections:', error);
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
 * 컬렉션을 새로운 임베딩 모델로 리메이크하는 함수
 * 기존 컬렉션의 모든 문서를 보존하면서 새로운 임베딩 차원/모델로 재생성합니다.
 * @param {string} collectionName - 리메이크할 컬렉션 이름
 * @returns {Promise<Object>} 리메이크 결과
 */
export const remakeCollection = async (collectionName) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/remake`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    collection_name: collectionName,
                }),
            },
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const data = await response.json();
        devLog.info('Collection remade successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to remake collection:', error);
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
 * 세션 ID 생성 함수 (UUID v4)
 * 모달 세션과 SSE 업로드 세션에서 공통으로 사용
 * @returns {string} 생성된 세션 ID
 */
export const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * SSE를 통한 문서 업로드 및 처리 함수
 * @param {File} file - 업로드할 파일
 * @param {string} collectionName - 대상 컬렉션 이름
 * @param {number} chunkSize - 청크 크기 (기본값: 1000)
 * @param {number} chunkOverlap - 청크 겹침 크기 (기본값: 200)
 * @param {Object} metadata - 문서 메타데이터 (선택사항)
 * @param {string} processType - 처리 타입 (기본값: 'default')
 * @param {Function} onProgress - 진행 상황 콜백 함수
 * @param {string} session - 세션 ID (선택사항, 없으면 자동 생성)
 * @returns {Promise<{session: string, eventSource: EventSource}>} 세션 정보 및 EventSource
 */
export const uploadDocumentSSE = async (
    file,
    collectionName,
    chunkSize = 1000,
    chunkOverlap = 200,
    metadata = null,
    processType = 'default',
    onProgress = null,
    session = null
) => {
    const userId = getUserId();
    // 외부에서 session이 제공되지 않으면 새로 생성
    const sessionId = session || generateSessionId();
    const originalFileName = file.name;

    // 디버깅: session 파라미터 확인
    devLog.info('uploadDocumentSSE called with session:', {
        providedSession: session,
        finalSessionId: sessionId,
        fileName: originalFileName
    });

    // 폴더 구조 정보 추출
    let folderPath = '';
    let relativePath = originalFileName;

    if (file.webkitRelativePath) {
        relativePath = file.webkitRelativePath;
        const lastSlashIndex = relativePath.lastIndexOf('/');
        if (lastSlashIndex !== -1) {
            folderPath = relativePath.substring(0, lastSlashIndex);
        }
    }

    // 메타데이터에 폴더 구조 정보 포함
    const enhancedMetadata = {
        ...(metadata || {}),
        original_file_name: originalFileName,
        relative_path: relativePath,
        folder_path: folderPath,
        upload_timestamp: new Date().toISOString(),
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        process_type: processType,
    };

    // FormData 생성
    const formData = new FormData();
    formData.append('file', file, originalFileName);
    formData.append('collection_name', collectionName);
    formData.append('chunk_size', chunkSize.toString());
    formData.append('chunk_overlap', chunkOverlap.toString());
    formData.append('user_id', userId);
    formData.append('session', sessionId);
    formData.append('process_type', processType);
    formData.append('metadata', JSON.stringify(enhancedMetadata));

    return new Promise((resolve, reject) => {
        // 타임아웃 설정 (10분)
        const timeout = setTimeout(() => {
            devLog.error('SSE upload timeout:', {
                fileName: originalFileName,
                session: sessionId
            });
            reject(new Error('업로드 시간이 초과되었습니다 (10분)'));
        }, 10 * 60 * 1000);

        // FormData를 먼저 POST 요청으로 보내고 SSE 연결 시작
        fetch(`${API_BASE_URL}/api/retrieval/documents/upload-sse`, {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                clearTimeout(timeout);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // SSE 스트림 읽기
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let hasReceivedEvents = false;

            const processStream = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            clearTimeout(timeout);
                            // 스트림이 완료되었는데 complete 이벤트를 받지 못한 경우
                            if (!hasReceivedEvents) {
                                devLog.error('SSE stream closed without complete event:', {
                                    fileName: originalFileName,
                                    session: sessionId
                                });
                                reject(new Error('업로드가 비정상적으로 종료되었습니다'));
                            }
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n\n');

                        // 마지막 불완전한 줄은 buffer에 남김
                        buffer = lines.pop() || '';

                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const eventData = JSON.parse(line.slice(6));

                                    // 세션 확인
                                    if (eventData.session !== sessionId) {
                                        continue;
                                    }

                                    hasReceivedEvents = true;
                                    devLog.info('SSE Event received:', eventData);

                                    // 진행 상황 콜백 호출
                                    if (onProgress) {
                                        onProgress(eventData);
                                    }

                                    // 이벤트 타입별 처리
                                    if (eventData.event === 'complete') {
                                        clearTimeout(timeout);
                                        devLog.info('Document upload completed (SSE):', {
                                            fileName: originalFileName,
                                            session: sessionId,
                                            result: eventData.result
                                        });
                                        resolve({
                                            session: sessionId,
                                            result: eventData.result,
                                            success: true
                                        });
                                        reader.cancel();
                                        return;
                                    } else if (eventData.event === 'error') {
                                        clearTimeout(timeout);
                                        devLog.error('Document upload failed (SSE):', {
                                            fileName: originalFileName,
                                            session: sessionId,
                                            error: eventData.message
                                        });
                                        reject(new Error(eventData.message || 'Upload failed'));
                                        reader.cancel();
                                        return;
                                    }
                                } catch (parseError) {
                                    devLog.error('Failed to parse SSE event:', parseError);
                                }
                            }
                        }
                    }
                } catch (error) {
                    clearTimeout(timeout);
                    devLog.error('SSE stream error:', error);
                    reject(error);
                }
            };

            processStream();
        })
        .catch(error => {
            clearTimeout(timeout);
            devLog.error('Failed to start SSE upload:', {
                fileName: originalFileName,
                session: sessionId,
                error: error.message
            });
            reject(error);
        });
    });
};

/**
 * 문서를 업로드하고 처리하는 함수 (레거시 - 논SSE 방식)
 * @param {File} file - 업로드할 파일
 * @param {string} collectionName - 대상 컬렉션 이름
 * @param {number} chunkSize - 청크 크기 (기본값: 1000)
 * @param {number} chunkOverlap - 청크 겹침 크기 (기본값: 200)
 * @param {Object} metadata - 문서 메타데이터 (선택사항)
 * @param {string} processType - 처리 타입 (기본값: 'default')
 * @param {AbortController} abortController - 업로드 취소를 위한 컨트롤러 (선택사항)
 * @returns {Promise<Object>} 업로드 결과
 */
export const uploadDocument = async (
    file,
    collectionName,
    chunkSize = 1000,
    chunkOverlap = 200,
    metadata = null,
    processType = 'default',
    abortController = null
 ) => {
    // 외부에서 제공된 컨트롤러가 없으면 새로 생성
    const controller = abortController || new AbortController();

    try {
        const formData = new FormData();
        const userId = getUserId();
        // 파일명은 항상 원본 파일명 사용 (서버 경로 충돌 방지)
        const originalFileName = file.name;

        // 폴더 구조 정보 추출
        let folderPath = '';
        let relativePath = originalFileName;

        if (file.webkitRelativePath) {
            relativePath = file.webkitRelativePath;
            const lastSlashIndex = relativePath.lastIndexOf('/');
            if (lastSlashIndex !== -1) {
                folderPath = relativePath.substring(0, lastSlashIndex);
            }
        }

        // 파일은 원본 파일명으로 업로드
        formData.append('file', file, originalFileName);
        formData.append('collection_name', collectionName);
        formData.append('chunk_size', chunkSize.toString());
        formData.append('chunk_overlap', chunkOverlap.toString());
        formData.append('user_id', userId);
        formData.append('process_type', processType);

        // 메타데이터에 폴더 구조 정보 포함
        const enhancedMetadata = {
            ...(metadata || {}),
            original_file_name: originalFileName,
            relative_path: relativePath,
            folder_path: folderPath,
            upload_timestamp: new Date().toISOString(),
            file_size: file.size,
            file_type: file.type || 'application/octet-stream',
            process_type: processType,
        };

        formData.append('metadata', JSON.stringify(enhancedMetadata));

        // 타임아웃 설정 (10분)
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, 600000);

        const response = await fetch(
            `${API_BASE_URL}/api/retrieval/documents/upload`,
            {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            },
        );

        // 타임아웃 클리어
        clearTimeout(timeoutId);

        if (!response.ok) {
            // 응답이 실패하면 즉시 연결 종료
            controller.abort();

            const errorText = await response.text();
            let errorMessage = `HTTP error! status: ${response.status}`;

            try {
                const errorData = JSON.parse(errorText);
                if (errorData.detail) {
                    errorMessage += `, detail: ${errorData.detail}`;
                }
            } catch (e) {
                errorMessage += `, message: ${errorText}`;
            }

            throw new Error(errorMessage);
        }

        const data = await response.json();
        devLog.info('Document uploaded successfully:', {
            fileName: originalFileName,
            relativePath: relativePath,
            collection: collectionName,
            processType: processType,
            documentId: data.document_id || 'unknown',
        });
        return data;
    } catch (error) {
        // 에러 발생 시 명시적으로 연결 종료
        controller.abort();

        devLog.error('Failed to upload document:', {
            fileName: file.name,
            relativePath: file.webkitRelativePath || file.name,
            collection: collectionName,
            processType: processType,
            error: error.message,
            isAborted: error.name === 'AbortError',
        });
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
 * 특정 컬렉션의 문서 메타데이터 상세 정보를 조회하는 함수
 * @param {string} collectionName - 컬렉션 이름
 * @returns {Promise<Object>} 문서 메타데이터 목록
 */
export const getDocumentDetailMeta = async (collectionName) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/detail/${collectionName}/documents`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Document detail meta fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch document detail meta:', error);
        throw error;
    }
};

/**
 * 특정 컬렉션의 문서 메타데이터 상세 정보를 조회하는 함수
 * @param {string} collectionName - 컬렉션 이름
 * @returns {Promise<Object>} 문서 메타데이터 목록
 */
export const getDocumentDetailEdges = async (collectionName) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/detail/${collectionName}/edges`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Document detail meta fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch document detail edges:', error);
        throw error;
    }
};

/**
 * 모든 문서의 메타데이터 상세 정보를 조회하는 함수
 * @returns {Promise<Object>} 모든 문서의 메타데이터 목록
 */
export const getAllDocumentDetailMeta = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections-all/detail/documents`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('All document detail meta fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch all document detail meta:', error);
        throw error;
    }
};

/**
 * 모든 문서의 엣지 메타데이터 상세 정보를 조회하는 함수
 * @returns {Promise<Object>} 모든 문서의 엣지 메타데이터 목록
 */
export const getAllDocumentDetailEdges = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections-all/detail/edges`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('All document detail edges fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch all document detail edges:', error);
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

/**
 * Retrieval 설정을 새로고침하는 함수
 * @returns {Promise<Object>} 새로고침 결과
 */
export const refreshRetrievalConfig = async () => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/api/retrieval/refresh/rag-system`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Retrieval configuration refreshed:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to refresh retrieval configuration:', error);
        throw error;
    }
};

/**
 * 특정 청크의 내용을 업데이트하는 함수
 * @param {string} collectionName - 컬렉션 이름
 * @param {string} documentId - 문서 ID
 * @param {string} chunkId - 청크 ID
 * @param {string} newContent - 새로운 청크 내용
 * @param {Object} metadata - 업데이트할 메타데이터 (선택사항)
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updateChunkContent = async (
    collectionName,
    documentId,
    chunkId,
    newContent,
    metadata = null,
) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/collections/${collectionName}/documents/${documentId}/${chunkId}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    new_content: newContent,
                    metadata: metadata,
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Chunk content updated:', {
            collectionName,
            documentId,
            chunkId,
            response: data,
        });
        return data;
    } catch (error) {
        devLog.error('Failed to update chunk content:', {
            collectionName,
            documentId,
            chunkId,
            error: error.message,
        });
        throw error;
    }
};

// =============================================================================
// SSE Session Management
// =============================================================================

/**
 * 모든 SSE 세션 정보 조회
 * @returns {Promise<Object>} 세션 정보
 */
export const getSessionsInfo = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/sessions/info`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Sessions info fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch sessions info:', error);
        throw error;
    }
};

/**
 * 특정 세션 상태 조회
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 세션 상태
 */
export const getSessionStatus = async (sessionId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/sessions/${sessionId}/status`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Session status fetched:', { sessionId, data });
        return data;
    } catch (error) {
        devLog.error('Failed to fetch session status:', { sessionId, error: error.message });
        throw error;
    }
};

/**
 * 진행 중인 세션 취소
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 취소 결과
 */
export const cancelSession = async (sessionId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/sessions/${sessionId}/cancel`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Session cancelled:', { sessionId, data });
        return data;
    } catch (error) {
        devLog.error('Failed to cancel session:', { sessionId, error: error.message });
        throw error;
    }
};

/**
 * 세션 삭제
 * @param {string} sessionId - 세션 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deleteSession = async (sessionId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/sessions/${sessionId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Session deleted:', { sessionId, data });
        return data;
    } catch (error) {
        devLog.error('Failed to delete session:', { sessionId, error: error.message });
        throw error;
    }
};

/**
 * 만료된 세션 수동 정리
 * @returns {Promise<Object>} 정리 결과
 */
export const cleanupExpiredSessions = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/sessions/cleanup`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Expired sessions cleaned up:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to cleanup expired sessions:', error);
        throw error;
    }
};

/**
 * GitLab 레포지토리의 브랜치 목록을 조회하는 함수
 * @param {string} gitlabUrl - GitLab 인스턴스 URL
 * @param {string} gitlabToken - GitLab Personal Access Token
 * @param {string} repositoryPath - 레포지토리 경로 (예: group/project)
 * @returns {Promise<Array>} 브랜치 목록 [{ name, default, protected }]
 */
export const getRepositoryBranches = async (
    gitlabUrl,
    gitlabToken,
    repositoryPath
) => {
    try {
        const encodedPath = encodeURIComponent(repositoryPath);
        const apiUrl = `${gitlabUrl}/api/v4/projects/${encodedPath}/repository/branches`;

        const response = await fetch(apiUrl, {
            headers: {
                'PRIVATE-TOKEN': gitlabToken
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch branches: ${response.status}`);
        }

        const branches = await response.json();

        // 브랜치를 기본 브랜치 우선으로 정렬
        const sortedBranches = branches.sort((a, b) => {
            if (a.default && !b.default) return -1;
            if (!a.default && b.default) return 1;
            return a.name.localeCompare(b.name);
        });

        devLog.info('Repository branches fetched:', {
            repository: repositoryPath,
            branchCount: sortedBranches.length
        });

        return sortedBranches.map(branch => ({
            name: branch.name,
            default: branch.default || false,
            protected: branch.protected || false
        }));
    } catch (error) {
        devLog.error('Failed to fetch repository branches:', error);
        throw error;
    }
};

/**
 * GitLab 레포지토리를 업로드하고 처리하는 함수
 * @param {string} gitlabUrl - GitLab 인스턴스 URL
 * @param {string} gitlabToken - GitLab Personal Access Token
 * @param {string} repositoryPath - 레포지토리 경로 (예: group/project)
 * @param {string} branch - 브랜치 이름 (기본값: main)
 * @param {string} collectionName - 대상 컬렉션 이름
 * @param {number} chunkSize - 청크 크기 (기본값: 4000)
 * @param {number} chunkOverlap - 청크 겹침 크기 (기본값: 1000)
 * @param {Object} metadata - 문서 메타데이터 (선택사항)
 * @param {boolean} enableAnnotation - LLM 기반 코드 주석 생성 여부 (기본값: false)
 * @param {boolean} enableApiExtraction - API 엔드포인트 추출 여부 (기본값: false)
 * @returns {Promise<Object>} 업로드 결과
 */
export const uploadRepository = async (
    gitlabUrl,
    gitlabToken,
    repositoryPath,
    branch = 'main',
    collectionName,
    chunkSize = 4000,
    chunkOverlap = 1000,
    metadata = null,
    enableAnnotation = false,
    enableApiExtraction = false
) => {
    try {
        const formData = new FormData();
        const userId = getUserId();

        formData.append('gitlab_url', gitlabUrl);
        formData.append('gitlab_token', gitlabToken);
        formData.append('repository_path', repositoryPath);
        formData.append('branch', branch);
        formData.append('collection_name', collectionName);
        formData.append('chunk_size', chunkSize.toString());
        formData.append('chunk_overlap', chunkOverlap.toString());
        formData.append('user_id', userId);
        formData.append('enable_annotation', enableAnnotation.toString());
        formData.append('enable_api_extraction', enableApiExtraction.toString());

        // 메타데이터 추가
        const enhancedMetadata = {
            ...(metadata || {}),
            source_type: 'gitlab_repository',
            repository_path: repositoryPath,
            branch: branch,
            upload_timestamp: new Date().toISOString(),
        };

        formData.append('metadata', JSON.stringify(enhancedMetadata));

        // AbortController로 타임아웃 설정 (30분)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1800000);

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/retrieval/documents/upload/repository`,
                {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                },
            );

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `HTTP error! status: ${response.status}`;

                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.detail) {
                        errorMessage += `, detail: ${errorData.detail}`;
                    }
                } catch (e) {
                    errorMessage += `, message: ${errorText}`;
                }

                throw new Error(errorMessage);
            }

            const data = await response.json();
            devLog.info('Repository uploaded successfully:', {
                repositoryPath: repositoryPath,
                branch: branch,
                collection: collectionName,
                enableAnnotation: enableAnnotation,
                enableApiExtraction: enableApiExtraction,
                taskId: data.task_id,
                documentId: data.document_id || 'unknown',
            });
            return data;
        } catch (error) {
            clearTimeout(timeoutId);

            // AbortController로 인한 타임아웃인 경우
            if (error.name === 'AbortError') {
                devLog.error('Repository upload timeout (30 minutes):', {
                    repositoryPath: repositoryPath,
                    branch: branch,
                    collection: collectionName,
                });
                throw new Error('Upload timeout: The repository upload took too long. Please try a smaller repository or check the server logs.');
            }

            devLog.error('Failed to upload repository:', {
                repositoryPath: repositoryPath,
                branch: branch,
                collection: collectionName,
                error: error.message,
            });
            throw error;
        }
    } catch (error) {
        devLog.error('Failed to upload repository:', {
            repositoryPath: repositoryPath,
            branch: branch,
            collection: collectionName,
            error: error.message,
        });
        throw error;
    }
};

// =============================================================================
// Upload Progress Management
// =============================================================================

/**
 * 특정 업로드 작업의 진행 상태를 조회하는 함수
 * @param {string} taskId - 업로드 작업 ID
 * @returns {Promise<Object>} 진행 상태 정보
 */
export const getUploadProgress = async (taskId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/upload/progress/${taskId}`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Upload progress fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch upload progress:', error);
        throw error;
    }
};

/**
 * 사용자의 모든 업로드 작업 목록을 조회하는 함수
 * @returns {Promise<Object>} 업로드 작업 목록
 */
export const getUserUploadTasks = async () => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/upload/progress`,
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('User upload tasks fetched:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch user upload tasks:', error);
        throw error;
    }
};

/**
 * 업로드 작업을 삭제하는 함수 (완료 또는 에러 상태만 삭제 가능)
 * @param {string} taskId - 업로드 작업 ID
 * @returns {Promise<Object>} 삭제 결과
 */
export const cancelUploadTask = async (taskId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/upload/progress/${taskId}/cancel`,
            {
                method: 'POST',
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, ${errorText}`);
        }

        const data = await response.json();
        devLog.info('Upload task cancelled:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to cancel upload task:', error);
        throw error;
    }
};

export const deleteUploadTask = async (taskId) => {
    try {
        const response = await apiClient(
            `${API_BASE_URL}/api/retrieval/upload/progress/${taskId}`,
            {
                method: 'DELETE',
            },
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Upload task deleted:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete upload task:', error);
        throw error;
    }
};
