'use client';

import React from 'react';
import styles from '@/app/chat/assets/chatParser.module.scss';
import { APP_CONFIG } from '@/app/config';
import { SourceInfo } from '@/app/chat/types/source';
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
    parseSimpleMarkdown
} from '@/app/_common/components/ChatParserMarkdown';
import { parseCitation } from './ChatParserCite';

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
    
    // 스트림 모드 감지를 위한 헬퍼 함수
    const detectStreaming = (text: string, textStartIndex: number, totalLength: number): boolean => {
        // 텍스트가 전체 콘텐츠의 끝 부분인지 확인
        const isAtEnd = textStartIndex + text.length === totalLength;
        if (!isAtEnd) return false;
        
        // 불완전한 citation 패턴 확인
        const partialCitationRegex = /\[Cite\.(?:\s*\{[^}]*)?$/;
        return partialCitationRegex.test(text.trim());
    };

    // 이스케이프된 문자 처리 (LaTeX가 포함된 경우 건너뛰기)
    // LaTeX 수식이나 수학 명령어가 포함된 경우 이스케이프 처리 생략
    const hasLatexCommands = /\\(text|frac|sqrt|sum|times|alpha|beta|gamma|delta|int|left|right)\b/.test(processed);
    const hasLatexSyntax = processed.includes('$$') || processed.includes('$');
    
    if (!hasLatexCommands && !hasLatexSyntax) {
        processed = processed.replace(/\\n/g, '\n');
        processed = processed.replace(/\\t/g, '\t');
        processed = processed.replace(/\\r/g, '\r');
    }

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
            const isStreamingBefore = detectStreaming(beforeText, currentIndex, processed.length);
            elements.push(...parseSimpleMarkdown(beforeText, elements.length, onViewSource, parseCitation, isStreamingBefore));
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
        const isStreamingRemaining = detectStreaming(remainingText, currentIndex, processed.length);
        elements.push(...parseSimpleMarkdown(remainingText, elements.length, onViewSource, parseCitation, isStreamingRemaining));
    }

    return elements;
};
