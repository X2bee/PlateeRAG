/**
 * 문자열이 JSON 형태인지 확인
 */
export const isJsonString = (str: string): boolean => {
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
 * ChatParserNonStr 로직을 적용한 변환 함수
 * 다양한 타입의 데이터를 문자열로 변환
 */
export const convertOutputToString = (data: any): string => {
    // null이나 undefined인 경우
    if (data === null || data === undefined) {
        return '';
    }

    // 이미 문자열인 경우
    if (typeof data === 'string') {
        // JSON 문자열인지 확인 (객체나 배열 형태)
        if (isJsonString(data)) {
            try {
                // JSON 파싱 후 다시 보기 좋게 포맷팅
                const parsed = JSON.parse(data);
                return JSON.stringify(parsed, null, 2);
            } catch (error) {
                return data;
            }
        }
        return data;
    }

    // 숫자나 불린값인 경우
    if (typeof data === 'number' || typeof data === 'boolean') {
        return String(data);
    }

    // 배열이나 객체인 경우 JSON 형태로 변환
    if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
        try {
            return JSON.stringify(data, null, 2);
        } catch (error) {
            return String(data);
        }
    }

    // 기타 경우 문자열로 변환
    return String(data);
};

/**
 * 출력 데이터에서 특정 태그와 마크업을 제거하여 가공된 출력을 반환
 */
export const parseActualOutput = (output: string | null | undefined): string => {
    if (!output) return '';

    // output을 적절한 형태로 변환
    let processedOutput = convertOutputToString(output);

    // 이미 문자열로 변환된 결과에서 태그 제거
    processedOutput = processedOutput.replace(/<think>[\s\S]*?<\/think>/gi, '');

    if (processedOutput.includes('<TOOLUSELOG>') && processedOutput.includes('</TOOLUSELOG>')) {
        processedOutput = processedOutput.replace(/<TOOLUSELOG>[\s\S]*?<\/TOOLUSELOG>/g, '');
    }

    if (processedOutput.includes('<TOOLOUTPUTLOG>') && processedOutput.includes('</TOOLOUTPUTLOG>')) {
        processedOutput = processedOutput.replace(/<TOOLOUTPUTLOG>[\s\S]*?<\/TOOLOUTPUTLOG>/g, '');
    }

    if (processedOutput.includes('<at>') && processedOutput.includes('</at>')) {
        processedOutput = processedOutput.replace(/<at>[\s\S]*?<\/at>/gi, '');
    }

    if (processedOutput.includes('[Cite.') && processedOutput.includes('}]')) {
        processedOutput = processedOutput.replace(/\[Cite\.\s*\{[\s\S]*?\}\]/g, '');
    }

    // FEEDBACK_LOOP 관련 태그 제거
    if (processedOutput.includes('<FEEDBACK_LOOP>') && processedOutput.includes('</FEEDBACK_LOOP>')) {
        processedOutput = processedOutput.replace(/<FEEDBACK_LOOP>[\s\S]*?<\/FEEDBACK_LOOP>/g, '');
    }

    if (processedOutput.includes('<FEEDBACK_STATUS>') && processedOutput.includes('</FEEDBACK_STATUS>')) {
        processedOutput = processedOutput.replace(/<FEEDBACK_STATUS>[\s\S]*?<\/FEEDBACK_STATUS>/g, '');
    }

    if (processedOutput.includes('<FEEDBACK_RESULT>') && processedOutput.includes('</FEEDBACK_RESULT>')) {
        processedOutput = processedOutput.replace(/<FEEDBACK_RESULT>[\s\S]*?<\/FEEDBACK_RESULT>/g, '');
    }

    if (processedOutput.includes('<FEEDBACK_REPORT>') && processedOutput.includes('</FEEDBACK_REPORT>')) {
        processedOutput = processedOutput.replace(/<FEEDBACK_REPORT>[\s\S]*?<\/FEEDBACK_REPORT>/g, '');
    }

    if (processedOutput.includes('<TODO_DETAILS>') && processedOutput.includes('</TODO_DETAILS>')) {
        processedOutput = processedOutput.replace(/<TODO_DETAILS>[\s\S]*?<\/TODO_DETAILS>/g, '');
    }

    return processedOutput.trim();
};
