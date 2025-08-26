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
    console.log('🔍 [findLatexBlocks] Input text:', text);
    
    // 정규식을 사용한 더 정확한 LaTeX 블록 찾기
    const blockRegex = /\$\$([\s\S]*?)\$\$/g;
    const inlineRegex = /(?<!\$)\$(?!\$)([^$\n]+)\$(?!\$)/g;
    
    let match;
    const allMatches: Array<{ start: number, end: number, content: string, isBlock: boolean }> = [];
    
    // 블록 수식 찾기
    while ((match = blockRegex.exec(text)) !== null) {
        allMatches.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1],
            isBlock: true
        });
        console.log('✅ Block math found:', {
            start: match.index,
            end: match.index + match[0].length,
            content: match[1],
            full: match[0]
        });
    }
    
    // 인라인 수식 찾기 (블록 수식과 겹치지 않는 것만)
    blockRegex.lastIndex = 0; // reset
    while ((match = inlineRegex.exec(text)) !== null) {
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
            console.log('✅ Inline math found:', {
                start: match.index,
                end: match.index + match[0].length,
                content: match[1],
                full: match[0]
            });
        }
    }
    
    // 시작 위치 순으로 정렬하고 LatexBlockInfo 형태로 변환
    return allMatches
        .sort((a, b) => a.start - b.start)
        .map(match => ({
            start: match.start,
            end: match.end,
            content: match.content.trim(),
            isBlock: match.isBlock
        }));
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
        // LaTeX 특수 문자 이스케이프 처리
        const escapedContent = escapeLatexSpecialChars(content);
        
        console.log('🔍 [LatexRenderer] Content processing:', {
            original: content,
            escaped: escapedContent,
            hasPercent: content.includes('%')
        });
        
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