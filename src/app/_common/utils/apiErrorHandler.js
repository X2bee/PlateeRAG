import { devLog } from './logger';

/**
 * API 함수에 공통 에러 처리를 적용하는 고차 함수
 * @param {Function} apiFunction - 실행할 API 함수
 * @param {string} errorContext - 에러 발생 시 표시할 컨텍스트 메시지
 * @returns {Function} 에러 처리가 적용된 함수
 */
export const withErrorHandler = (apiFunction, errorContext) => {
    return async (...args) => {
        try {
            return await apiFunction(...args);
        } catch (error) {
            devLog.error(`${errorContext}:`, error);
            throw error;
        }
    };
};

/**
 * 여러 API 함수에 일괄적으로 에러 처리를 적용하는 헬퍼 함수
 * @param {Object} apiModule - API 함수들이 담긴 객체
 * @param {string} moduleContext - 모듈명 (예: 'Config API', 'Embedding API')
 * @returns {Object} 에러 처리가 적용된 API 함수들
 */
export const wrapApiModule = (apiModule, moduleContext) => {
    const wrappedModule = {};
    
    Object.keys(apiModule).forEach(functionName => {
        if (typeof apiModule[functionName] === 'function') {
            const errorContext = `${moduleContext} - ${functionName}`;
            wrappedModule[functionName] = withErrorHandler(apiModule[functionName], errorContext);
        } else {
            wrappedModule[functionName] = apiModule[functionName];
        }
    });
    
    return wrappedModule;
};

/**
 * 개별 함수에 컨텍스트와 함께 에러 처리를 적용하는 데코레이터
 * @param {string} context - 에러 컨텍스트
 * @returns {Function} 데코레이터 함수
 */
export const apiErrorHandler = (context) => {
    return (target, propertyKey, descriptor) => {
        const originalMethod = descriptor.value;
        descriptor.value = withErrorHandler(originalMethod, context);
        return descriptor;
    };
};