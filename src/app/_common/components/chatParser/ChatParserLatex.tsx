'use client';

import React, { useRef, useLayoutEffect, useCallback } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { processInlineMarkdown } from '@/app/_common/components/chatParser/ChatParserMarkdown';

/**
 * LaTeX 블록 정보를 나타내는 인터페이스
 */
export interface LatexBlockInfo {
    start: number;
    end: number;
    content: string;
    isBlock: boolean; // true: $$ block math, false: $ inline math
}

/**
 * LaTeX 특수 문자 이스케이프 처리 (스마트 처리)
 */
const escapeLatexSpecialChars = (text: string): string => {
    let processed = text;

    // 1. \text{} 블록 내부의 특수 문자만 이스케이프 처리
    processed = processed.replace(/\\text\{([^}]*)\}/g, (_match, textContent) => {
        let escapedTextContent = textContent;

        // \text{} 내부에서만 특수 문자 이스케이프
        escapedTextContent = escapedTextContent.replace(/(?<!\\)%/g, '\\%');  // % → \%
        escapedTextContent = escapedTextContent.replace(/(?<!\\)&/g, '\\&');  // & → \&
        escapedTextContent = escapedTextContent.replace(/(?<!\\)#/g, '\\#');  // # → \#

        return `\\text{${escapedTextContent}}`;
    });

    // 2. 전체 수식에서 % 문자 처리 (가장 문제가 되는 문자)
    // 이미 이스케이프된 \%는 건너뛰고, 일반 %만 처리
    processed = processed.replace(/(?<!\\)%/g, '\\%');

    return processed;
};

/**
 * 텍스트에서 LaTeX 수식 블록을 찾는 함수
 */
export const findLatexBlocks = (text: string): LatexBlockInfo[] => {
    // Citation 영역을 찾아서 제외하기 위한 함수
    const findCitationRanges = (inputText: string): Array<{ start: number, end: number }> => {
        const citationRanges: Array<{ start: number, end: number }> = [];
        let i = 0;

        while (i < inputText.length) {
            const citeStart = inputText.indexOf('[Cite.', i);
            if (citeStart === -1) break;

            // { 찾기
            let braceStart = -1;
            for (let j = citeStart + 6; j < inputText.length; j++) {
                if (inputText[j] === '{') {
                    braceStart = j;
                    break;
                } else if (inputText[j] !== ' ' && inputText[j] !== '\t') {
                    break;
                }
            }

            if (braceStart === -1) {
                i = citeStart + 6;
                continue;
            }

            // 균형잡힌 괄호 찾기
            let braceCount = 1;
            let braceEnd = -1;
            let inString = false;
            let escaped = false;

            for (let j = braceStart + 1; j < inputText.length; j++) {
                const char = inputText[j];

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
                            braceEnd = j;
                            break;
                        }
                    }
                }
            }

            if (braceEnd !== -1) {
                // 닫는 ] 찾기
                let finalEnd = braceEnd + 1;
                while (finalEnd < inputText.length &&
                    (inputText[finalEnd] === ' ' || inputText[finalEnd] === '\t' ||
                        inputText[finalEnd] === ']' || inputText[finalEnd] === '.' ||
                        inputText[finalEnd] === '\\')) {
                    if (inputText[finalEnd] === ']') {
                        finalEnd++;
                        break;
                    }
                    finalEnd++;
                }

                citationRanges.push({
                    start: citeStart,
                    end: finalEnd
                });

                i = finalEnd;
            } else {
                i = citeStart + 6;
            }
        }

        return citationRanges;
    };

    // Citation 영역 찾기
    const citationRanges = findCitationRanges(text);

    // 정규식을 사용한 더 정확한 LaTeX 블록 찾기
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    // 인라인 수식: $ 바로 뒤에 숫자가 오는 경우는 제외 (달러 금액 표시)
    const inlineRegex = /(?<!\$)\$(?!\$)(?!\d)([^$\n]+)\$(?!\$)/g;

    let match;
    const allMatches: Array<{ start: number, end: number, content: string, isBlock: boolean }> = [];

    // Citation 영역과 겹치는지 확인하는 함수
    const isInCitation = (start: number, end: number): boolean => {
        return citationRanges.some(range =>
            (start >= range.start && start < range.end) ||
            (end > range.start && end <= range.end) ||
            (start <= range.start && end >= range.end)
        );
    };

    // 블록 수식 찾기
    while ((match = blockRegex.exec(text)) !== null) {
        if (!isInCitation(match.index, match.index + match[0].length)) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                content: match[1],
                isBlock: true
            });
        }
    }

    // 인라인 수식 찾기 (블록 수식과 겹치지 않는 것만)
    blockRegex.lastIndex = 0; // reset
    while ((match = inlineRegex.exec(text)) !== null) {
        // Citation 영역과 겹치는지 확인
        if (isInCitation(match.index, match.index + match[0].length)) {
            continue;
        }

        // 블록 수식과 겹치는지 확인
        const isOverlapping = allMatches.some(block =>
            block.isBlock && match!.index >= block.start && match!.index < block.end
        );

        if (!isOverlapping) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                content: match[1],
                isBlock: false
            });
        }
    }


    // 시작 위치 순으로 정렬하고 LatexBlockInfo 형태로 변환
    const result = allMatches
        .sort((a, b) => a.start - b.start)
        .map(match => ({
            start: match.start,
            end: match.end,
            content: match.content.trim(),
            isBlock: match.isBlock
        }));

    return result;
};

/**
 * LaTeX 수식이 스트리밍 중인지 감지하는 함수
 */
export const detectLatexStreaming = (text: string, textStartIndex: number, totalLength: number): boolean => {
    // 텍스트가 전체 콘텐츠의 끝 부분인지 확인
    const isAtEnd = textStartIndex + text.length === totalLength;
    if (!isAtEnd) return false;

    // 불완전한 LaTeX 패턴 확인
    const partialLatexRegex = /\$+[^$]*$/;
    return partialLatexRegex.test(text.trim());
};

/**
 * LaTeX 렌더링 컴포넌트
 */
interface LatexRendererProps {
    content: string;
    isBlock: boolean;
    isStreaming?: boolean;
    onHeightChange?: () => void;
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({
    content,
    isBlock,
    onHeightChange
}) => {
    const containerRef = useRef<HTMLDivElement | HTMLSpanElement>(null);

    // ResizeObserver를 사용하여 높이 변화 감지
    const observeResize = useCallback((element: HTMLElement) => {
        if (!element || !onHeightChange) return;

        const resizeObserver = new ResizeObserver(() => {
            // 높이 변화를 부모에게 알림
            onHeightChange();
        });

        resizeObserver.observe(element);

        return () => {
            resizeObserver.disconnect();
        };
    }, [onHeightChange]);

    // LaTeX 렌더링 후 ResizeObserver 설정
    useLayoutEffect(() => {
        if (containerRef.current) {
            return observeResize(containerRef.current);
        }
    }, [observeResize]);
    try {
        // LaTeX 특수 문자 이스케이프 처리
        const escapedContent = escapeLatexSpecialChars(content);

        // KaTeX로 직접 렌더링
        const html = katex.renderToString(escapedContent, {
            displayMode: isBlock,
            throwOnError: false,
            strict: false,
            trust: true
        });

        if (isBlock) {
            return (
                <div
                    ref={containerRef as React.RefObject<HTMLDivElement>}
                    style={{
                        margin: '1rem 0',
                        textAlign: 'center',
                        fontSize: '0.9em' // 블록 수식 크기 증가
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        } else {
            return (
                <span
                    ref={containerRef as React.RefObject<HTMLSpanElement>}
                    style={{
                        fontSize: '0.75em' // 인라인 수식 크기 약간 증가
                    }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        }
    } catch (error) {
        return (
            <span
                style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '0.125rem 0.25rem',
                    borderRadius: '0.25rem',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                }}
                title={`LaTeX 렌더링 오류: ${error}`}
            >
                {isBlock ? `$$${content}$$` : `$${content}$`}
            </span>
        );
    }
};

/**
 * LaTeX 플레이스홀더 컴포넌트 - 스트리밍 중 부분적인 LaTeX 표시
 */
export const LatexPlaceholder: React.FC<{ isBlock?: boolean }> = ({ isBlock = false }) => {
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
            {isBlock ? '📐 수식 블록 로딩 중...' : '📐 수식 로딩 중...'}
        </span>
    );
};

/**
 * 텍스트에서 LaTeX를 처리하고 React 요소로 변환
 */
export const processLatexInText = (
    text: string,
    key: string,
    isStreaming: boolean = false,
    onHeightChange?: () => void
): React.ReactNode[] => {
    // LaTeX 블록 찾기 (원본 텍스트에서)
    const latexBlocks = findLatexBlocks(text);

    if (latexBlocks.length === 0) {
        // LaTeX가 없는 경우 부분적인 LaTeX 확인
        const partialLatexRegex = /\$+[^$]*$/;
        const partialMatch = partialLatexRegex.exec(text);

        if (partialMatch && isStreaming) {
            // 부분적인 LaTeX 이전 텍스트 처리
            const beforeText = text.slice(0, partialMatch.index);
            const elements: React.ReactNode[] = [];

            if (beforeText) {
                const processedText = processInlineMarkdown(beforeText);
                elements.push(
                    <span key={`${key}-text-before`} dangerouslySetInnerHTML={{ __html: processedText }} />
                );
            }

            // 부분적인 LaTeX 감지
            const isBlockMath = partialMatch[0].startsWith('$$');
            elements.push(
                <LatexPlaceholder key={`${key}-partial`} isBlock={isBlockMath} />
            );

            return elements;
        } else {
            // LaTeX가 전혀 없는 경우 마크다운 처리된 텍스트 반환
            const processedText = processInlineMarkdown(text);
            return [<span key={key} dangerouslySetInnerHTML={{ __html: processedText }} />];
        }
    }

    // LaTeX가 있는 경우 LaTeX와 텍스트를 분할하여 처리
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;

    for (let i = 0; i < latexBlocks.length; i++) {
        const block = latexBlocks[i];

        // LaTeX 블록 이전 텍스트 처리
        if (block.start > currentIndex) {
            const beforeText = text.slice(currentIndex, block.start);
            if (beforeText.trim()) {
                const processedText = processInlineMarkdown(beforeText);
                elements.push(
                    <span key={`${key}-text-${i}`} dangerouslySetInnerHTML={{ __html: processedText }} />
                );
            }
        }

        // LaTeX 블록 렌더링
        elements.push(
            <LatexRenderer
                key={`${key}-latex-${i}`}
                content={block.content}
                isBlock={block.isBlock}
                onHeightChange={onHeightChange}
            />
        );

        currentIndex = block.end;
    }

    // 남은 텍스트 처리
    if (currentIndex < text.length) {
        const remainingText = text.slice(currentIndex);
        if (remainingText.trim()) {
            const processedText = processInlineMarkdown(remainingText);
            elements.push(
                <span key={`${key}-text-remaining`} dangerouslySetInnerHTML={{ __html: processedText }} />
            );
        }
    }

    return elements;
};

/**
 * 텍스트에 LaTeX가 포함되어 있는지 확인하는 헬퍼 함수
 */
export const hasLatex = (text: string): boolean => {
    // 블록 수식 ($$...$$) 패턴 확인
    const blockMathRegex = /\$\$[\s\S]*?\$\$/;

    // 인라인 수식 ($...$) 패턴 확인
    // 단, 달러 금액($250, $40 등)은 제외
    // $ 바로 뒤에 숫자가 오는 경우는 LaTeX가 아닌 통화 기호로 간주
    const inlineMathRegex = /(?<!\$)\$(?!\$)(?!\d)[^$\n]+\$(?!\$)/;

    return blockMathRegex.test(text) || inlineMathRegex.test(text);
};
