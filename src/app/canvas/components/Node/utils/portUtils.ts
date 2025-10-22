import type { Port, Parameter } from '@/app/canvas/types';

/**
 * Port의 dependency를 확인하는 유틸리티 함수들
 * NodeParameters의 dependency 로직과 동일하게 작동
 */

/**
 * Parameter 값들을 맵으로 변환
 */
export const createParameterValueMap = (parameters?: Parameter[]): Record<string, Parameter['value'] | undefined> => {
    const valueMap: Record<string, Parameter['value'] | undefined> = {};
    (parameters ?? []).forEach((param) => {
        valueMap[param.id] = param.value;
    });
    return valueMap;
};

/**
 * Boolean 값을 정규화 (문자열 'true'/'false'를 boolean으로 변환)
 */
export const normalizeBoolean = (value: Parameter['value'] | undefined): boolean | undefined => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (normalized === 'true') return true;
        if (normalized === 'false') return false;
    }
    return undefined;
};

/**
 * Port의 dependency가 만족되는지 확인
 * NodeParameters의 isDependencySatisfied와 동일한 로직
 */
export const isPortDependencySatisfied = (
    port: Port,
    parameterValueMap: Record<string, Parameter['value'] | undefined>
): boolean => {
    // dependency가 없으면 항상 표시
    if (!port.dependency) return true;

    const dependencyValue = parameterValueMap[port.dependency];
    const expectedValue = port.dependencyValue ?? true;

    // Boolean 비교
    if (typeof expectedValue === 'boolean') {
        const normalized = normalizeBoolean(dependencyValue);
        if (normalized !== undefined) return normalized === expectedValue;
        return dependencyValue === expectedValue;
    }

    // String 비교 (대소문자 무시)
    if (typeof expectedValue === 'string') {
        if (typeof dependencyValue === 'string') {
            return dependencyValue.trim().toLowerCase() === expectedValue.trim().toLowerCase();
        }
        return false;
    }

    // 기타 타입 직접 비교
    return dependencyValue === expectedValue;
};

/**
 * Port 배열을 필터링하여 dependency가 만족되는 포트만 반환
 */
export const filterPortsByDependency = (
    ports: Port[] | undefined,
    parameters: Parameter[] | undefined
): Port[] => {
    if (!ports) return [];
    
    const parameterValueMap = createParameterValueMap(parameters);
    
    return ports.filter(port => isPortDependencySatisfied(port, parameterValueMap));
};
