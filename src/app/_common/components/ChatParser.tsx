'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiCopy, FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styles from '@/app/chat/assets/chatParser.module.scss';
import { Prism } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface ParsedContent {
    html: string;
    plainText: string;
}

interface CodeBlockProps {
    language: string;
    code: string;
    className?: string;
}

/**
 * 코드 블록 컴포넌트
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code, className = '' }) => {
    const [copied, setCopied] = useState(false);
    const codeRef = useRef<HTMLElement>(null);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);

            // 대체 복사 방법 (구형 브라우저 지원)
            if (codeRef.current) {
                const range = document.createRange();
                range.selectNodeContents(codeRef.current);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
                document.execCommand('copy');
                selection?.removeAllRanges();
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
    };

    return (
        <div className={`code-block-container code-block-${language} ${className}`}>
            <div className="code-block-header">
                <span className="code-language">{language}</span>
                <button
                    className="copy-button"
                    onClick={handleCopy}
                    title="코드 복사"
                >
                    {copied ? <FiCheck /> : <FiCopy />}
                </button>
            </div>
            <Prism
                language={language.toLowerCase()}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    borderRadius: '0 0 0.5rem 0.5rem',
                    border: 'none',
                    padding: '1rem'
                }}
                showLineNumbers
            >
                {code}
            </Prism>
        </div>
    );
};

/**
 * 마크다운 메시지 렌더러 컴포넌트
 */
interface MessageRendererProps {
    content: string;
    isUserMessage?: boolean;
    className?: string;
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
    content,
    isUserMessage = false,
    className = ''
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

    const parsedElements = parseContentToReactElements(content);

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
 * 네스티드 백틱을 고려한 코드 블록 찾기
 */
interface CodeBlockInfo {
    start: number;
    end: number;
    language: string;
    code: string;
}

const findCodeBlocks = (content: string): CodeBlockInfo[] => {
    const blocks: CodeBlockInfo[] = [];
    const lines = content.split('\n');
    let currentIndex = 0;
    let inCodeBlock = false;
    let codeBlockStart = -1;
    let codeBlockLanguage = '';
    let codeBlockContent: string[] = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        if (!inCodeBlock && trimmedLine.startsWith('```')) {
            // 코드 블록 시작
            inCodeBlock = true;
            codeBlockStart = content.indexOf(line, currentIndex);
            codeBlockLanguage = trimmedLine.substring(3).trim() || 'text';
            codeBlockContent = [];
        } else if (inCodeBlock && trimmedLine === '```') {
            // 코드 블록 끝 (정확히 ```만 있는 줄)
            const codeStart = codeBlockStart;
            const codeEnd = content.indexOf(line, currentIndex) + line.length;

            blocks.push({
                start: codeStart,
                end: codeEnd,
                language: codeBlockLanguage,
                code: codeBlockContent.join('\n')
            });

            inCodeBlock = false;
            codeBlockStart = -1;
            codeBlockLanguage = '';
            codeBlockContent = [];
        } else if (inCodeBlock) {
            // 코드 블록 내용
            codeBlockContent.push(line);
        }

        currentIndex = content.indexOf(line, currentIndex) + line.length + 1;
    }

    // 닫히지 않은 코드 블록 처리
    if (inCodeBlock && codeBlockStart !== -1) {
        blocks.push({
            start: codeBlockStart,
            end: content.length,
            language: codeBlockLanguage,
            code: codeBlockContent.join('\n')
        });
    }

    return blocks;
};

/**
 * Think 블록 정보
 */
interface ThinkBlockInfo {
    start: number;
    end: number;
    content: string;
}

/**
 * <think></think> 블록 찾기
 */
const findThinkBlocks = (content: string): ThinkBlockInfo[] => {
    const blocks: ThinkBlockInfo[] = [];
    const thinkRegex = /<think>([\s\S]*?)<\/think>/gi;
    let match;

    while ((match = thinkRegex.exec(content)) !== null) {
        blocks.push({
            start: match.index,
            end: match.index + match[0].length,
            content: match[1].trim()
        });
    }

    return blocks;
};

/**
 * 컨텐츠를 React 엘리먼트로 파싱
 */
const parseContentToReactElements = (content: string): React.ReactNode[] => {
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

    // Think 블록 먼저 처리
    const thinkBlocks = findThinkBlocks(processed);
    // 코드 블록 처리
    const codeBlocks = findCodeBlocks(processed);

    // 모든 블록을 시작 위치 순으로 정렬
    const allBlocks = [
        ...thinkBlocks.map(block => ({ ...block, type: 'think' as const })),
        ...codeBlocks.map(block => ({ ...block, type: 'code' as const }))
    ].sort((a, b) => a.start - b.start);

    for (const block of allBlocks) {
        // 블록 이전 텍스트 처리
        if (block.start > currentIndex) {
            const beforeText = processed.slice(currentIndex, block.start);
            elements.push(...parseSimpleMarkdown(beforeText, elements.length));
        }

        // 블록 타입에 따라 컴포넌트 추가
        if (block.type === 'think') {
            elements.push(
                <ThinkBlock
                    key={`think-${elements.length}`}
                    content={block.content}
                />
            );
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
        elements.push(...parseSimpleMarkdown(remainingText, elements.length));
    }

    return elements;
};

/**
 * 간단한 마크다운 파싱 (코드 블록 제외)
 */
const parseSimpleMarkdown = (text: string, startKey: number): React.ReactNode[] => {
    if (!text.trim()) return [];

    const elements: React.ReactNode[] = [];
    const lines = text.split('\n');

    // 연속된 빈 줄을 하나로 축소하여 처리
    const processedLines: string[] = [];
    let lastWasEmpty = false;

    for (const line of lines) {
        const isEmpty = !line.trim();

        if (isEmpty && lastWasEmpty) {
            // 연속된 빈 줄은 건너뜀
            continue;
        }

        processedLines.push(line);
        lastWasEmpty = isEmpty;
    }

    processedLines.forEach((line, lineIndex) => {
        const processed = line;
        const key = `${startKey}-line-${lineIndex}`;

        // 수평선 처리 (---, ***, ___)
        if (/^[-*_]{3,}$/.test(processed.trim())) {
            elements.push(<hr key={key} style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />);
            return;
        }

        // 헤딩 처리
        const headingMatch = processed.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = processInlineMarkdown(headingMatch[2]);

            const headingElement = React.createElement(
                `h${level}` as any,
                { key, dangerouslySetInnerHTML: { __html: headingText } }
            );
            elements.push(headingElement);
            return;
        }

        // 인용문 처리
        const blockquoteMatch = processed.match(/^>\s*(.+)$/);
        if (blockquoteMatch) {
            const quoteText = processInlineMarkdown(blockquoteMatch[1]);
            elements.push(
                <blockquote key={key} style={{
                    borderLeft: '4px solid #2563eb',
                    margin: '0.5rem 0',
                    padding: '0.5rem 0 0.5rem 1rem',
                    background: 'rgba(37, 99, 235, 0.05)',
                    borderRadius: '0 0.25rem 0.25rem 0',
                    fontStyle: 'italic'
                }}>
                    <div dangerouslySetInnerHTML={{ __html: quoteText }} />
                </blockquote>
            );
            return;
        }

        // 리스트 항목 처리
        const listMatch = processed.match(/^(\s*)-\s+(.+)$/);
        if (listMatch) {
            const indent = listMatch[1].length;
            const listText = processInlineMarkdown(listMatch[2]);
            const marginLeft = indent * 1.5; // 들여쓰기 계산

            elements.push(
                <div key={key} style={{
                    marginLeft: `${marginLeft}rem`,
                    position: 'relative',
                    paddingLeft: '1.5rem',
                    margin: '0.25rem 0'
                }}>
                    <span style={{
                        position: 'absolute',
                        left: '0',
                        top: '0',
                        fontWeight: 'bold'
                    }}>•</span>
                    <div dangerouslySetInnerHTML={{ __html: listText }} />
                </div>
            );
            return;
        }

        // 일반 텍스트 처리
        if (processed.trim()) {
            const processedText = processInlineMarkdown(processed);
            elements.push(
                <div
                    key={key}
                    dangerouslySetInnerHTML={{ __html: processedText }}
                />
            );
        } else {
            // 빈 줄은 하나의 <br>만 추가 (연속된 빈 줄은 이미 필터링됨)
            elements.push(<br key={key} />);
        }
    });

    return elements;
};

/**
 * 인라인 마크다운 처리 (볼드, 이탤릭, 링크 등)
 */
const processInlineMarkdown = (text: string): string => {
    let processed = text;

    // 인라인 코드 처리 (가장 먼저)
    processed = processed.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');

    // 볼드 처리 (**text** 우선, __text__ 나중에)
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // 이탤릭 처리 (*text* 우선, _text_ 나중에) - 볼드와 겹치지 않도록
    processed = processed.replace(/(?<!\*)\*([^*\s][^*]*[^*\s]|\S)\*(?!\*)/g, '<em>$1</em>');
    processed = processed.replace(/(?<!_)_([^_\s][^_]*[^_\s]|\S)_(?!_)/g, '<em>$1</em>');

    // 취소선 처리
    processed = processed.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 링크 처리
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return processed;
};

/**
 * 텍스트에서 코드 언어 감지
 */
export const detectCodeLanguage = (code: string): string => {
    if (code.includes('function') && code.includes('{')) return 'javascript';
    if (code.includes('def ') && code.includes(':')) return 'python';
    if (code.includes('public class') || code.includes('import java')) return 'java';
    if (code.includes('#include') || code.includes('int main')) return 'cpp';
    if (code.includes('SELECT') || code.includes('FROM')) return 'sql';
    if (code.includes('<!DOCTYPE') || code.includes('<html>')) return 'html';
    if (code.includes('body {') || code.includes('.class')) return 'css';
    return 'text';
};

/**
 * 긴 텍스트 줄임
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Think 블록 컴포넌트 - 접힐 수 있는 사고 과정 표시
 */
interface ThinkBlockProps {
    content: string;
    className?: string;
}

export const ThinkBlock: React.FC<ThinkBlockProps> = ({ content, className = '' }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={`think-block-container ${className}`} style={{
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            margin: '0.5rem 0',
            backgroundColor: '#f9fafb'
        }}>
            <button
                onClick={toggleExpanded}
                style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    borderRadius: '0.5rem'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                {isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
                <span>💭 사고 과정</span>
                {!isExpanded && (
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                        (클릭하여 보기)
                    </span>
                )}
            </button>
            {isExpanded && (
                <div style={{
                    padding: '0 1rem 1rem 1rem',
                    borderTop: '1px solid #e5e7eb',
                    marginTop: '-1px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '1rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        color: '#374151',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {content}
                    </div>
                </div>
            )}
        </div>
    );
};
