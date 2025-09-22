'use client';

import React from 'react';
import { FiMoreHorizontal } from 'react-icons/fi';
import styles from '@/app/main/chatSection/assets/chatParser.module.scss';
import { APP_CONFIG } from '@/app/config';
import { SourceInfo } from '@/app/main/chatSection/types/source';
import { ThinkBlock, findThinkBlocks } from '@/app/_common/components/chatParser/ChatParserThink';
import { CodeBlock, findCodeBlocks } from '@/app/_common/components/chatParser/ChatParserCode';
import {
    ToolUseLogBlock,
    findToolUseLogBlocks,
    findToolOutputLogBlocks,
    parseToolOutputContent
} from '@/app/_common/components/chatParser/ChatParserToolResponse';
import {
    FeedbackLoopBlock,
    findFeedbackLoopBlocks,
    FeedbackReportBlock,
    findFeedbackReportBlocks,
    findFeedbackStatusTags
} from '@/app/_common/components/chatParser/ChatParserFeedback';
import {
    TodoDetailsBlock,
    findTodoDetailsBlocks
} from '@/app/_common/components/chatParser/ChatParserTodoDetails';
import {
    parseSimpleMarkdown
} from '@/app/_common/components/chatParser/ChatParserMarkdown';
import { parseCitation } from '@/app/_common/components/chatParser/ChatParserCite';
import { convertToString, needsConversion } from '@/app/_common/components/chatParser/ChatParserNonStr';

// Think 블록 표시 여부를 제어하는 상수 (환경변수에서 가져옴)
const showThinkBlock = APP_CONFIG.SHOW_THINK_BLOCK;
// const showToolOutputBlock = APP_CONFIG.SHOW_TOOL_OUTPUT_BLOCK;
const showToolOutputBlock = true;
// const showFeedbackLoop = APP_CONFIG.SHOW_FEEDBACK_LOOP;
const showFeedbackLoop = true;
// const showTodoDetails = APP_CONFIG.SHOW_TODO_DETAILS;
const showTodoDetails = true;

export interface ParsedContent {
    html: string;
    plainText: string;
}

interface MessageRendererProps {
    content: any; // string에서 any로 변경하여 다양한 타입 허용
    isUserMessage?: boolean;
    className?: string;
    onViewSource?: (sourceInfo: SourceInfo) => void;
    onHeightChange?: () => void;
    mode?: "existing" | "new-workflow" | "new-default" | "deploy";
    messageId?: string; // 메시지 고유 식별자 추가
    timestamp?: number; // 메시지 생성 시간 추가
    showEditButton?: boolean; // 편집 버튼 표시 여부
    onEditClick?: (messageContent: string, messageId?: string, position?: { top: number; right: number }) => void; // 편집 버튼 클릭 핸들러
}

/**
 * 마크다운 메시지 렌더러 컴포넌트
 */

export const MessageRenderer: React.FC<MessageRendererProps> = ({
    mode,
    content,
    isUserMessage = false,
    className = '',
    onViewSource,
    onHeightChange,
    messageId,
    showEditButton = false,
    onEditClick
}) => {

    // 가장 먼저 수행: 문자열이 아닌 데이터를 문자열로 변환
    let processedContent: string = '';

    if (needsConversion(content)) {
        processedContent = convertToString(content);
    } else if (typeof content === 'string') {
        processedContent = content;
    } else {
        // null, undefined, 빈 문자열 등의 경우
        return null;
    }

    // 변환된 내용이 비어있는 경우
    if (!processedContent || processedContent.trim() === '') {
        return null;
    }

    if (isUserMessage) {
        return (
            <div className={`${styles.markdownContent} ${className}`}>
                {processedContent}
            </div>
        );
    }

    const parsedElements = parseContentToReactElements(processedContent, onViewSource, onHeightChange, mode);

    const handleEditClick = (event: React.MouseEvent) => {
        if (onEditClick) {
            const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
            onEditClick(processedContent, messageId, {
                top: rect.bottom + 5,
                right: window.innerWidth - rect.right
            });
        }
    };

    return (
        <div className={styles.messageWrapper}>
            <div
                className={`${styles.markdownContent} ${className}`}
                style={{
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                }}
            >
                {parsedElements}
            </div>

            {showEditButton && !isUserMessage && (
                <div className={styles.editButtonWrapper}>
                    <button
                        className={styles.editButton}
                        onClick={handleEditClick}
                        title="메시지 옵션"
                    >
                        <FiMoreHorizontal />
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * 컨텐츠를 React 엘리먼트로 파싱
 */
const parseContentToReactElements = (content: string, onViewSource?: (sourceInfo: SourceInfo) => void, onHeightChange?: () => void, mode?: "existing" | "new-workflow" | "new-default" | "deploy"): React.ReactNode[] => {
    // 이 시점에서 content는 이미 MessageRenderer에서 문자열로 변환되었음
    if (!content) {
        return [];
    }

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

    // Think 블록, Tool Use Log 블록, Tool Output Log 블록, Feedback Loop 블록, TODO Details 블록 먼저 처리
    const thinkBlocks = findThinkBlocks(processed);
    const toolUseLogBlocks = findToolUseLogBlocks(processed);
    const toolOutputLogBlocks = findToolOutputLogBlocks(processed);
    const feedbackLoopBlocks = findFeedbackLoopBlocks(processed);
    const feedbackReportBlocks = findFeedbackReportBlocks(processed);
    const feedbackStatusTags = findFeedbackStatusTags(processed);
    const todoDetailsBlocks = findTodoDetailsBlocks(processed);
    // 코드 블록 처리
    const codeBlocks = findCodeBlocks(processed);

    // 모든 블록을 시작 위치 순으로 정렬
    const allBlocks = [
        ...thinkBlocks.map(block => ({ ...block, type: 'think' as const })),
        ...toolUseLogBlocks.map(block => ({ ...block, type: 'tooluselog' as const })),
        ...toolOutputLogBlocks.map(block => ({ ...block, type: 'tooloutputlog' as const })),
        ...feedbackLoopBlocks.map(block => ({ ...block, type: 'feedbackloop' as const })),
        ...feedbackReportBlocks.map(block => ({ ...block, type: 'feedbackreport' as const })),
        ...todoDetailsBlocks.map(block => ({ ...block, type: 'tododetails' as const })),
        ...codeBlocks.map(block => ({ ...block, type: 'code' as const }))
    ].sort((a, b) => a.start - b.start);

    // 피드백 관련 컨테이너 내부에 있는 다른 블록들 제거 (중복 렌더링 방지)
    const filteredBlocks = allBlocks.filter((block) => {
        // 피드백 루프 블록, 피드백 리포트, TODO Details 블록은 그대로 유지
        if (block.type === 'feedbackloop' || block.type === 'feedbackreport' || block.type === 'tododetails') return true;

        // 다른 블록들이 피드백 루프 블록 내부에 있는지 확인
        const isInsideFeedbackLoop = feedbackLoopBlocks.some(fbBlock =>
            block.start >= fbBlock.start && block.start < fbBlock.end
        );

        // 다른 블록들이 TODO Details 블록 내부에 있는지 확인
        const isInsideTodoDetails = todoDetailsBlocks.some(tdBlock =>
            block.start >= tdBlock.start && block.start < tdBlock.end
        );

        // 다른 블록들이 피드백 리포트 블록 내부에 있는지 확인
        const isInsideFeedbackReport = feedbackReportBlocks.some(frBlock =>
            block.start >= frBlock.start && block.start < frBlock.end
        );

        // 다른 블록들이 피드백 상태 태그 내부에 있는지 확인
        const isInsideFeedbackStatus = feedbackStatusTags.some(status =>
            block.start >= status.start && block.start < status.end
        );

        // 피드백 루프나 TODO Details 내부에 있으면 제외
        return !isInsideFeedbackLoop && !isInsideTodoDetails && !isInsideFeedbackReport && !isInsideFeedbackStatus;
    });

    for (const block of filteredBlocks) {
        // 블록 이전 텍스트 처리
        if (block.start > currentIndex) {
            const beforeText = processed.slice(currentIndex, block.start);
            const isStreamingBefore = detectStreaming(beforeText, currentIndex, processed.length);
            elements.push(...parseSimpleMarkdown(beforeText, elements.length, onViewSource, parseCitation, isStreamingBefore, onHeightChange));
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
            if (mode === 'deploy'||!showToolOutputBlock && !isStreaming) {
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
            // currentIndex는 업데이트하지 않음 (이미 tooluselog에서 처리됨)
            continue;
        } else if (block.type === 'feedbackloop') {
            // 스트리밍 중인지 확인 (블록이 문서 끝까지 이어지고 </FEEDBACK_LOOP>가 없는 경우)
            const isStreaming = block.end === processed.length &&
                !processed.slice(block.start).includes('</FEEDBACK_LOOP>');

            if ((mode === 'deploy' || !showFeedbackLoop) && !isStreaming) {
                // 완성된 feedback loop 블록은 렌더링하지 않음
            } else {
                // showFeedbackLoop가 false이면서 스트리밍 중이라면 애니메이션 프리뷰 모드로 전달
                const streamingPreview = (!showFeedbackLoop && isStreaming);
                elements.push(
                    <FeedbackLoopBlock
                        key={`feedbackloop-${elements.length}`}
                        content={block.content}
                        isStreaming={isStreaming}
                        streamingPreview={streamingPreview}
                        previewLines={3}
                    />
                );
            }
        } else if (block.type === 'feedbackreport') {
            // 스트리밍 중인지 확인 (블록이 문서 끝까지 이어지고 </FEEDBACK_REPORT>가 없는 경우)
            const isStreaming = block.end === processed.length &&
                !processed.slice(block.start).includes('</FEEDBACK_REPORT>');

            elements.push(
                <FeedbackReportBlock
                    key={`feedbackreport-${elements.length}`}
                    content={block.content}
                    isStreaming={isStreaming}
                />
            );
        } else if (block.type === 'tododetails') {
            // 스트리밍 중인지 확인 (블록이 문서 끝까지 이어지고 </TODO_DETAILS>가 없는 경우)
            const isStreaming = block.end === processed.length &&
                !processed.slice(block.start).includes('</TODO_DETAILS>');

            // showTodoDetails가 false이고 완성된 블록인 경우, 또는 deploy 모드인 경우 숨김
            if ((mode === 'deploy' || !showTodoDetails) && !isStreaming) {
                // 완성된 TODO details 블록은 렌더링하지 않음
            } else {
                // showTodoDetails가 false이면서 스트리밍 중이라면 애니메이션 프리뷰 모드로 전달
                const streamingPreview = (!showTodoDetails && isStreaming);
                elements.push(
                    <TodoDetailsBlock
                        key={`tododetails-${elements.length}`}
                        content={block.content}
                        isStreaming={isStreaming}
                        streamingPreview={streamingPreview}
                        previewLines={3}
                    />
                );
            }
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
        elements.push(...parseSimpleMarkdown(remainingText, elements.length, onViewSource, parseCitation, isStreamingRemaining, onHeightChange));
    }

    return elements;
};
