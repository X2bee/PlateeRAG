'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight, FiFileText } from 'react-icons/fi';

/**
 * Feedback Loop 블록 정보
 */
export interface FeedbackLoopInfo {
    start: number;
    end: number;
    content: string;
}

/**
 * Feedback Report 블록 정보
 */
export interface FeedbackReportInfo {
    start: number;
    end: number;
    content: string;
}

/**
 * Feedback Status 정보
 */
export interface FeedbackStatusInfo {
    start: number;
    end: number;
    content: string;
}

/**
 * <FEEDBACK_LOOP></FEEDBACK_LOOP> 블록 찾기 (스트리밍 지원)
 * 완성된 블록과 미완성된 블록 모두 처리
 */
export const findFeedbackLoopBlocks = (content: string): FeedbackLoopInfo[] => {
    const blocks: FeedbackLoopInfo[] = [];

    // 완성된 <FEEDBACK_LOOP></FEEDBACK_LOOP> 블록 찾기
    const completeFeedbackRegex = /<FEEDBACK_LOOP>([\s\S]*?)<\/FEEDBACK_LOOP>/gi;
    let match;

    while ((match = completeFeedbackRegex.exec(content)) !== null) {
        blocks.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1].trim()
        });
    }

    // 미완성된 <FEEDBACK_LOOP> 블록 찾기 (스트리밍 중)
    const incompleteFeedbackRegex = /<FEEDBACK_LOOP>(?![\s\S]*?<\/FEEDBACK_LOOP>)([\s\S]*)$/gi;
    const incompleteMatch = incompleteFeedbackRegex.exec(content);

    if (incompleteMatch) {
        // 이미 완성된 feedback loop 블록과 겹치지 않는지 확인
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
 * <FEEDBACK_REPORT></FEEDBACK_REPORT> 블록 찾기 (스트리밍 지원)
 * 완성된 블록과 미완성된 블록 모두 처리
 */
export const findFeedbackReportBlocks = (content: string): FeedbackReportInfo[] => {
    const blocks: FeedbackReportInfo[] = [];

    const completeReportRegex = /<FEEDBACK_REPORT>([\s\S]*?)<\/FEEDBACK_REPORT>/gi;
    let match;

    while ((match = completeReportRegex.exec(content)) !== null) {
        blocks.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1].trim()
        });
    }

    const incompleteReportRegex = /<FEEDBACK_REPORT>(?![\s\S]*?<\/FEEDBACK_REPORT>)([\s\S]*)$/gi;
    const incompleteMatch = incompleteReportRegex.exec(content);

    if (incompleteMatch) {
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

    return blocks.sort((a, b) => a.start - b.start);
};

/**
 * <FEEDBACK_STATUS></FEEDBACK_STATUS> 태그 찾기
 */
export const findFeedbackStatusTags = (content: string): FeedbackStatusInfo[] => {
    const statusTags: FeedbackStatusInfo[] = [];
    const feedbackStatusRegex = /<FEEDBACK_STATUS>([\s\S]*?)<\/FEEDBACK_STATUS>/gi;
    let match;

    while ((match = feedbackStatusRegex.exec(content)) !== null) {
        statusTags.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1].trim()
        });
    }

    return statusTags.sort((a, b) => a.start - b.start);
};

/**
 * FEEDBACK_STATUS 태그를 제거하고 내용만 반환
 */
export const processFeedbackContent = (content: string): string => {
    const tagsToStrip = ['FEEDBACK_STATUS', 'FEEDBACK_REPORT'];

    return tagsToStrip.reduce((processed, tag) =>
        processed.replace(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'gi'), '$1')
    , content);
};

/**
 * Feedback Report 블록 컴포넌트
 */
interface FeedbackReportBlockProps {
    content: string;
    className?: string;
    isStreaming?: boolean;
}

export const FeedbackReportBlock: React.FC<FeedbackReportBlockProps> = ({
    content,
    className = '',
    isStreaming = false
}) => {
    const [isExpanded, setIsExpanded] = useState(true);

    useEffect(() => {
        if (isStreaming) setIsExpanded(true);
    }, [isStreaming]);

    const toggleExpanded = () => {
        if (!isStreaming) setIsExpanded(prev => !prev);
    };

    const processedContent = processFeedbackContent(content || '');

    const renderContent = () => {
        if (!processedContent) return null;

        const sections = processedContent.split('\n').filter(line => line.trim().length > 0);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sections.map((line, index) => (
                    <div
                        key={index}
                        style={{
                            fontSize: '0.875rem',
                            lineHeight: '1.5',
                            color: '#374151',
                            whiteSpace: 'pre-wrap'
                        }}
                    >
                        {line}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div
            className={`feedback-report-container ${isStreaming ? 'streaming' : ''} ${className}`}
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                margin: '0.5rem 0',
                backgroundColor: '#f9fafb',
                ...(isStreaming && {
                    borderColor: '#10b981',
                    backgroundColor: '#ecfdf5'
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
                    color: '#065f46',
                    borderRadius: '0.5rem',
                    opacity: isStreaming ? 0.85 : 1
                }}
                onMouseEnter={(e) => {
                    if (!isStreaming) e.currentTarget.style.backgroundColor = '#ecfdf5';
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
                <FiFileText size={16} style={{ color: '#10b981' }} />
                <span>📑 피드백 리포트</span>
                {isStreaming && (
                    <span style={{ color: '#10b981', fontSize: '0.75rem', fontWeight: 'bold' }}>(진행 중...)</span>
                )}
                {!isExpanded && !isStreaming && (
                    <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>(클릭하여 보기)</span>
                )}
            </button>

            {isExpanded && processedContent && (
                <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #e5e7eb', marginTop: '-1px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.375rem' }}>
                        {renderContent()}
                        {isStreaming && (
                            <span className="pulse-animation" style={{ color: '#10b981', marginLeft: '0.25rem' }}>▮</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Feedback Loop 블록 컴포넌트 - 접힐 수 있는 피드백 루프 표시 (스트리밍 지원)
 */
interface FeedbackLoopBlockProps {
    content: string;
    className?: string;
    isStreaming?: boolean; // 스트리밍 중인지 여부
    // streamingPreview: showFeedbackLoop이 false인 상태에서 스트리밍 중일 때 애니메이션 프리뷰를 표시
    streamingPreview?: boolean;
    previewLines?: number;
}

export const FeedbackLoopBlock: React.FC<FeedbackLoopBlockProps> = ({
    content,
    className = '',
    isStreaming = false,
    streamingPreview = false,
    previewLines = 3
}) => {
    // streamingPreview 모드에서는 짧은 라인들을 스스륵 나타났다 사라지게 보여줌
    if (streamingPreview) {
        const processedContent = processFeedbackContent(content || '');
        const lines = processedContent ? processedContent.split('\n').filter(l => l.trim()) : [];
        const preview = lines.length ? lines.slice(-previewLines) : ['...'];

        return (
            <div
                className={`feedback-loop-container streaming ${className}`}
                style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    margin: '0.5rem 0',
                    backgroundColor: '#fef3f2'
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
                    <span>🔄 피드백 루프</span>
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>(진행 중...)</span>
                </div>

                {/* 간단한 keyframes를 인라인으로 추가하여 외부 CSS 의존성 없이 동작하게 함 */}
                <style>{`
                    @keyframes feedbackFade {
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
                                    padding: '0.375rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    color: '#374151',
                                    fontSize: '0.875rem',
                                    lineHeight: '1.4',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    animation: `feedbackFade 2s ease-in-out ${idx * 0.45}s infinite`
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
            className={`feedback-loop-container ${isStreaming ? 'streaming' : ''} ${className}`}
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                margin: '0.5rem 0',
                backgroundColor: '#fefcfc',
                ...(isStreaming && {
                    borderColor: '#ef4444',
                    backgroundColor: '#fef3f2'
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
                <span>🔄 피드백 루프</span>
                {isStreaming && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold' }}>(진행 중...)</span>
                )}
                {!isExpanded && !isStreaming && (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(클릭하여 보기)</span>
                )}
            </button>

            {isExpanded && (
                <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #e5e7eb', marginTop: '-1px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.375rem', fontSize: '0.875rem', lineHeight: '1.5', color: '#374151' }}>
                        <div dangerouslySetInnerHTML={{
                            __html: processFeedbackContent(content).replace(/\n/g, '<br/>')
                        }} />
                        {isStreaming && (
                            <span className="pulse-animation" style={{ color: '#ef4444', marginLeft: '0.25rem' }}>▮</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
