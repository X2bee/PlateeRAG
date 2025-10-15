// Admin Prompt API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 관리자용: 모든 프롬프트 목록을 가져오는 함수
 * @param {Object} options - 옵션 객체
 * @param {number} options.limit - 반환할 프롬프트 수 (기본값: 1000)
 * @param {number} options.offset - 건너뛸 프롬프트 수 (기본값: 0)
 * @param {string} options.language - 언어 필터 (en, ko)
 * @param {number} options.user_id - 사용자 ID 필터
 * @param {boolean} options.is_template - 템플릿 여부 필터
 * @returns {Promise<Object>} 프롬프트 목록
 */
export const getAllPrompts = async (options = {}) => {
    try {
        const {
            limit = 1000,
            offset = 0,
            language = null,
            user_id = null,
            is_template = null
        } = options;

        devLog.info('Fetching all prompts (admin) with options:', options);

        // URL 파라미터 구성
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        if (language) params.append('language', language);
        if (user_id !== null) params.append('user_id', user_id.toString());
        if (is_template !== null) params.append('is_template', is_template.toString());

        const response = await apiClient(`${API_BASE_URL}/api/admin/prompt/list?${params.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 403 에러 처리 (관리자 권한 필요)
            if (response.status === 403) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            // 404 에러 처리
            if (response.status === 404) {
                throw new Error('Prompt API가 설정되지 않았거나 사용할 수 없습니다. 서버 설정을 확인해주세요.');
            }

            // 422 에러 (유효성 검사 에러) 처리
            if (response.status === 422) {
                throw new Error('잘못된 요청 파라미터입니다. 입력값을 확인해주세요.');
            }

            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('All prompts (admin) fetched successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch all prompts (admin):', error);
        throw error;
    }
};

/**
 * 관리자용: 새로운 프롬프트를 생성하는 함수
 * @param {Object} promptData - 프롬프트 데이터 객체
 * @param {string} promptData.prompt_title - 프롬프트 제목
 * @param {string} promptData.prompt_content - 프롬프트 내용
 * @param {boolean} promptData.public_available - 공개 여부 (기본값: false)
 * @param {string} promptData.language - 언어 (기본값: "ko")
 * @param {boolean} promptData.is_template - 템플릿 여부 (기본값: false)
 * @returns {Promise<Object>} 생성된 프롬프트 정보
 */
export const createPrompt = async (promptData) => {
    try {
        devLog.info('Creating new prompt (admin):', promptData);

        const response = await apiClient(`${API_BASE_URL}/api/admin/prompt/create`, {
            method: 'POST',
            body: JSON.stringify(promptData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 403 에러 처리 (관리자 권한 필요)
            if (response.status === 403) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            // 422 에러 (유효성 검사 에러) 처리
            if (response.status === 422) {
                throw new Error('잘못된 요청 데이터입니다. 입력값을 확인해주세요.');
            }

            // 500 에러 처리
            if (response.status === 500) {
                throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }

            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Prompt created successfully (admin):', data);
        return data;
    } catch (error) {
        devLog.error('Failed to create prompt (admin):', error);
        throw error;
    }
};

/**
 * 관리자용: 프롬프트를 업데이트하는 함수
 * @param {Object} promptData - 프롬프트 데이터 객체
 * @param {string} promptData.prompt_uid - 프롬프트 UID
 * @param {string} promptData.prompt_title - 프롬프트 제목 (선택)
 * @param {string} promptData.prompt_content - 프롬프트 내용 (선택)
 * @param {boolean} promptData.public_available - 공개 여부 (선택)
 * @param {string} promptData.language - 언어 (선택)
 * @param {boolean} promptData.is_template - 템플릿 여부 (선택)
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updatePrompt = async (promptData) => {
    try {
        devLog.info('Updating prompt (admin):', promptData);

        const response = await apiClient(`${API_BASE_URL}/api/admin/prompt/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(promptData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 403 에러 처리 (관리자 권한 필요)
            if (response.status === 403) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            // 404 에러 처리 (프롬프트를 찾을 수 없음)
            if (response.status === 404) {
                throw new Error('프롬프트를 찾을 수 없습니다.');
            }

            // 422 에러 (유효성 검사 에러) 처리
            if (response.status === 422) {
                throw new Error('잘못된 요청 데이터입니다. 입력값을 확인해주세요.');
            }

            // 500 에러 처리
            if (response.status === 500) {
                throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }

            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Prompt updated successfully (admin):', data);
        return data;
    } catch (error) {
        devLog.error('Failed to update prompt (admin):', error);
        throw error;
    }
};

/**
 * 관리자용: 프롬프트를 삭제하는 함수
 * @param {Object} promptData - 프롬프트 데이터 객체
 * @param {string} promptData.prompt_uid - 프롬프트 UID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deletePrompt = async (promptData) => {
    try {
        devLog.info('Deleting prompt (admin):', promptData);

        const response = await apiClient(`${API_BASE_URL}/api/admin/prompt/delete`, {
            method: 'DELETE',
            body: JSON.stringify(promptData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 403 에러 처리 (관리자 권한 필요)
            if (response.status === 403) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            // 404 에러 처리 (프롬프트를 찾을 수 없음)
            if (response.status === 404) {
                throw new Error('프롬프트를 찾을 수 없습니다.');
            }

            // 422 에러 (유효성 검사 에러) 처리
            if (response.status === 422) {
                throw new Error('잘못된 요청 데이터입니다. 입력값을 확인해주세요.');
            }

            // 500 에러 처리
            if (response.status === 500) {
                throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }

            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        devLog.info('Prompt deleted successfully (admin):', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete prompt (admin):', error);
        throw error;
    }
};

/**
 * 관리자용: 모든 프롬프트를 Excel 또는 CSV 파일로 다운로드하는 함수
 * @param {Object} options - 다운로드 옵션
 * @param {string} options.format - 다운로드 형식 ('excel' 또는 'csv', 기본값: 'excel')
 * @param {number} options.userId - 특정 사용자의 프롬프트만 필터링 (선택)
 * @param {string} options.language - 특정 언어로 필터링 (선택)
 * @param {boolean} options.publicAvailable - 공개 여부로 필터링 (선택)
 * @param {boolean} options.isTemplate - 템플릿 여부로 필터링 (선택)
 * @returns {Promise<Blob>} 다운로드할 파일 데이터
 */
export const downloadAllPrompts = async (options = {}) => {
    try {
        const {
            format = 'excel',
            userId = null,
            language = null,
            publicAvailable = null,
            isTemplate = null
        } = options;

        devLog.info('Downloading all prompts (admin) with options:', options);

        // URL 파라미터 구성
        const params = new URLSearchParams();
        params.append('format', format);

        if (userId !== null) params.append('user_id', userId.toString());
        if (language !== null) params.append('language', language);
        if (publicAvailable !== null) params.append('public_available', publicAvailable.toString());
        if (isTemplate !== null) params.append('is_template', isTemplate.toString());

        const response = await apiClient(`${API_BASE_URL}/api/admin/prompt/download/all-prompts?${params.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 403 에러 처리 (관리자 권한 필요)
            if (response.status === 403) {
                throw new Error('관리자 권한이 필요합니다.');
            }

            // 404 에러 처리 (데이터 없음)
            if (response.status === 404) {
                throw new Error('다운로드할 프롬프트가 없습니다.');
            }

            // 500 에러 처리
            if (response.status === 500) {
                throw new Error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
            }

            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        devLog.info('Prompts downloaded successfully (admin)');
        return blob;
    } catch (error) {
        devLog.error('Failed to download prompts (admin):', error);
        throw error;
    }
};
