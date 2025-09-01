'use client';

import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import SourceButton from '@/app/chat/components/SourceButton';
import { SourceInfo } from '@/app/chat/types/source';
import sourceStyles from '@/app/chat/assets/SourceButton.module.scss';

/**
 * Tool Use Log 블록 정보
 */
export interface ToolUseLogInfo {
    start: number;
    end: number;
    content: string;
}

/**
 * Tool Output Log 블록 정보
 */
export interface ToolOutputLogInfo {
    start: number;
    end: number;
    content: string;
}

/**
 * <TOOLUSELOG></TOOLUSELOG> 블록 찾기 (스트리밍 지원)
 * 완성된 블록과 미완성된 블록 모두 처리
 */
export const findToolUseLogBlocks = (content: string): ToolUseLogInfo[] => {
    const blocks: ToolUseLogInfo[] = [];

    // 완성된 <TOOLUSELOG></TOOLUSELOG> 블록 찾기
    const completeToolLogRegex = /<TOOLUSELOG>([\s\S]*?)<\/TOOLUSELOG>/gi;
    let match;

    while ((match = completeToolLogRegex.exec(content)) !== null) {
        blocks.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1].trim()
        });
    }

    // 미완성된 <TOOLUSELOG> 블록 찾기 (스트리밍 중)
    const incompleteToolLogRegex = /<TOOLUSELOG>(?![\s\S]*?<\/TOOLUSELOG>)([\s\S]*)$/gi;
    const incompleteMatch = incompleteToolLogRegex.exec(content);

    if (incompleteMatch) {
        // 이미 완성된 tooluselog 블록과 겹치지 않는지 확인
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
 * <TOOLOUTPUTLOG></TOOLOUTPUTLOG> 블록 찾기 (스트리밍 지원)
 * 완성된 블록과 미완성된 블록 모두 처리
 */
export const findToolOutputLogBlocks = (content: string): ToolOutputLogInfo[] => {
    const blocks: ToolOutputLogInfo[] = [];

    // 완성된 <TOOLOUTPUTLOG></TOOLOUTPUTLOG> 블록 찾기
    const completeToolOutputLogRegex = /<TOOLOUTPUTLOG>([\s\S]*?)<\/TOOLOUTPUTLOG>/gi;
    let match;

    while ((match = completeToolOutputLogRegex.exec(content)) !== null) {
        blocks.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1].trim()
        });
    }

    // 미완성된 <TOOLOUTPUTLOG> 블록 찾기 (스트리밍 중)
    const incompleteToolOutputLogRegex = /<TOOLOUTPUTLOG>(?![\s\S]*?<\/TOOLOUTPUTLOG>)([\s\S]*)$/gi;
    const incompleteMatch = incompleteToolOutputLogRegex.exec(content);

    if (incompleteMatch) {
        // 이미 완성된 tooloutputlog 블록과 겹치지 않는지 확인
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
 * Tool Use Log 블록 컴포넌트 Props
 */
interface ToolUseLogBlockProps {
    content: string;
    outputContent?: string; // 도구 출력 데이터
    className?: string;
    isStreaming?: boolean; // 스트리밍 중인지 여부
    // streamingPreview: showToolOutputBlock이 false인 상태에서 스트리밍 중일 때 애니메이션 프리뷰를 표시
    streamingPreview?: boolean;
    previewLines?: number;
    onViewSource?: (sourceInfo: SourceInfo) => void;
    parseCitation?: (citationText: string) => SourceInfo | null; // parseCitation 함수
    customParsedOutputs?: Array<{
        documentNumber?: number;
        relevanceScore?: number;
        sourceInfo: SourceInfo | null;
        originalText: string;
    }>; // 미리 파싱된 출력 데이터
}

/**
 * 도구 사용 로그 내용 파싱 함수
 */
export const parseToolUseLogContent = (content: string): { toolName: string; toolInput: any } => {
    try {
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length >= 2) {
            const toolName = lines[0].trim();
            const toolInputStr = lines.slice(1).join('\n').trim();
            let toolInput;

            try {
                toolInput = JSON.parse(toolInputStr);
            } catch {
                toolInput = toolInputStr;
            }

            return { toolName, toolInput };
        }

        // 한 줄인 경우 전체를 도구명으로 처리
        return { toolName: content.trim(), toolInput: null };
    } catch {
        return { toolName: content, toolInput: null };
    }
};

/**
 * 도구 출력 로그에서 Tool_Cite 항목들을 파싱하는 함수
 */
export const parseToolOutputContent = (outputContent: string, parseCitation: (citationText: string) => SourceInfo | null): Array<{
    documentNumber?: number;
    relevanceScore?: number;
    sourceInfo: SourceInfo | null;
    originalText: string;
}> => {
    if (!outputContent) return [];

    const results: Array<{
        documentNumber?: number;
        relevanceScore?: number;
        sourceInfo: SourceInfo | null;
        originalText: string;
    }> = [];

    // [Tool_Cite. {...}] 패턴 찾기
    const toolCiteRegex = /\[Tool_Cite\.\s*(\{[^}]*\})\]/g;
    let match;

    while ((match = toolCiteRegex.exec(outputContent)) !== null) {
        const originalText = match[0];
        const jsonStr = match[1];

        try {
            const parsed = JSON.parse(jsonStr);

            // document_number와 relevance_score 추출
            const documentNumber = parsed.document_number;
            const relevanceScore = parsed.relevance_score;

            // parseCitation을 위한 SourceInfo 형태로 변환
            const sourceInfo = parseCitation(`[Cite. ${jsonStr}]`);

            results.push({
                documentNumber,
                relevanceScore,
                sourceInfo,
                originalText
            });
        } catch (error) {
            // JSON 파싱 실패 시 원본 텍스트만 저장
            results.push({
                sourceInfo: null,
                originalText
            });
        }
    }

    return results;
};

/**
 * Tool Use Log 블록 컴포넌트 - 접힐 수 있는 도구 사용 로그 표시 (스트리밍 지원)
 */
export const ToolUseLogBlock: React.FC<ToolUseLogBlockProps> = ({
    content,
    outputContent,
    className = '',
    isStreaming = false,
    streamingPreview = false,
    previewLines = 3,
    onViewSource,
    parseCitation,
    customParsedOutputs
}) => {
    const { toolName, toolInput } = parseToolUseLogContent(content);

    // customParsedOutputs가 있으면 사용하고, 없으면 직접 파싱
    const parsedOutputs = customParsedOutputs || (
        parseCitation ? parseToolOutputContent(outputContent || '', parseCitation) : []
    );

    // streamingPreview 모드에서는 짧은 라인들을 스스륵 나타났다 사라지게 보여줌
    if (streamingPreview) {
        return (
            <div
                className={`tool-use-log-container streaming ${className}`}
                style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    margin: '0.5rem 0',
                    backgroundColor: '#fefdf8'
                }}
            >
                {/* 헤더 */}
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
                    <span>🔧 도구 사용 로그</span>
                    <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold', marginLeft: '0.5rem' }}>(진행 중...)</span>
                </div>

                {/* 간단한 keyframes를 인라인으로 추가 */}
                <style>{`
                    @keyframes toolLogFade {
                        0% { opacity: 0; transform: translateY(6px); }
                        20% { opacity: 1; transform: translateY(0); }
                        80% { opacity: 1; transform: translateY(0); }
                        100% { opacity: 0; transform: translateY(-6px); }
                    }
                `}</style>

                <div style={{ padding: '0 1rem 0.75rem 1rem', marginTop: '-1px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem 0.75rem' }}>
                        <div
                            style={{
                                padding: '0.375rem 0.5rem',
                                borderRadius: '0.375rem',
                                color: '#374151',
                                fontSize: '0.875rem',
                                lineHeight: '1.4',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                animation: 'toolLogFade 2s ease-in-out 0s infinite'
                            }}
                        >
                            도구: {toolName || '...'}
                        </div>
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
            className={`tool-use-log-container ${isStreaming ? 'streaming' : ''} ${className}`}
            style={{
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
                margin: '0.5rem 0',
                backgroundColor: '#fefdf8',
                ...(isStreaming && {
                    borderColor: '#f59e0b',
                    backgroundColor: '#fefdf8'
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
                <span>🔧 도구 사용 로그</span>
                {toolName && (
                    <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {toolName}
                    </span>
                )}
                {isStreaming && (
                    <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 'bold' }}>(진행 중...)</span>
                )}
                {!isExpanded && !isStreaming && (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(클릭하여 보기)</span>
                )}
            </button>

            {isExpanded && (
                <div style={{ padding: '0 1rem 1rem 1rem', borderTop: '1px solid #e5e7eb', marginTop: '-1px' }}>
                    <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.375rem', fontSize: '0.875rem', lineHeight: '1.5', color: '#374151' }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>도구명:</span>
                            <span style={{ marginLeft: '0.5rem', fontFamily: 'monospace', backgroundColor: '#f3f4f6', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>
                                {toolName}
                            </span>
                        </div>
                        {toolInput && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>입력 데이터:</div>
                                <pre style={{
                                    backgroundColor: '#f9fafb',
                                    padding: '0.75rem',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.8rem',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    overflow: 'auto',
                                    margin: 0
                                }}>
                                    {typeof toolInput === 'object' ? JSON.stringify(toolInput, null, 2) : toolInput}
                                </pre>
                            </div>
                        )}
                        {outputContent && (
                            <div style={{ marginBottom: '0.75rem' }}>
                                <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: '0.5rem' }}>출력 데이터:</div>
                                {parsedOutputs.length > 0 ? (
                                    <div style={{
                                        backgroundColor: '#f0f9ff',
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #e0f2fe',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}>
                                        {parsedOutputs.map((item, index) => (
                                            <div key={index} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.875rem'
                                            }}>
                                                {item.documentNumber && (
                                                    <span style={{
                                                        color: '#3b82f6',
                                                        fontWeight: 'bold',
                                                        fontSize: '0.8rem'
                                                    }}>
                                                        문서 번호 {item.documentNumber}
                                                    </span>
                                                )}
                                                {item.relevanceScore && (
                                                    <span style={{
                                                        color: '#6b7280',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'normal'
                                                    }}>
                                                        [관련도: {item.relevanceScore.toFixed(3)}]
                                                    </span>
                                                )}
                                                {item.sourceInfo ? (
                                                    <SourceButton
                                                        sourceInfo={item.sourceInfo}
                                                        onViewSource={onViewSource || (() => { })}
                                                        className={sourceStyles.inlineCitation}
                                                    />
                                                ) : (
                                                    <span style={{
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.75rem',
                                                        color: '#6b7280'
                                                    }}>
                                                        {item.originalText}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <pre style={{
                                        backgroundColor: '#f0f9ff',
                                        padding: '0.75rem',
                                        borderRadius: '0.375rem',
                                        fontSize: '0.8rem',
                                        fontFamily: 'monospace',
                                        whiteSpace: 'pre-wrap',
                                        overflow: 'auto',
                                        margin: 0,
                                        border: '1px solid #e0f2fe'
                                    }}>
                                        {outputContent}
                                    </pre>
                                )}
                            </div>
                        )}
                        {isStreaming && (
                            <span className="pulse-animation" style={{ color: '#f59e0b', marginLeft: '0.25rem' }}>▮</span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
