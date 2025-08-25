'use client';

import React from 'react';
import styles from '@/app/chat/assets/chatParser.module.scss';
import { APP_CONFIG } from '@/app/config';
import { SourceInfo } from '@/app/chat/types/source';
import { devLog } from '@/app/_common/utils/logger';
import { ThinkBlock, findThinkBlocks, type ThinkBlockInfo } from './ChatParserThink';
import { CodeBlock, findCodeBlocks, type CodeBlockInfo, detectCodeLanguage, truncateText } from '@/app/_common/components/ChatParserCode';
import {
    ToolUseLogBlock,
    findToolUseLogBlocks,
    findToolOutputLogBlocks,
    parseToolUseLogContent,
    parseToolOutputContent,
    type ToolUseLogInfo,
    type ToolOutputLogInfo
} from '@/app/_common/components/ChatParserToolResponse';
import {
    CitationPlaceholder,
    isSeparatorLine,
    cleanupJsonFragments,
    getLastLines,
    processInlineMarkdown,
    processInlineMarkdownWithCitations,
    parseSimpleMarkdown
} from '@/app/_common/components/ChatParserMarkdown';

// Think 블록 표시 여부를 제어하는 상수 (환경변수에서 가져옴)
const showThinkBlock = APP_CONFIG.SHOW_THINK_BLOCK;
// const showToolOutputBlock = APP_CONFIG.SHOW_TOOL_OUTPUT_BLOCK;
const showToolOutputBlock = true;

export interface ParsedContent {
    html: string;
    plainText: string;
}

interface MessageRendererProps {
    content: string;
    isUserMessage?: boolean;
    className?: string;
    onViewSource?: (sourceInfo: SourceInfo) => void;
}
const preprocessJsonString = (jsonString: string): string => {
    console.log('🔍 [preprocessJsonString] Input:', jsonString);

    // 문자열 필드와 숫자 필드를 올바르게 처리
    let processed = jsonString;

    // 이중 중괄호 {{}} 를 단일 중괄호 {} 로 변경
    processed = processed.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
    console.log('🔍 [preprocessJsonString] After brace fix:', processed);

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

    // 문자열 필드에서 중복된 따옴표 제거 먼저 수행
    processed = processed.replace(/"""([^"]*?)"/g, '"$1"'); // 3개 따옴표 -> 1개
    processed = processed.replace(/""([^"]*?)"/g, '"$1"');  // 2개 따옴표 -> 1개
    console.log('🔍 [preprocessJsonString] After quote dedup:', processed);

    console.log('🔍 [preprocessJsonString] Final output:', processed);

    return processed;
};

/**
 * Citation 정보를 파싱하는 함수
 */
const parseCitation = (citationText: string): SourceInfo | null => {
    console.log('🔍 [parseCitation] Raw citation text:', JSON.stringify(citationText));
    console.log('🔍 [parseCitation] Citation text length:', citationText.length);
    console.log('🔍 [parseCitation] Contains {{:', citationText.includes('{{'));
    console.log('🔍 [parseCitation] Contains }}:', citationText.includes('}}'));

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
        console.log('🔍 [parseCitation] After preprocessing:', jsonString);

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

            console.log('✅ [parseCitation] Final result:', result);

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

/**
 * 마크다운 메시지 렌더러 컴포넌트
 */
interface MessageRendererProps {
    content: string;
    isUserMessage?: boolean;
    className?: string;
    onViewSource?: (sourceInfo: SourceInfo) => void;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
    content,
    isUserMessage = false,
    className = '',
    onViewSource
}) => {

    if (!content) {
        return null;
    }

    if (isUserMessage) {
        return (
            <div className={`${styles.markdownContent} ${className}`}>
                {content}
            </div>
        );
    }

    const parsedElements = parseContentToReactElements(content, onViewSource);

    return (
        <div
            className={`${styles.markdownContent} ${className}`}
            style={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
            }}
        >
            {parsedElements}
        </div>
    );
};

/**
 * 컨텐츠를 React 엘리먼트로 파싱
 */
const parseContentToReactElements = (content: string, onViewSource?: (sourceInfo: SourceInfo) => void): React.ReactNode[] => {
    let processed = content;

    // 이스케이프된 문자 처리
    processed = processed.replace(/\\n/g, '\n');
    processed = processed.replace(/\\t/g, '\t');
    processed = processed.replace(/\\r/g, '\r');

    // 불필요한 따옴표 제거 (문장 전체를 감싸는 따옴표)
    processed = processed.trim();
    if ((processed.startsWith('"') && processed.endsWith('"')) ||
        (processed.startsWith("'") && processed.endsWith("'"))) {
        // 전체를 감싸는 따옴표인지 확인 (중간에 닫는 따옴표가 없어야 함)
        const quote = processed[0];
        const inner = processed.slice(1, -1);
        if (!inner.includes(quote) || inner.lastIndexOf(quote) < inner.length - 1) {
            processed = inner;
        }
    }

    // JSON 형태 처리
    if (processed.trim().startsWith('{') || processed.trim().startsWith('[')) {
        try {
            const jsonData = JSON.parse(processed);
            if (typeof jsonData === 'object') {
                processed = JSON.stringify(jsonData, null, 2);
            }
        } catch {
            // JSON 파싱 실패시 원본 텍스트 사용
        }
    }

    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    // Think 블록, Tool Use Log 블록, Tool Output Log 블록 먼저 처리
    const thinkBlocks = findThinkBlocks(processed);
    const toolUseLogBlocks = findToolUseLogBlocks(processed);
    const toolOutputLogBlocks = findToolOutputLogBlocks(processed);
    // 코드 블록 처리
    const codeBlocks = findCodeBlocks(processed);

    // 모든 블록을 시작 위치 순으로 정렬
    const allBlocks = [
        ...thinkBlocks.map(block => ({ ...block, type: 'think' as const })),
        ...toolUseLogBlocks.map(block => ({ ...block, type: 'tooluselog' as const })),
        ...toolOutputLogBlocks.map(block => ({ ...block, type: 'tooloutputlog' as const })),
        ...codeBlocks.map(block => ({ ...block, type: 'code' as const }))
    ].sort((a, b) => a.start - b.start);

    for (const block of allBlocks) {
        // 블록 이전 텍스트 처리
        if (block.start > currentIndex) {
            const beforeText = processed.slice(currentIndex, block.start);
            elements.push(...parseSimpleMarkdown(beforeText, elements.length, onViewSource, parseCitation));
        }

        // 블록 타입에 따라 컴포넌트 추가
        if (block.type === 'think') {
            // 스트리밍 중인지 확인 (블록이 문서 끝까지 이어지고 </think>가 없는 경우)
            const isStreaming = block.end === processed.length &&
                !processed.slice(block.start).includes('</think>');

            // showThinkBlock이 false이고 완성된 블록인 경우 숨김
            if (!showThinkBlock && !isStreaming) {
                // 완성된 think 블록은 렌더링하지 않음
            } else {
                // showThinkBlock이 false이면서 스트리밍 중이라면 애니메이션 프리뷰 모드로 전달
                const streamingPreview = (!showThinkBlock && isStreaming);
                elements.push(
                    <ThinkBlock
                        key={`think-${elements.length}`}
                        content={block.content}
                        isStreaming={isStreaming}
                        streamingPreview={streamingPreview}
                        previewLines={3}
                    />
                );
            }
        } else if (block.type === 'tooluselog') {
            // 스트리밍 중인지 확인 (블록이 문서 끝까지 이어지고 </TOOLUSELOG>가 없는 경우)
            const isStreaming = block.end === processed.length &&
                !processed.slice(block.start).includes('</TOOLUSELOG>');

            // 해당 도구 사용 로그 바로 다음에 오는 도구 출력 로그 찾기
            const nextOutputBlock = toolOutputLogBlocks.find(outputBlock =>
                outputBlock.start >= block.end &&
                outputBlock.start <= block.end + 100 // 100자 이내에 있는 경우만
            );

            // showToolOutputBlock이 false이고 완성된 블록인 경우 숨김
            if (!showToolOutputBlock && !isStreaming) {
                // 완성된 tool use log 블록은 렌더링하지 않음
            } else {
                // showToolOutputBlock이 false이면서 스트리밍 중이라면 애니메이션 프리뷰 모드로 전달
                const streamingPreview = (!showToolOutputBlock && isStreaming);

                // ToolUseLogBlock 컴포넌트를 새로운 모듈에서 import한 것으로 사용
                // parseToolOutputContent에서 parseCitation 함수가 필요하므로 커스텀 파싱 적용
                const customParsedOutputs = nextOutputBlock?.content ?
                    parseToolOutputContent(nextOutputBlock.content, parseCitation) : undefined;

                elements.push(
                    <ToolUseLogBlock
                        key={`tooluselog-${elements.length}`}
                        content={block.content}
                        outputContent={nextOutputBlock?.content}
                        isStreaming={isStreaming}
                        streamingPreview={streamingPreview}
                        previewLines={3}
                        onViewSource={onViewSource}
                        parseCitation={parseCitation}
                        customParsedOutputs={customParsedOutputs}
                    />
                );
            }
        } else if (block.type === 'tooloutputlog') {
            // 도구 출력 로그는 독립적으로 렌더링하지 않고, 위의 tooluselog에서 함께 처리함
            // 따라서 여기서는 아무것도 하지 않음
        } else if (block.type === 'code') {
            elements.push(
                <CodeBlock
                    key={`code-${elements.length}`}
                    language={block.language}
                    code={block.code}
                />
            );
        }

        currentIndex = block.end;
    }

    // 남은 텍스트 처리
    if (currentIndex < processed.length) {
        const remainingText = processed.slice(currentIndex);
        elements.push(...parseSimpleMarkdown(remainingText, elements.length, onViewSource, parseCitation));
    }

    return elements;
};
