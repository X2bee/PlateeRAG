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
 * @param {boolean} options.is_template - 템플릿 상태 필터
 * @param {boolean} options.public_available - 공개 가능 여부 필터
 * @param {string} options.search - 검색어 (제목과 내용에서 검색)
 * @returns {Promise<Object>} 프롬프트 목록
 */
export const getPromptList = async (options = {}) => {
    try {
        const {
            limit = 300,
            offset = 0,
            language = null,
            is_template = null,
            public_available = null,
            search = null
        } = options;

        devLog.info('Fetching prompt list with options:', options);

        // URL 파라미터 구성
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());

        if (language) params.append('language', language);
        if (is_template !== null) params.append('is_template', is_template.toString());
        if (public_available !== null) params.append('public_available', public_available.toString());
        if (search) params.append('search', search);

        const response = await apiClient(`${API_BASE_URL}/api/prompt/list?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
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
 * 프롬프트 목록을 필터링하여 가져오는 함수
 * @param {Object} filters - 필터 조건
 * @param {string} filters.language - 언어 필터 (en, ko)
 * @param {boolean} filters.templateOnly - 템플릿만 가져올지 여부
 * @param {boolean} filters.publicOnly - 공개 프롬프트만 가져올지 여부
 * @param {string} filters.searchTerm - 검색어
 * @param {number} filters.limit - 최대 결과 수
 * @returns {Promise<Object>} 필터링된 프롬프트 목록
 */
export const getFilteredPrompts = async (filters = {}) => {
    try {
        devLog.info('Fetching filtered prompts with filters:', filters);

        const options = {
            limit: filters.limit || 300,
            offset: 0,
            language: filters.language || null,
            is_template: filters.templateOnly || null,
            public_available: filters.publicOnly || null,
            search: filters.searchTerm || null
        };

        const data = await getPromptList(options);

        const result = {
            prompts: data.prompts || [],
            total: data.total_count || 0,
            filters: filters
        };

        devLog.info('Filtered prompts fetched:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch filtered prompts:', error);
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
 * 템플릿 프롬프트만 가져오는 함수
 * @param {number} limit - 최대 결과 수 (선택사항)
 * @returns {Promise<Object>} 템플릿 프롬프트 목록
 */
export const getTemplatePrompts = async (limit = null) => {
    try {
        devLog.info('Fetching template prompts');

        const options = {
            is_template: true,
            limit: limit || 300
        };

        const data = await getPromptList(options);

        const result = {
            prompts: data.prompts || [],
            total: data.total_count || 0,
            limit: limit
        };

        devLog.info('Template prompts fetched:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch template prompts:', error);
        throw error;
    }
};

/**
 * 공개 프롬프트만 가져오는 함수
 * @param {number} limit - 최대 결과 수 (선택사항)
 * @returns {Promise<Object>} 공개 프롬프트 목록
 */
export const getPublicPrompts = async (limit = null) => {
    try {
        devLog.info('Fetching public prompts');

        const options = {
            public_available: true,
            limit: limit || 300
        };

        const data = await getPromptList(options);

        const result = {
            prompts: data.prompts || [],
            total: data.total_count || 0,
            limit: limit
        };

        devLog.info('Public prompts fetched:', result);
        return result;
    } catch (error) {
        devLog.error('Failed to fetch public prompts:', error);
        throw error;
    }
};

/**
 * 프롬프트 검색 함수
 * @param {string} searchTerm - 검색어
 * @param {Object} options - 추가 옵션
 * @param {string} options.language - 언어 필터
 * @param {boolean} options.templateOnly - 템플릿만 검색할지 여부
 * @param {number} options.limit - 최대 결과 수
 * @returns {Promise<Object>} 검색 결과
 */
export const searchPrompts = async (searchTerm, options = {}) => {
    try {
        if (!searchTerm) {
            throw new Error('Search term is required');
        }

        devLog.info(`Searching prompts with term: ${searchTerm}`, options);

        const searchOptions = {
            search: searchTerm,
            language: options.language || null,
            is_template: options.templateOnly || null,
            limit: options.limit || 300
        };

        const data = await getPromptList(searchOptions);

        const result = {
            prompts: data.prompts || [],
            total: data.total_count || 0,
            searchTerm: searchTerm,
            options: options
        };

        devLog.info('Prompt search completed:', result);
        return result;
    } catch (error) {
        devLog.error(`Failed to search prompts with term ${searchTerm}:`, error);
        throw error;
    }
};

/**
 * 프롬프트 통계 정보를 가져오는 함수
 * @returns {Promise<Object>} 통계 정보
 */
export const getPromptStats = async () => {
    try {
        devLog.info('Fetching prompt statistics...');

        // 전체, 템플릿, 공개 프롬프트를 각각 가져와서 통계 계산
        const [allPrompts, templatePrompts, publicPrompts] = await Promise.allSettled([
            getPromptList({ limit: 1000 }),
            getTemplatePrompts(1000),
            getPublicPrompts(1000)
        ]);

        const stats = {
            total: 0,
            templates: 0,
            public: 0,
            private: 0,
            languages: {
                en: 0,
                ko: 0,
                other: 0
            },
            last_updated: new Date().toISOString()
        };

        // 전체 프롬프트 통계
        if (allPrompts.status === 'fulfilled' && allPrompts.value?.prompts) {
            const prompts = allPrompts.value.prompts;
            stats.total = prompts.length;

            // 언어별 통계
            prompts.forEach(prompt => {
                if (prompt.language === 'en') {
                    stats.languages.en++;
                } else if (prompt.language === 'ko') {
                    stats.languages.ko++;
                } else {
                    stats.languages.other++;
                }

                // 공개/비공개 통계
                if (prompt.public_available) {
                    stats.public++;
                } else {
                    stats.private++;
                }
            });
        }

        // 템플릿 통계
        if (templatePrompts.status === 'fulfilled' && templatePrompts.value?.prompts) {
            stats.templates = templatePrompts.value.prompts.length;
        }

        devLog.info('Prompt statistics calculated:', stats);
        return stats;
    } catch (error) {
        devLog.error('Failed to fetch prompt statistics:', error);
        throw error;
    }
};
