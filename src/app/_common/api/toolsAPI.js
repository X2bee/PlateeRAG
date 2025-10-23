import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 도구 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>} 도구 목록을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listTools = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/tools/storage/list`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.tools || [];
    } catch (error) {
        devLog.error('Failed to list tools:', error);
        throw error;
    }
};

/**
 * 도구 상세 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>} 도구 상세 정보 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listToolsDetail = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/tools/storage/list/detail`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.tools || [];
    } catch (error) {
        devLog.error('Failed to list tools detail:', error);
        throw error;
    }
};

/**
 * 도구를 저장합니다.
 * @param {string} functionName - 도구 이름
 * @param {Object} content - 도구 데이터 (ToolData)
 * @param {string} content.function_name - 도구 이름
 * @param {string} content.function_id - 도구 ID
 * @param {string} content.description - 도구 설명
 * @param {Object} content.api_header - API 헤더
 * @param {Object} content.api_body - API 바디 스키마
 * @param {Object} content.static_body - 정적 바디 파라미터
 * @param {string} content.api_url - API URL
 * @param {string} content.api_method - API 메서드 (GET, POST 등)
 * @param {string} content.body_type - 바디 타입 (application/json, application/xml, application/x-www-form-urlencoded, multipart/form-data, text/plain, text/html, text/csv, url-params)
 * @param {number} content.api_timeout - API 타임아웃 (초)
 * @param {boolean} content.is_query_string - Query String 사용 여부
 * @param {boolean} content.response_filter - 응답 필터 사용 여부
 * @param {string} content.response_filter_path - 응답 필터 경로
 * @param {string} content.response_filter_field - 응답 필터 필드
 * @param {string} content.status - 도구 상태
 * @param {Object} content.metadata - 추가 메타데이터
 * @param {number|null} userId - 사용자 ID (옵션)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const saveTool = async (functionName, content, userId = null) => {
    try {
        devLog.log('SaveTool called with:');
        devLog.log('- functionName:', functionName);
        devLog.log('- content.function_id:', content.function_id);
        devLog.log('- userId:', userId);

        const requestBody = {
            function_name: functionName,
            content: content,
        };

        if (userId !== null && (typeof userId === 'number' || (typeof userId === 'string' && /^\d+$/.test(userId)))) {
            requestBody.user_id = userId;
        }

        const response = await apiClient(`${API_BASE_URL}/api/tools/storage/save`, {
            method: 'POST',
            body: JSON.stringify(requestBody),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool saved successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to save tool:', error);
        devLog.error('FunctionName that caused error:', functionName);
        throw error;
    }
};


/**
 * 도구 정보를 업데이트합니다.
 * @param {number} toolId - 도구 DB ID
 * @param {string} functionId - 도구 function ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const updateTool = async (toolId, functionId, updateData) => {
    try {
        devLog.log('UpdateTool called with:');
        devLog.log('- toolId:', toolId);
        devLog.log('- functionId:', functionId);
        devLog.log('- updateData:', updateData);

        const url = new URL(`${API_BASE_URL}/api/tools/storage/update/${encodeURIComponent(functionId)}`);
        url.searchParams.append('tool_id', toolId.toString());

        const response = await apiClient(url.toString(), {
            method: 'POST',
            body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool updated successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to update tool:', error);
        devLog.error('ToolId that caused error:', toolId);
        devLog.error('FunctionId that caused error:', functionId);
        throw error;
    }
};

/**
 * 도구를 삭제합니다.
 * @param {string} functionId - 도구 ID
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteTool = async (functionId) => {
    try {
        devLog.log('DeleteTool called with functionId:', functionId);

        const response = await apiClient(`${API_BASE_URL}/api/tools/storage/delete/${encodeURIComponent(functionId)}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool deleted successfully:', functionId);
        return result;
    } catch (error) {
        devLog.error('Failed to delete tool:', error);
        devLog.error('FunctionId that caused error:', functionId);
        throw error;
    }
};

// ==================== Tool Store API ====================

/**
 * Tool Store의 도구 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>} 도구 목록을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listToolStore = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/tools/store/list`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.tools || [];
    } catch (error) {
        devLog.error('Failed to list tool store:', error);
        throw error;
    }
};

/**
 * Tool Store의 도구 상세 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>} 도구 상세 정보 배열을 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const listToolStoreDetail = async () => {
    try {
        const response = await apiClient(`${API_BASE_URL}/api/tools/store/list/detail`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        return result.tools || [];
    } catch (error) {
        devLog.error('Failed to list tool store detail:', error);
        throw error;
    }
};

/**
 * 도구를 Tool Store에 업로드합니다.
 * @param {number} toolId - 도구 DB ID (필수)
 * @param {Object} uploadData - 업로드 데이터 (UploadToolStoreRequest)
 * @param {string} uploadData.function_upload_id - 업로드할 툴의 DB ID (필수, 문자열로 전달)
 * @param {string} uploadData.description - 툴 설명 (옵션)
 * @param {Array<string>} uploadData.tags - 툴 태그 배열 (옵션)
 * @param {Object} uploadData.metadata - 추가 메타데이터 (옵션)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const uploadToolToStore = async (toolId, uploadData) => {
    try {
        devLog.log('UploadToolToStore called with:');
        devLog.log('- toolId:', toolId);
        devLog.log('- uploadData:', uploadData);

        const response = await apiClient(`${API_BASE_URL}/api/tools/store/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(uploadData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool uploaded to store successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to upload tool to store:', error);
        devLog.error('ToolId that caused error:', toolId);
        throw error;
    }
};

/**
 * Tool Store의 도구 정보를 업데이트합니다.
 * @param {string} functionUploadId - 도구 업로드 ID
 * @param {Object} updateData - 업데이트할 데이터
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const updateToolStore = async (functionUploadId, updateData) => {
    try {
        devLog.log('UpdateToolStore called with:');
        devLog.log('- functionUploadId:', functionUploadId);
        devLog.log('- updateData:', updateData);

        const response = await apiClient(`${API_BASE_URL}/api/tools/store/update/${encodeURIComponent(functionUploadId)}`, {
            method: 'POST',
            body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool store updated successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to update tool store:', error);
        devLog.error('FunctionUploadId that caused error:', functionUploadId);
        throw error;
    }
};

/**
 * Tool Store에서 도구를 삭제합니다.
 * @param {string} functionUploadId - 도구 업로드 ID
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const deleteToolFromStore = async (functionUploadId) => {
    try {
        devLog.log('DeleteToolFromStore called with functionUploadId:', functionUploadId);

        const response = await apiClient(`${API_BASE_URL}/api/tools/store/delete/${encodeURIComponent(functionUploadId)}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool deleted from store successfully:', functionUploadId);
        return result;
    } catch (error) {
        devLog.error('Failed to delete tool from store:', error);
        devLog.error('FunctionUploadId that caused error:', functionUploadId);
        throw error;
    }
};

/**
 * Tool Store에서 도구를 다운로드하여 사용자의 도구 목록에 추가합니다.
 * @param {string} storeToolId - 스토어 도구 ID (store_tool_id)
 * @param {string} functionUploadId - 도구 업로드 ID (function_upload_id)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @returns {boolean} result.success - 다운로드 성공 여부
 * @returns {string} result.message - 성공 메시지
 * @returns {string} result.function_id - 새로 생성된 function ID
 * @returns {string} result.function_name - 도구 이름
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const downloadToolFromStore = async (storeToolId, functionUploadId) => {
    try {
        devLog.log('DownloadToolFromStore called with:');
        devLog.log('- storeToolId:', storeToolId);
        devLog.log('- functionUploadId:', functionUploadId);

        const url = new URL(`${API_BASE_URL}/api/tools/store/download/${encodeURIComponent(storeToolId)}`);
        url.searchParams.append('function_upload_id', functionUploadId);

        const response = await apiClient(url.toString(), {
            method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool downloaded from store successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to download tool from store:', error);
        devLog.error('Store tool ID that caused error:', storeToolId);
        devLog.error('FunctionUploadId that caused error:', functionUploadId);
        throw error;
    }
};

/**
 * Tool Store의 도구에 평점을 부여합니다.
 * @param {string} storeToolId - 스토어 도구 ID (store_tool_id)
 * @param {number} userId - 도구 소유자의 사용자 ID
 * @param {string} functionUploadId - 도구 업로드 ID (function_upload_id)
 * @param {number} rating - 평점 (1-5)
 * @returns {Promise<Object>} API 응답 객체를 포함하는 프로미스
 * @returns {boolean} result.success - 평가 성공 여부
 * @returns {string} result.message - 성공 메시지
 * @returns {number} result.rating - 부여한 평점
 * @returns {number} result.average_rating - 평균 평점
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const rateToolStore = async (storeToolId, userId, functionUploadId, rating) => {
    try {
        devLog.log('RateToolStore called with:');
        devLog.log('- storeToolId:', storeToolId);
        devLog.log('- userId:', userId);
        devLog.log('- functionUploadId:', functionUploadId);
        devLog.log('- rating:', rating);

        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const url = new URL(`${API_BASE_URL}/api/tools/store/rating/${encodeURIComponent(storeToolId)}`);
        url.searchParams.append('user_id', userId.toString());
        url.searchParams.append('function_upload_id', functionUploadId);
        url.searchParams.append('rating', rating.toString());

        const response = await apiClient(url.toString(), {
            method: 'POST',
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.detail || `HTTP error! status: ${response.status}`,
            );
        }

        devLog.log('Tool rated successfully:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to rate tool:', error);
        devLog.error('Store tool ID that caused error:', storeToolId);
        devLog.error('UserId that caused error:', userId);
        devLog.error('FunctionUploadId that caused error:', functionUploadId);
        devLog.error('Rating that caused error:', rating);
        throw error;
    }
};

// ==================== API Test (CORS Proxy) ====================

/**
 * 백엔드 프록시를 통해 API 엔드포인트를 테스트합니다. (CORS 우회)
 * 브라우저의 CORS 제한을 피하기 위해 백엔드에서 요청을 프록시합니다.
 *
 * @param {Object} testRequest - API 테스트 요청 데이터
 * @param {string} testRequest.api_url - 테스트할 API URL (필수)
 * @param {string} testRequest.api_method - HTTP 메서드 (GET, POST, PUT, DELETE, PATCH 등, 기본값: GET)
 * @param {Object} testRequest.api_headers - 요청 헤더 (옵션)
 * @param {Object} testRequest.api_body - 요청 바디 스키마 (옵션)
 * @param {Object} testRequest.static_body - 정적 바디 파라미터 (옵션)
 * @param {string} testRequest.body_type - 바디 타입 (application/json, application/xml, application/x-www-form-urlencoded, multipart/form-data, text/plain, text/html, text/csv, url-params, 기본값: application/json)
 * @param {boolean} testRequest.is_query_string - Query String 사용 여부 (옵션)
 * @param {number} testRequest.api_timeout - 타임아웃 (초, 기본값: 30)
 * @returns {Promise<Object>} API 테스트 결과를 포함하는 프로미스
 * @returns {boolean} result.success - 요청 성공 여부
 * @returns {Object|null} result.data - 응답 데이터 (성공 시)
 * @returns {number} result.data.status - HTTP 상태 코드
 * @returns {string} result.data.statusText - HTTP 상태 텍스트
 * @returns {string} result.data.contentType - 응답 Content-Type
 * @returns {Object} result.data.headers - 응답 헤더
 * @returns {any} result.data.response - 응답 본문 (JSON, 텍스트 등)
 * @returns {string|undefined} result.error - 오류 메시지 (실패 시)
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const testApiEndpoint = async (testRequest) => {
    try {
        devLog.log('TestApiEndpoint called with:');
        devLog.log('- api_url:', testRequest.api_url);
        devLog.log('- api_method:', testRequest.api_method);
        devLog.log('- has_headers:', !!testRequest.api_headers && Object.keys(testRequest.api_headers).length > 0);
        devLog.log('- has_body:', !!testRequest.api_body && Object.keys(testRequest.api_body).length > 0);
        devLog.log('- has_static_body:', !!testRequest.static_body && Object.keys(testRequest.static_body).length > 0);
        devLog.log('- body_type:', testRequest.body_type);
        devLog.log('- is_query_string:', testRequest.is_query_string);

        // 필수 필드 검증
        if (!testRequest.api_url || !testRequest.api_url.trim()) {
            throw new Error('API URL is required');
        }

        const response = await apiClient(`${API_BASE_URL}/api/tools/storage/api-test`, {
            method: 'POST',
            body: JSON.stringify({
                api_url: testRequest.api_url,
                api_method: testRequest.api_method || 'GET',
                api_headers: testRequest.api_headers || {},
                api_body: testRequest.api_body || {},
                static_body: testRequest.static_body || {},
                body_type: testRequest.body_type || 'application/json',
                is_query_string: testRequest.is_query_string || false,
                api_timeout: testRequest.api_timeout || 30,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();

        devLog.log('API test completed:', {
            success: result.success,
            status: result.data?.status,
            has_error: !!result.error
        });

        return result;
    } catch (error) {
        devLog.error('Failed to test API endpoint:', error);
        throw error;
    }
};

/**
 * 도구를 테스트하고 결과에 따라 status를 업데이트합니다.
 * 성공 시 status를 'active'로, 실패 시 'inactive'로 변경합니다.
 *
 * @param {number} toolId - 도구 ID
 * @param {string} functionId - 도구 function ID
 * @returns {Promise<Object>} API 테스트 결과 및 업데이트된 status 정보
 * @returns {boolean} result.success - 테스트 성공 여부
 * @returns {string} result.tool_status - 업데이트된 도구 상태 (active/inactive)
 * @returns {string} result.function_id - 도구 function ID
 * @returns {string} result.function_name - 도구 이름
 * @returns {Object|null} result.data - 응답 데이터 (성공 시)
 * @returns {string|undefined} result.error - 오류 메시지 (실패 시)
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const testTool = async (toolId, functionId) => {
    try {
        devLog.log('TestTool called with:');
        devLog.log('- toolId:', toolId);
        devLog.log('- functionId:', functionId);

        const url = new URL(`${API_BASE_URL}/api/tools/storage/tool-test`);
        url.searchParams.append('tool_id', toolId.toString());
        url.searchParams.append('function_id', functionId);

        const response = await apiClient(url.toString(), {
            method: 'POST',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();

        devLog.log('Tool test completed:', {
            success: result.success,
            tool_status: result.tool_status,
            function_id: result.function_id
        });

        return result;
    } catch (error) {
        devLog.error('Failed to test tool:', error);
        devLog.error('ToolId that caused error:', toolId);
        devLog.error('FunctionId that caused error:', functionId);
        throw error;
    }
};
