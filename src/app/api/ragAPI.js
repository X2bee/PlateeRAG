// =============================================================================
// Utility Functions
// =============================================================================

/**
 * 파일 타입이 지원되는지 확인하는 함수
 * @param {File} file - 확인할 파일
 * @returns {boolean} 지원 여부
 */
export const isSupportedFileType = (file) => {
    const supportedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
    ];
    return supportedTypes.includes(file.type);
};

/**
 * 파일 크기가 허용 범위인지 확인하는 함수
 * @param {File} file - 확인할 파일
 * @param {number} maxSizeMB - 최대 크기 (MB, 기본값: 50)
 * @returns {boolean} 허용 여부
 */
export const isValidFileSize = (file, maxSizeMB = 50) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
};

/**
 * 컬렉션 이름의 유효성을 검사하는 함수
 * @param {string} name - 컬렉션 이름
 * @returns {boolean} 유효성 여부
 */
export const isValidCollectionName = (name) => {
    // 영문자, 숫자, 언더스코어, 하이픈만 허용, 3-63자
    const regex = /^[a-zA-Z0-9_-]{3,63}$/;
    return regex.test(name);
};

/**
 * RAG 시스템의 전체 상태를 확인하는 함수
 * @returns {Promise<Object>} 전체 시스템 상태
 */
export const getRagSystemStatus = async () => {
    try {
        const [healthData, configData, collectionsData] = await Promise.all([
            checkRagHealth(),
            getRagConfig(),
            listCollections()
        ]);

        return {
            health: healthData,
            config: configData,
            collections: collectionsData,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        devLog.error('Failed to get RAG system status:', error);
        throw error;
    }
};

/**
 * 임베딩 제공자 이름을 한국어로 변환하는 함수
 * @param {string} provider - 제공자 이름
 * @returns {string} 한국어 제공자 이름
 */
export const getProviderDisplayName = (provider) => {
    const providerNames = {
        'openai': 'OpenAI',
        'huggingface': 'HuggingFace',
        'custom_http': '커스텀 HTTP',
        'local': '로컬'
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
        'pdf': 'application/pdf',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'doc': 'application/msword',
        'txt': 'text/plain'
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
                "Qwen/Qwen3-Embedding-0.6B": 1024,
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
        try {
            const dimension = getEmbeddingDimension(provider, model);
            return {
                provider,
                model,
                dimension,
                auto_detected: true
            };
        } catch (error) {
            return {
                provider: 'openai',
                model: 'text-embedding-3-small', 
                dimension: 1536,
                auto_detected: false
            };

        }
    } catch (error) {
        devLog.error('Failed to get current embedding dimension:', error);
        return {
            provider: 'openai',
            model: 'text-embedding-3-small',
            dimension: 1536,
            auto_detected: false,
            error: error.message
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

