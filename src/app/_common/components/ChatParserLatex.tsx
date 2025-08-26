'use client';

import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * LaTeX 블록 정보를 나타내는 인터페이스
 */
export interface LatexBlockInfo {
    start: number;
    end: number;
    content: string;
    isBlock: boolean; // true: $$ block math, false: $ inline math
}

// 이스케이프 문자 처리는 단순화 - 원본 텍스트를 그대로 사용

/**
 * 텍스트에서 LaTeX 수식 블록을 찾는 함수
 */
export const findLatexBlocks = (text: string): LatexBlockInfo[] => {
    const blocks: LatexBlockInfo[] = [];
    let index = 0;

    while (index < text.length) {
        // 블록 수식 ($$...$$) 먼저 찾기
        const blockStart = text.indexOf('$$', index);
        const blockEnd = blockStart !== -1 ? text.indexOf('$$', blockStart + 2) : -1;

        // 인라인 수식 ($...$) 찾기
        const inlineStart = text.indexOf('$', index);
        const inlineEnd = inlineStart !== -1 ? text.indexOf('$', inlineStart + 1) : -1;

        // 더 가까운 것부터 처리
        if (blockStart !== -1 && blockEnd !== -1 && 
            (inlineStart === -1 || inlineEnd === -1 || blockStart < inlineStart)) {
            // 블록 수식 처리
            const content = text.slice(blockStart + 2, blockEnd);
            console.log('Block content extracted:', {
                original: text.slice(blockStart, blockEnd + 2),
                content: content,
                hasBackslash: content.includes('\\')
            });
            if (content.trim()) {
                blocks.push({
                    start: blockStart,
                    end: blockEnd + 2,
                    content: content.trim(),
                    isBlock: true
                });
            }
            index = blockEnd + 2;
        } else if (inlineStart !== -1 && inlineEnd !== -1 && inlineStart !== blockStart) {
            // 인라인 수식 처리 (블록 수식의 시작이 아닌 경우)
            const content = text.slice(inlineStart + 1, inlineEnd);
            if (content.trim() && !content.includes('\n')) { // 인라인은 줄바꿈 없어야 함
                blocks.push({
                    start: inlineStart,
                    end: inlineEnd + 1,
                    content: content.trim(),
                    isBlock: false
                });
            }
            index = inlineEnd + 1;
        } else {
            break;
        }
    }

    return blocks.sort((a, b) => a.start - b.start);
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
}

export const LatexRenderer: React.FC<LatexRendererProps> = ({ 
    content, 
    isBlock
}) => {
    try {
        // KaTeX로 직접 렌더링
        const html = katex.renderToString(content, {
            displayMode: isBlock,
            throwOnError: false,
            strict: false,
            trust: true
        });

        if (isBlock) {
            return (
                <div 
                    style={{ margin: '1rem 0', textAlign: 'center' }}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            );
        } else {
            return (
                <span dangerouslySetInnerHTML={{ __html: html }} />
            );
        }
    } catch (error) {
        // LaTeX 파싱 에러 시 원본 텍스트 표시
        console.error('LaTeX rendering error:', error);
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
    isStreaming: boolean = false
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
                elements.push(
                    <span key={`${key}-text-before`}>{beforeText}</span>
                );
            }

            // 부분적인 LaTeX 감지
            const isBlockMath = partialMatch[0].startsWith('$$');
            elements.push(
                <LatexPlaceholder key={`${key}-partial`} isBlock={isBlockMath} />
            );

            return elements;
        } else {
            // LaTeX가 전혀 없는 경우 원본 텍스트 반환
            return [<span key={key}>{text}</span>];
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
                elements.push(
                    <span key={`${key}-text-${i}`}>{beforeText}</span>
                );
            }
        }

        // LaTeX 블록 렌더링
        elements.push(
            <LatexRenderer
                key={`${key}-latex-${i}`}
                content={block.content}
                isBlock={block.isBlock}
            />
        );

        currentIndex = block.end;
    }

    // 남은 텍스트 처리
    if (currentIndex < text.length) {
        const remainingText = text.slice(currentIndex);
        if (remainingText.trim()) {
            elements.push(
                <span key={`${key}-text-remaining`}>{remainingText}</span>
            );
        }
    }

    return elements;
};

/**
 * 텍스트에 LaTeX가 포함되어 있는지 확인하는 헬퍼 함수
 */
export const hasLatex = (text: string): boolean => {
    return /\$+.*?\$+/.test(text);
};