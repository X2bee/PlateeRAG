import { apiClient } from './apiClient';
import { API_BASE_URL } from '../config';
import { documentCache } from '../_common/utils/documentCache';

/**
 * 파일 경로를 기반으로 문서를 가져오는 API (캐싱 지원)
 * @param {string} filePath - 문서 파일 경로 
 * @param {boolean} useCache - 캐시 사용 여부 (기본값: true)
 * @returns {Promise<ArrayBuffer>} PDF 파일의 바이너리 데이터
 */
export const fetchDocumentByPath = async (filePath, useCache = true) => {
    try {
        // 캐시에서 먼저 확인
        if (useCache) {
            const cachedData = documentCache.get(filePath);
            if (cachedData) {
                console.log(`📄 [DocumentAPI] Using cached document: ${filePath}`);
                return cachedData;
            }
        }

        console.log(`🌐 [DocumentAPI] Fetching document from server: ${filePath}`);
        
        // 개발 환경에서 백엔드 API가 없는 경우 샘플 PDF 제공
        if (process.env.NODE_ENV === 'development' && filePath.includes('sample')) {
            console.log('🔧 [DocumentAPI] Development mode: using sample PDF');
            
            // 간단한 PDF 헤더 생성 (실제로는 백엔드에서 실제 PDF 파일을 반환해야 함)
            const samplePdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 4 0 R
>>
>>
/Contents 5 0 R
>>
endobj

4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

5 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Sample PDF Document) Tj
ET
endstream
endobj

xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000110 00000 n 
0000000251 00000 n 
0000000329 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
422
%%EOF`;

            const encoder = new TextEncoder();
            const arrayBuffer = encoder.encode(samplePdfContent).buffer;
            
            // 캐시에 저장 (유효한 데이터인 경우만)
            if (useCache && arrayBuffer && arrayBuffer.byteLength > 0) {
                documentCache.set(filePath, arrayBuffer);
            }
            
            return arrayBuffer;
        }
        
        const response = await apiClient(`${API_BASE_URL}/api/documents/fetch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                file_path: filePath 
            }),
        });

        if (!response.ok) {
            throw new Error(`문서를 가져오는데 실패했습니다: ${response.status} ${response.statusText}`);
        }

        // PDF 파일은 바이너리 데이터로 반환
        const arrayBuffer = await response.arrayBuffer();
        
        // 캐시에 저장 (유효한 데이터인 경우만)
        if (useCache && arrayBuffer && arrayBuffer.byteLength > 0) {
            documentCache.set(filePath, arrayBuffer);
        }
        
        return arrayBuffer;
    } catch (error) {
        console.error('문서 가져오기 오류:', error);
        throw error;
    }
};

/**
 * 문서 메타데이터를 가져오는 API
 * @param {string} filePath - 문서 파일 경로
 * @returns {Promise<Object>} 문서 메타데이터
 */
export const fetchDocumentMetadata = async (filePath) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/documents/metadata`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                file_path: filePath 
            }),
        });

        if (!response.ok) {
            throw new Error(`문서 메타데이터를 가져오는데 실패했습니다: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('문서 메타데이터 가져오기 오류:', error);
        throw error;
    }
};

/**
 * 문서 접근 권한을 확인하는 API
 * @param {string} filePath - 문서 파일 경로
 * @returns {Promise<boolean>} 접근 권한 여부
 */
export const checkDocumentAccess = async (filePath) => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/documents/access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                file_path: filePath 
            }),
        });

        if (!response.ok) {
            return false;
        }

        const result = await response.json();
        return result.has_access || false;
    } catch (error) {
        console.error('문서 접근 권한 확인 오류:', error);
        return false;
    }
};

/**
 * 특정 문서를 캐시에서 제거
 * @param {string} filePath - 문서 파일 경로
 * @returns {boolean} 제거 성공 여부
 */
export const clearDocumentCache = (filePath) => {
    return documentCache.delete(filePath);
};

/**
 * 전체 문서 캐시 클리어
 */
export const clearAllDocumentCache = () => {
    documentCache.clear();
};

/**
 * 캐시 통계 가져오기
 * @returns {Object} 캐시 통계 정보
 */
export const getDocumentCacheStats = () => {
    return documentCache.getStats();
};

/**
 * 캐시에 문서가 있는지 확인
 * @param {string} filePath - 문서 파일 경로
 * @returns {boolean} 캐시 존재 여부
 */
export const hasDocumentInCache = (filePath) => {
    return documentCache.has(filePath);
};