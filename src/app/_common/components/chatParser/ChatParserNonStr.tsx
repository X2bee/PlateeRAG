/**
 * 문자열이 아닌 데이터를 문자열로 변환하는 유틸리티
 * List[dict], 객체, 배열 등 다양한 형태의 데이터를 JSON 형태로 처리
 */

/**
 * 다양한 타입의 데이터를 문자열로 변환
 */
export const convertToString = (data: any): string => {
    // null이나 undefined인 경우
    if (data === null || data === undefined) {
        return '';
    }

    // 이미 문자열인 경우
    if (typeof data === 'string') {
        // JSON 문자열인지 확인 (객체나 배열 형태)
        if (isJsonString(data)) {
            return `\`\`\`json\n${data}\n\`\`\``;
        }

        return data;
    }

    // 숫자나 불린값인 경우
    if (typeof data === 'number' || typeof data === 'boolean') {
        return String(data);
    }

    // 배열이나 객체인 경우 JSON 형태로 변환
    // List[dict] 형태, 일반 배열, 객체 모두 포함
    if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
        return convertToJsonString(data);
    }

    // 기타 경우 문자열로 변환
    return String(data);
};/**
 * 배열이나 객체를 JSON 문자열로 변환
 */
const convertToJsonString = (data: any): string => {
    try {
        const jsonString = JSON.stringify(data, null, 2);
        return `\`\`\`json\n${jsonString}\n\`\`\``;
    } catch (error) {
        // JSON 변환에 실패한 경우 문자열로 변환
        return String(data);
    }
};

/**
 * 문자열이 JSON 형태인지 확인
 */
const isJsonString = (str: string): boolean => {
    try {
        const trimmed = str.trim();
        if (!trimmed) return false;

        // JSON 객체나 배열로 시작하는지 확인
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
            (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            JSON.parse(trimmed);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
};

/**
 * 데이터가 변환이 필요한 형태인지 확인
 */
export const needsConversion = (data: any): boolean => {
    // 문자열이 아니고, null/undefined가 아닌 모든 데이터는 변환 필요
    // List[dict], 배열, 객체, 숫자, 불린값 등 모두 포함
    let needs = typeof data !== 'string' && data !== null && data !== undefined;

    // 문자열이지만 JSON 형태인 경우도 변환 필요
    if (typeof data === 'string' && isJsonString(data)) {
        needs = true;
    }

    return needs;
};
