import { devLog } from './logger';

// Generic type for the functions we'll be wrapping
type AnyFunction = (...args: any[]) => any;

/**
 * API 함수에 공통 에러 처리를 적용하는 고차 함수
 * @param apiFunction - 실행할 API 함수
 * @param errorContext - 에러 발생 시 표시할 컨텍스트 메시지
 * @returns 에러 처리가 적용된 함수
 */
export const withErrorHandler = <T extends AnyFunction>(
    apiFunction: T,
    errorContext: string,
): ((...args: Parameters<T>) => Promise<ReturnType<T>>) => {
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await apiFunction(...args);
        } catch (error) {
            devLog.error(`${errorContext}:`, error);
            // Re-throw the error to be handled by the caller
            throw error;
        }
    };
};

/**
 * 여러 API 함수에 일괄적으로 에러 처리를 적용하는 헬퍼 함수
 * @param apiModule - API 함수들이 담긴 객체
 * @param moduleContext - 모듈명 (예: 'Config API', 'Embedding API')
 * @returns 에러 처리가 적용된 API 함수들
 */
export const wrapApiModule = <T extends Record<string, AnyFunction>>(
    apiModule: T,
    moduleContext: string,
): T => {
    const wrappedModule = {} as T;

    for (const functionName in apiModule) {
        if (Object.prototype.hasOwnProperty.call(apiModule, functionName)) {
            const originalFunction = apiModule[functionName];
            if (typeof originalFunction === 'function') {
                const errorContext = `${moduleContext} - ${functionName}`;
                wrappedModule[functionName] = withErrorHandler(originalFunction, errorContext) as any;
            } else {
                wrappedModule[functionName] = originalFunction;
            }
        }
    }

    return wrappedModule;
};

/**
 * 개별 함수에 컨텍스트와 함께 에러 처리를 적용하는 데코레이터 (For Class Methods)
 * @param context - 에러 컨텍스트
 * @returns 데코레이터 함수
 */
export function apiErrorHandler(context: string) {
    return (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor,
    ) => {
        const originalMethod = descriptor.value;

        if (typeof originalMethod !== 'function') {
            throw new Error('apiErrorHandler decorator can only be applied to methods.');
        }

        descriptor.value = withErrorHandler(originalMethod.bind(target), context);

        return descriptor;
    };
}
