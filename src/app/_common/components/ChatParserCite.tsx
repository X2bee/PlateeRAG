import { SourceInfo } from "@/app/chat/types/source";
import { devLog } from "../utils/logger";

/**
 * Citation 정보를 파싱하는 함수
 */
export const parseCitation = (citationText: string): SourceInfo | null => {

    try {
        // 단계별로 다양한 패턴 시도
        let jsonString = '';

        // 먼저 균형잡힌 중괄호 찾기 (단일 또는 이중)
        const findBalancedBraces = (text: string, startPattern: string): string | null => {
            const startIdx = text.indexOf(startPattern);
            if (startIdx === -1) return null;

            let braceCount = 0;
            let endIdx = -1;
            let inString = false;
            let escaped = false;

            for (let i = startIdx; i < text.length; i++) {
                const char = text[i];

                if (escaped) {
                    escaped = false;
                    continue;
                }

                if (char === '\\') {
                    escaped = true;
                    continue;
                }

                if (char === '"' && !escaped) {
                    inString = !inString;
                    continue;
                }

                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            endIdx = i + 1;
                            break;
                        }
                    }
                }
            }

            return endIdx !== -1 ? text.slice(startIdx, endIdx) : null;
        };

        // 1. 이중 중괄호 패턴 시도
        const doubleBraceResult = findBalancedBraces(citationText, '{{');
        if (doubleBraceResult) {
            jsonString = doubleBraceResult;
        } else {
            // 2. 단일 중괄호 패턴 시도
            const singleBraceResult = findBalancedBraces(citationText, '{');
            if (singleBraceResult) {
                jsonString = singleBraceResult;
            }
        }

        if (!jsonString) {
            return null;
        }

        // JSON 문자열 정리
        jsonString = jsonString.trim();

        // 이스케이프 처리를 더 신중하게 수행
        // 우선 임시 플레이스홀더로 변환하여 다른 처리와 충돌 방지
        const ESCAPED_QUOTE_PLACEHOLDER = '__ESCAPED_QUOTE__';
        const ESCAPED_NEWLINE_PLACEHOLDER = '__ESCAPED_NEWLINE__';
        const ESCAPED_TAB_PLACEHOLDER = '__ESCAPED_TAB__';
        const ESCAPED_RETURN_PLACEHOLDER = '__ESCAPED_RETURN__';

        jsonString = jsonString.replace(/\\"/g, ESCAPED_QUOTE_PLACEHOLDER);
        jsonString = jsonString.replace(/\\n/g, ESCAPED_NEWLINE_PLACEHOLDER);
        jsonString = jsonString.replace(/\\t/g, ESCAPED_TAB_PLACEHOLDER);
        jsonString = jsonString.replace(/\\r/g, ESCAPED_RETURN_PLACEHOLDER);
        jsonString = jsonString.replace(/\\+/g, '\\');

        // 플레이스홀더를 실제 값으로 복원 - \" 를 " 로 변환
        jsonString = jsonString.replace(new RegExp(ESCAPED_QUOTE_PLACEHOLDER, 'g'), '"');
        jsonString = jsonString.replace(new RegExp(ESCAPED_NEWLINE_PLACEHOLDER, 'g'), '\n');
        jsonString = jsonString.replace(new RegExp(ESCAPED_TAB_PLACEHOLDER, 'g'), '\t');
        jsonString = jsonString.replace(new RegExp(ESCAPED_RETURN_PLACEHOLDER, 'g'), '\r');

        // JSON 문자열 전처리 - 데이터 타입 정규화
        jsonString = preprocessJsonString(jsonString);

        // 한국어가 포함된 경우를 위한 UTF-8 처리
        try {
            const sourceInfo = JSON.parse(jsonString);

            devLog.log('✅ [parseCitation] JSON parsed successfully:', sourceInfo);

            // 필수 필드 확인
            if (!sourceInfo.file_name && !sourceInfo.filename && !sourceInfo.fileName &&
                !sourceInfo.file_path && !sourceInfo.filepath && !sourceInfo.filePath) {
                devLog.warn('Missing required fields in citation:', sourceInfo);
                return null;
            }

            const result = {
                file_name: sourceInfo.file_name || sourceInfo.filename || sourceInfo.fileName || '',
                file_path: sourceInfo.file_path || sourceInfo.filepath || sourceInfo.filePath || '',
                page_number: sourceInfo.page_number || sourceInfo.pagenumber || sourceInfo.pageNumber || 1,
                line_start: sourceInfo.line_start || sourceInfo.linestart || sourceInfo.lineStart || 1,
                line_end: sourceInfo.line_end || sourceInfo.lineend || sourceInfo.lineEnd || 1
            };


            return result;
        } catch (parseError) {
            console.error('JSON.parse failed, trying manual parsing...');

            // 수동 파싱 시도
            const manualParsed = tryManualParsing(jsonString);
            if (manualParsed) {
                return manualParsed;
            }

            throw parseError;
        }

    } catch (error) {
        return null;
    }
};

/**
 * 수동으로 JSON 파싱을 시도하는 헬퍼 함수
 */
const tryManualParsing = (jsonString: string): SourceInfo | null => {
    try {
        // 기본적인 JSON 형태인지 확인
        if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
            return null;
        }

        const result: Partial<SourceInfo> = {};

        // 각 필드를 개별적으로 추출
        const fileNameMatch = jsonString.match(/"(?:file_name|filename|fileName)"\s*:\s*"([^"]+)"/);
        if (fileNameMatch) result.file_name = fileNameMatch[1];

        const filePathMatch = jsonString.match(/"(?:file_path|filepath|filePath)"\s*:\s*"([^"]+)"/);
        if (filePathMatch) result.file_path = filePathMatch[1];

        const pageNumberMatch = jsonString.match(/"(?:page_number|pagenumber|pageNumber)"\s*:\s*(\d+)/);
        if (pageNumberMatch) result.page_number = parseInt(pageNumberMatch[1]);

        const lineStartMatch = jsonString.match(/"(?:line_start|linestart|lineStart)"\s*:\s*(\d+)/);
        if (lineStartMatch) result.line_start = parseInt(lineStartMatch[1]);

        const lineEndMatch = jsonString.match(/"(?:line_end|lineend|lineEnd)"\s*:\s*(\d+)/);
        if (lineEndMatch) result.line_end = parseInt(lineEndMatch[1]);

        // 최소한 file_name이나 file_path가 있어야 함
        if (result.file_name || result.file_path) {
            return {
                file_name: result.file_name || '',
                file_path: result.file_path || '',
                page_number: result.page_number || 1,
                line_start: result.line_start || 1,
                line_end: result.line_end || 1
            };
        }

        return null;
    } catch (error) {
        return null;
    }
};

const preprocessJsonString = (jsonString: string): string => {
    console.log('🔍 [preprocessJsonString] Input:', jsonString);

    // 문자열 필드와 숫자 필드를 올바르게 처리
    let processed = jsonString;

    // 이중 중괄호 {{}} 를 단일 중괄호 {} 로 변경
    processed = processed.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
    // }}}] 같은 패턴을 }}] 로 정리
    processed = processed.replace(/\}\}\}/g, '}}');
    console.log('🔍 [preprocessJsonString] After brace fix:', processed);

    // 문자열 필드에서 중복된 따옴표 제거
    processed = processed.replace(/"""([^"]*?)"/g, '"$1"'); // 3개 따옴표 -> 1개
    processed = processed.replace(/""([^"]*?)"/g, '"$1"');  // 2개 따옴표 -> 1개
    console.log('🔍 [preprocessJsonString] After quote dedup:', processed);

    // 숫자 필드들에 대해 따옴표가 있으면 제거하고, 없으면 그대로 유지
    const numericFields = ['page_number', 'line_start', 'line_end'];

    numericFields.forEach(field => {
        // "field": "숫자" 형태를 "field": 숫자 로 변경
        const quotedNumberPattern = new RegExp(`"${field}"\\s*:\\s*"(\\d+)"`, 'g');
        processed = processed.replace(quotedNumberPattern, `"${field}": $1`);

        // "field": 숫자" 형태 (끝에 쌍따옴표가 남은 경우) 를 "field": 숫자 로 변경
        const malformedNumberPattern = new RegExp(`"${field}"\\s*:\\s*(\\d+)"`, 'g');
        processed = processed.replace(malformedNumberPattern, `"${field}": $1`);
    });
    console.log('🔍 [preprocessJsonString] After numeric fix:', processed);

    console.log('🔍 [preprocessJsonString] Final output:', processed);

    return processed;
};