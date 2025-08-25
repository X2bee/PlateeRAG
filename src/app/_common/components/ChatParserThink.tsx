'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';

/**
 * Think 블록 정보
 */
export interface ThinkBlockInfo {
    start: number;
    end: number;
    content: string;
}

/**
 * <think></think> 블록 찾기 (스트리밍 지원)
 * 완성된 블록과 미완성된 블록 모두 처리
 */
export const findThinkBlocks = (content: string): ThinkBlockInfo[] => {
    const blocks: ThinkBlockInfo[] = [];

    // 완성된 <think></think> 블록 찾기
    const completeThinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    let match;

    while ((match = completeThinkRegex.exec(content)) !== null) {
        blocks.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1].trim()
        });
    }

    // 미완성된 <think> 블록 찾기 (스트리밍 중)
    const incompleteThinkRegex = /<think>(?![\s\S]*?<\/think>)([\s\S]*)$/gi;
    const incompleteMatch = incompleteThinkRegex.exec(content);

    if (incompleteMatch) {
        // 이미 완성된 think 블록과 겹치지 않는지 확인
        const incompleteStart = incompleteMatch.index;
        const isOverlapping = blocks.some(block =>
            incompleteStart >= block.start && incompleteStart < block.end
        );

        if (!isOverlapping) {
            blocks.push({
                start: incompleteStart,
                end: content.length,
                content: incompleteMatch[1].trim()
            });
        }
    }

    // 시작 위치 순으로 정렬
    return blocks.sort((a, b) => a.start - b.start);
};

/**
 * Think 블록 컴포넌트 - 접힐 수 있는 사고 과정 표시 (스트리밍 지원)
 */
interface ThinkBlockProps {
    content: string;
    className?: string;
    isStreaming?: boolean; // 스트리밍 중인지 여부
    // streamingPreview: showThinkBlock이 false인 상태에서 스트리밍 중일 때 애니메이션 프리뷰를 표시
    streamingPreview?: boolean;
    previewLines?: number;
}

export const ThinkBlock: React.FC<ThinkBlockProps> = ({
    content,
    className = '',
    isStreaming = false,
    streamingPreview = false,
    previewLines = 3
}) => {
    // streamingPreview 모드에서는 짧은 라인들을 스스륵 나타났다 사라지게 보여줌
    if (streamingPreview) {
        const lines = content ? content.split('\n').filter(l => l.trim()) : [];
        const preview = lines.length ? lines.slice(-previewLines) : ['...'];

        return (
            <div
                className={`think-block-container streaming ${className}`}
                style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    margin: '0.5rem 0',
                    backgroundColor: '#eff6ff'
                }}
            >
                {/* 헤더(이전 디자인과 동일하게 표시) */}
                <div
                    style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: '#6b7280',
                        fontSize: '0.875rem',
                        borderRadius: '0.5rem'
                    }}
                >
                    <FiChevronDown size={16} style={{ opacity: 0.85 }} />
                    <span>💭 사고 과정</span>
                    <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>(진행 중...)</span>
                </div>

                {/* 간단한 keyframes를 인라인으로 추가하여 외부 CSS 의존성 없이 동작하게 함 */}
                <style>{`
                    @keyframes thinkFade {
                        0% { opacity: 0; transform: translateY(6px); }
                        20% { opacity: 1; transform: translateY(0); }
                        80% { opacity: 1; transform: translateY(0); }
                        100% { opacity: 0; transform: translateY(-6px); }
                    }
                `}</style>

                <div style={{ padding: '0 1rem 0.75rem 1rem', marginTop: '-1px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem 0.75rem' }}>
                        {preview.map((line, idx) => (
                            <div
                                key={idx}
                                style={{
                                    // backgroundColor: '#ffffff',
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    color: '#374151',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.4',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    animation: `thinkFade 2s ease-in-out ${idx * 0.45}s infinite`
                                }}
                            >
                                {line}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 기본 동작: 스트리밍 중이면 펼친 상태, 완료되면 접힌 상태
    const [isExpanded, setIsExpanded] = useState(isStreaming);

    useEffect(() => {
        if (isStreaming) setIsExpanded(true);
        else setIsExpanded(false);
    }, [isStreaming]);

    const toggleExpanded = () => {
        if (!isStreaming) setIsExpanded(!isExpanded);
    };

    return (
        <div
            className={`think-block-container ${isStreaming ? 'streaming' : ''} ${className}`}
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                margin: '0.5rem 0',
                backgroundColor: '#f9fafb',
                ...(isStreaming && {
                    borderColor: '#3b82f6',
                    backgroundColor: '#eff6ff'
                })
            }}
        >
            <button
                onClick={toggleExpanded}
                disabled={isStreaming}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: isStreaming ? 'default' : 'pointer',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    borderRadius: '0.5rem',
                    opacity: isStreaming ? 0.8 : 1
                }}
                onMouseEnter={(e) => {
                    if (!isStreaming) e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                    if (!isStreaming) e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {isStreaming ? (
                    <FiChevronDown size={16} style={{ opacity: 0.5 }} />
                ) : (
                    isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />
                )}
                <span>💭 사고 과정</span>
                {isStreaming && (
                    <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 'bold' }}>(진행 중...)</span>
                )}
                {!isExpanded && !isStreaming && (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(클릭하여 보기)</span>
                )}
            </button>

            {isExpanded && (
                <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #e5e7eb', marginTop: '-1px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.375rem', fontSize: '0.875rem', lineHeight: '1.5', color: '#374151', whiteSpace: 'pre-wrap' }}>
                        {content}
                        {isStreaming && (
                            <span className="pulse-animation" style={{ color: '#3b82f6', marginLeft: '0.25rem' }}>▮</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
