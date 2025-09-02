import { SourceInfo } from "@/app/chat/types/source";
import { devLog } from "@/app/_common/utils/logger";
import { hasLatex, processLatexInText } from "@/app/_common/components/chatParser/ChatParserLatex";
import { processInlineMarkdown } from "@/app/_common/components/chatParser/ChatParserMarkdown";
import SourceButton from "@/app/chat/components/SourceButton";
import sourceStyles from '@/app/chat/assets/SourceButton.module.scss';

/**
 * Citation Placeholder 컴포넌트 - 스트리밍 중 부분적인 citation 표시
 */
export const CitationPlaceholder: React.FC = () => {
    return (
        <span
            style={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                padding: '0.125rem 0.375rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontStyle: 'italic',
                border: '1px dashed #d1d5db'
            }}
        >
            📑 출처 정보 로딩 중...
        </span>
    );
};

/**
 * Citation과 LaTeX를 포함한 텍스트 처리 - LaTeX, Citation, 마크다운 순서로 처리
 */
export const processInlineMarkdownWithCitations = (
    text: string,
    key: string,
    onViewSource?: (sourceInfo: SourceInfo) => void,
    parseCitation?: (citationText: string) => SourceInfo | null,
    isStreaming: boolean = false
): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    // 1. LaTeX와 Citation 모두 체크하여 적절히 처리
    const hasLatexContent = hasLatex(text);


    // LaTeX만 있고 Citation이 없는 경우에만 LaTeX 처리로 바로 넘김
    if (hasLatexContent && !text.includes('[Cite.')) {
        return processLatexInText(text, key, isStreaming);
    }

    // 2. parseCitation이 없으면 Citation 처리 없이 처리
    if (!parseCitation) {
        if (hasLatexContent) {
            return processLatexInText(text, key, isStreaming);
        } else {
            const processedText = processInlineMarkdown(text);
            return [<div key={key} dangerouslySetInnerHTML={{ __html: processedText }} />];
        }
    }

    // Citation을 찾기 위한 더 안전한 접근법 - 단순화
    const findCitations = (inputText: string): Array<{ start: number, end: number, content: string }> => {

        // LaTeX가 포함된 텍스트에서는 Citation 전처리를 최소화
        let preprocessedText = inputText;

        // LaTeX 영역이 아닌 곳에서만 전처리 수행
        if (!hasLatex(inputText)) {
            // 이중 중괄호를 단일 중괄호로 변환
            preprocessedText = preprocessedText.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
            // }}}] 같은 패턴을 }}] 로 정리
            preprocessedText = preprocessedText.replace(/\}\}\}/g, '}}');
            // 숫자 필드 뒤의 잘못된 따옴표 제거
            preprocessedText = preprocessedText.replace(/(\d)"\s*([,}])/g, '$1$2');
            // 문자열 필드에서 중복 따옴표 정리
            preprocessedText = preprocessedText.replace(/"""([^"]*?)"/g, '"$1"'); // 3개 따옴표 -> 1개
            preprocessedText = preprocessedText.replace(/""([^"]*?)"/g, '"$1"');  // 2개 따옴표 -> 1개
        }

        const citations: Array<{ start: number, end: number, content: string }> = [];
        let i = 0;

        while (i < preprocessedText.length) {
            // [Cite. 패턴 찾기
            const citeStart = preprocessedText.indexOf('[Cite.', i);
            if (citeStart === -1) break;

            // { 또는 {{ 찾기
            let braceStart = -1;
            for (let j = citeStart + 6; j < preprocessedText.length; j++) {
                if (preprocessedText[j] === '{') {
                    braceStart = j;
                    break;
                } else if (preprocessedText[j] !== ' ' && preprocessedText[j] !== '\t') {
                    // 공백이 아닌 다른 문자가 나오면 유효하지 않은 citation
                    break;
                }
            }

            if (braceStart === -1) {
                i = citeStart + 6;
                continue;
            }

            // 균형잡힌 괄호 찾기 - 이스케이프 문자 처리 개선
            let braceCount = 1;
            let braceEnd = -1;
            let inString = false;
            let escaped = false;

            for (let j = braceStart + 1; j < preprocessedText.length; j++) {
                const char = preprocessedText[j];

                // 이전 문자가 백슬래시인 경우 현재 문자는 이스케이프됨
                if (escaped) {
                    escaped = false;
                    continue;
                }

                // 백슬래시 처리 - 다음 문자를 이스케이프
                if (char === '\\') {
                    escaped = true;
                    continue;
                }

                // 따옴표 처리 - 문자열 상태 토글 (전처리로 인해 더 간단해짐)
                if (char === '"' && !escaped) {
                    inString = !inString;
                    continue;
                }

                // 문자열 내부가 아닐 때만 중괄호 카운팅
                if (!inString) {
                    if (char === '{') {
                        braceCount++;
                    } else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) {
                            braceEnd = j;
                            break;
                        }
                    }
                }
            }

            if (braceEnd !== -1) {
                // 닫는 ] 찾기 (선택적) - 백슬래시는 텍스트 끝까지 포함
                let finalEnd = braceEnd + 1;
                while (finalEnd < preprocessedText.length &&
                    (preprocessedText[finalEnd] === ' ' || preprocessedText[finalEnd] === '\t' ||
                        preprocessedText[finalEnd] === ']' || preprocessedText[finalEnd] === '.' ||
                        preprocessedText[finalEnd] === '\\')) {
                    if (preprocessedText[finalEnd] === ']') {
                        finalEnd++;
                        break;
                    }
                    finalEnd++;
                }

                // 텍스트 끝에 백슬래시가 있는 경우 포함
                if (finalEnd === preprocessedText.length && preprocessedText.endsWith('\\')) {
                    // 백슬래시까지 포함
                }

                const citationContent = preprocessedText.slice(citeStart, finalEnd);

                citations.push({
                    start: citeStart,
                    end: finalEnd,
                    content: citationContent
                });

                i = finalEnd;
            } else {
                i = citeStart + 6;
            }
        }

        return citations;
    };

    // 1. Citation 우선 처리 - 마크다운 파싱보다 먼저 수행
    const citations = findCitations(text);

    if (citations.length === 0) {
        // Citation이 없는 경우 부분적인 citation 확인
        const partialCitationRegex = /\[Cite\.(?:\s*\{[^}]*)?$/;
        const partialMatch = partialCitationRegex.exec(text);

        if (partialMatch) {
            // 부분적인 citation 이전 텍스트 처리 - LaTeX 먼저 확인 후 마크다운 파싱 적용
            const beforeText = text.slice(0, partialMatch.index);
            if (beforeText) {
                if (hasLatex(beforeText)) {
                    const latexElements = processLatexInText(beforeText, `${key}-text-before`, isStreaming);
                    elements.push(...latexElements);
                } else {
                    const processedText = processInlineMarkdown(beforeText);
                    elements.push(
                        <span key={`${key}-text-before`} dangerouslySetInnerHTML={{ __html: processedText }} />
                    );
                }
            }

            // 부분적인 citation placeholder 추가
            elements.push(
                <CitationPlaceholder key={`${key}-partial`} />
            );

            return [<div key={key} className={sourceStyles.lineWithCitations}>{elements}</div>];
        } else {
            // Citation이 전혀 없는 경우 LaTeX 먼저 확인 후 마크다운 파싱 적용
            if (hasLatexContent) {
                return processLatexInText(text, key, isStreaming);
            } else {
                const processedText = processInlineMarkdown(text);
                return [<div key={key} dangerouslySetInnerHTML={{ __html: processedText }} />];
            }
        }
    }

    // 2. Citation이 있는 경우 Citation과 텍스트를 분할하여 처리
    let currentIndex = 0;

    for (let i = 0; i < citations.length; i++) {
        const citation = citations[i];

        // Citation 이전 텍스트 처리 - LaTeX 먼저 확인 후 마크다운 파싱 적용
        if (citation.start > currentIndex) {
            const beforeText = text.slice(currentIndex, citation.start);
            if (beforeText.trim()) {
                if (hasLatex(beforeText)) {
                    const latexElements = processLatexInText(beforeText, `${key}-text-${i}`, isStreaming);
                    elements.push(...latexElements);
                } else {
                    const processedText = processInlineMarkdown(beforeText);
                    elements.push(
                        <span key={`${key}-text-${i}`} dangerouslySetInnerHTML={{ __html: processedText }} />
                    );
                }
            }
        }

        // Citation 처리 - 버튼으로 변환 (마크다운 파싱 제외)
        // Cite.로 시작하면 이스케이프 문자 변환: \" → "
        let processedCitationContent = citation.content;
        if (citation.content.trim().startsWith('Cite.')) {
            processedCitationContent = citation.content.replace(/\\"/g, '"');
        }
        const sourceInfo = parseCitation(processedCitationContent);


        if (sourceInfo && onViewSource) {
            elements.push(
                <SourceButton
                    key={`${key}-citation-${i}`}
                    sourceInfo={sourceInfo}
                    onViewSource={onViewSource}
                    className={sourceStyles.inlineCitation}
                />
            );
        } else {

            elements.push(
                <span key={`${key}-citation-fallback-${i}`}>
                    {processedCitationContent}
                </span>
            );
        }

        // Citation 처리 후 trailing 문자들 건너뛰기
        let nextIndex = citation.end;

        // Citation 뒤에 남은 불완전한 JSON 구문이나 특수 문자들 정리
        // }], \, 공백, 숫자, 콤마, 세미콜론 등 Citation 관련 잔여물 제거
        while (nextIndex < text.length) {
            const char = text[nextIndex];

            // Citation 관련 잔여 문자들: }, ], \, 공백, 숫자, 특수문자
            if (/[}\]\\.\s,;:]/.test(char) || /\d/.test(char)) {
                nextIndex++;
            } else {
                // 일반 텍스트 문자가 나오면 정리 중단
                break;
            }
        }

        currentIndex = nextIndex;
    }

    // 남은 텍스트 처리 - LaTeX 먼저 확인 후 마크다운 파싱 적용
    if (currentIndex < text.length) {
        const remainingText = text.slice(currentIndex);
        if (remainingText.trim()) {
            if (hasLatex(remainingText)) {
                const latexElements = processLatexInText(remainingText, `${key}-text-remaining`, isStreaming);
                elements.push(...latexElements);
            } else {
                const processedText = processInlineMarkdown(remainingText);
                elements.push(
                    <span key={`${key}-text-remaining`} dangerouslySetInnerHTML={{ __html: processedText }} />
                );
            }
        }
    }

    // Citation이 있는 경우 div로 감싸기
    return [<div key={key} className={sourceStyles.lineWithCitations}>{elements}</div>];
};

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

    // 문자열 필드와 숫자 필드를 올바르게 처리
    let processed = jsonString;

    // 이중 중괄호 {{}} 를 단일 중괄호 {} 로 변경
    processed = processed.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
    // }}}] 같은 패턴을 }}] 로 정리
    processed = processed.replace(/\}\}\}/g, '}}');

    // 문자열 필드에서 중복된 따옴표 제거
    processed = processed.replace(/"""([^"]*?)"/g, '"$1"'); // 3개 따옴표 -> 1개
    processed = processed.replace(/""([^"]*?)"/g, '"$1"');  // 2개 따옴표 -> 1개

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

    return processed;
};
