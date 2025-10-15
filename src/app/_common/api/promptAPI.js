// Prompt API 호출 함수들을 관리하는 파일
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';
import { apiClient } from '@/app/_common/api/helper/apiClient';

/**
 * 프롬프트 목록을 가져오는 함수
 * @param {Object} options - 옵션 객체
 * @param {number} options.limit - 반환할 프롬프트 수 (기본값: 300)
 * @param {number} options.offset - 건너뛸 프롬프트 수 (기본값: 0)
 * @param {string} options.language - 언어 필터 (en, ko)
 * @returns {Promise<Object>} 프롬프트 목록
 */
export const getPromptList = async (options = {}) => {
    try {
        const {
            limit = 300,
            offset = 0,
            language = null
        } = options;

        devLog.info('Fetching prompt list with options:', options);

        // URL 파라미터 구성
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        if (language) params.append('language', language);

        const response = await apiClient(`${API_BASE_URL}/api/prompt/list?${params.toString()}`, {
            method: 'GET',
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

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
        devLog.info('Prompt list fetched successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to fetch prompt list:', error);
        throw error;
    }
};

/**
 * 특정 언어의 프롬프트만 가져오는 함수
 * @param {string} language - 언어 코드 (en, ko)
 * @param {number} limit - 최대 결과 수 (선택사항)
 * @returns {Promise<Object>} 해당 언어의 프롬프트 목록
 */
export const getPromptsByLanguage = async (language, limit = null) => {
    try {
        devLog.info(`Fetching prompts by language: ${language}`);

        const options = {
            language: language,
            limit: limit || 300
        };

        const data = await getPromptList(options);

        const result = {
            prompts: data.prompts || [],
            total: data.total_count || 0,
            language: language,
            limit: limit
        };

        devLog.info('Prompts by language fetched:', result);
        return result;
    } catch (error) {
        devLog.error(`Failed to fetch prompts by language ${language}:`, error);
        throw error;
    }
};



/**
 * 새로운 프롬프트를 생성하는 함수
 * @param {Object} promptData - 프롬프트 데이터 객체
 * @param {string} promptData.prompt_title - 프롬프트 제목
 * @param {string} promptData.prompt_content - 프롬프트 내용
 * @param {boolean} promptData.public_available - 공개 여부 (기본값: false)
 * @param {string} promptData.language - 언어 (기본값: "ko")
 * @returns {Promise<Object>} 생성된 프롬프트 정보
 */
export const createPrompt = async (promptData) => {
    try {
        devLog.info('Creating new prompt:', promptData);

        const response = await apiClient(`${API_BASE_URL}/api/prompt/create`, {
            method: 'POST',
            body: JSON.stringify(promptData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 401 에러 처리 (인증 필요)
            if (response.status === 401) {
                throw new Error('로그인이 필요합니다.');
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
        devLog.info('Prompt created successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to create prompt:', error);
        throw error;
    }
};

/**
 * 프롬프트를 삭제하는 함수
 * @param {Object} promptData - 프롬프트 데이터 객체
 * @param {string} promptData.prompt_uid - 프롬프트 UID
 * @returns {Promise<Object>} 삭제 결과
 */
export const deletePrompt = async (promptData) => {
    try {
        devLog.info('Deleting prompt:', promptData);

        const response = await apiClient(`${API_BASE_URL}/api/prompt/delete`, {
            method: 'DELETE',
            body: JSON.stringify(promptData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 401 에러 처리 (인증 필요)
            if (response.status === 401) {
                throw new Error('로그인이 필요합니다.');
            }

            // 404 에러 처리 (프롬프트를 찾을 수 없거나 접근 거부)
            if (response.status === 404) {
                throw new Error('프롬프트를 찾을 수 없거나 삭제 권한이 없습니다.');
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
        devLog.info('Prompt deleted successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to delete prompt:', error);
        throw error;
    }
};

/**
 * 프롬프트를 업데이트하는 함수
 * @param {Object} promptData - 프롬프트 데이터 객체
 * @param {string} promptData.prompt_uid - 프롬프트 UID
 * @param {string} promptData.prompt_title - 프롬프트 제목 (선택)
 * @param {string} promptData.prompt_content - 프롬프트 내용 (선택)
 * @param {boolean} promptData.public_available - 공개 여부 (선택)
 * @param {string} promptData.language - 언어 (선택)
 * @returns {Promise<Object>} 업데이트 결과
 */
export const updatePrompt = async (promptData) => {
    try {
        devLog.info('Updating prompt:', promptData);

        const response = await apiClient(`${API_BASE_URL}/api/prompt/update`, {
            method: 'POST',
            body: JSON.stringify(promptData)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // 401 에러 처리 (인증 필요)
            if (response.status === 401) {
                throw new Error('로그인이 필요합니다.');
            }

            // 404 에러 처리 (프롬프트를 찾을 수 없거나 접근 거부)
            if (response.status === 404) {
                throw new Error('프롬프트를 찾을 수 없거나 수정 권한이 없습니다.');
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
        devLog.info('Prompt updated successfully:', data);
        return data;
    } catch (error) {
        devLog.error('Failed to update prompt:', error);
        throw error;
    }
};

/**
 * 프롬프트에 평점을 부여합니다.
 * @param {string} promptUid - 평가할 프롬프트 UID
 * @param {number} userId - 원본 프롬프트의 사용자 ID
 * @param {boolean} isTemplate - 템플릿 프롬프트 여부
 * @param {number} rating - 평점 (1-5)
 * @returns {Promise<Object>} 평가 결과를 포함하는 프로미스
 * @throws {Error} API 요청이 실패하면 에러를 발생시킵니다.
 */
export const ratePrompt = async (promptUid, userId, isTemplate, rating) => {
    try {
        if (rating < 1 || rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        const params = new URLSearchParams({
            user_id: userId,
            is_template: isTemplate,
            rating: rating
        });

        const response = await apiClient(
            `${API_BASE_URL}/api/prompt/rating/${encodeURIComponent(promptUid)}?${params}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        devLog.log('Prompt rating response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            devLog.error('Prompt rating error data:', errorData);
            throw new Error(
                errorData.detail || `HTTP error! status: ${response.status}`,
            );
        }

        const result = await response.json();
        devLog.log('Successfully rated prompt:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to rate prompt:', error);
        devLog.error('Prompt UID that failed:', promptUid);
        devLog.error('Rating that failed:', rating);
        throw error;
    }
};
