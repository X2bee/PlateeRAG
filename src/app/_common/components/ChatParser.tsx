'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FiCopy, FiCheck, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import styles from '@/app/chat/assets/chatParser.module.scss';
import { APP_CONFIG } from '@/app/config';
import SourceButton from '@/app/chat/components/SourceButton';
import { SourceInfo } from '@/app/chat/types/source';
import sourceStyles from '@/app/chat/assets/SourceButton.module.scss';
import { devLog } from '@/app/_common/utils/logger';

import { Prism } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Think 블록 표시 여부를 제어하는 상수 (환경변수에서 가져옴)
const showThinkBlock = APP_CONFIG.SHOW_THINK_BLOCK;

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

    const displayLanguage = language.toLowerCase();


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
                language={displayLanguage}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    borderRadius: '0 0 0.5rem 0.5rem',
                    border: 'none',
                    padding: '1rem',
                    whiteSpace: 'pre',
                    lineHeight: '1.5'
                }}
                showLineNumbers
            >
                {String(code).replace(/\n$/, '')}
            </Prism>
        </div>
    );
};

/**
 * Citation 정보를 파싱하는 함수
 */
const parseCitation = (citationText: string): SourceInfo | null => {
    console.log('🔍 [parseCitation] Attempting to parse citation:', citationText);
    try {
        // 단계별로 다양한 패턴 시도
        let jsonString = '';
        
        // 1. 기본 패턴: [Cite. {JSON}] (끝에 추가 문자가 있을 수도 있음)
        let match = citationText.match(/\[Cite\.\s*(\{.*?\})[\].\s\\]*\.?$/);
        if (match) {
            jsonString = match[1];
            console.log('✅ [parseCitation] Pattern 1 matched:', jsonString);
        } else {
            // 2. 기본 패턴 (닫는 대괄호와 함께): [Cite. {JSON}]
            match = citationText.match(/\[Cite\.\s*(\{.*?\})\]/);
            if (match) {
                jsonString = match[1];
            } else {
                // 3. 닫는 대괄호가 없는 경우: [Cite. {JSON}
                match = citationText.match(/\[Cite\.\s*(\{.*?\})/);
                if (match) {
                    jsonString = match[1];
                } else {
                    // 4. Citation 키워드 뒤에 JSON만 있는 경우
                    match = citationText.match(/Cite\.\s*(\{.*?\})/);
                    if (match) {
                        jsonString = match[1];
                    } else {
                        // 5. JSON만 있는 경우 (배열 포함)
                        match = citationText.match(/(\{.*?\}|\[.*?\])/);
                        if (match) {
                            jsonString = match[1];
                        }
                    }
                }
            }
        }
        
        if (!jsonString) {
            return null;
        }
        
        // JSON 문자열 정리
        jsonString = jsonString.trim();
        
        // 다양한 이스케이프 처리
        jsonString = jsonString.replace(/\\"/g, '"');     // 이스케이프된 따옴표
        jsonString = jsonString.replace(/\\n/g, '\n');    // 이스케이프된 줄바꿈
        jsonString = jsonString.replace(/\\t/g, '\t');    // 이스케이프된 탭
        jsonString = jsonString.replace(/\\r/g, '\r');    // 이스케이프된 캐리지 리턴
        jsonString = jsonString.replace(/\\+/g, '\\');    // 연속된 백슬래시 처리
        
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
        console.error('Failed to parse citation:', error);
        console.error('Citation text:', citationText);
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
        console.error('Manual parsing failed:', error);
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
 * 스택(Stack)을 이용해 중첩 구조를 완벽히 파악하고 스트리밍을 지원하는 최종 파서
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

    let inCodeBlock = false;
    const fenceStack: string[] = [];  // 중첩된 펜스를 추적하기 위한 스택
    let codeBlockLanguage = '';
    let codeBlockContent: string[] = [];
    let codeBlockStart = -1;
    let currentIndex = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        const fenceMatch = trimmedLine.match(/^`{3,}|~{3,}/);

        if (!inCodeBlock && fenceMatch) {
            inCodeBlock = true;
            const fence = fenceMatch[0];
            fenceStack.push(fence);

            codeBlockLanguage = trimmedLine.substring(fence.length).trim() || 'text';
            codeBlockStart = currentIndex;
            codeBlockContent = [];
        } else if (inCodeBlock) {
            codeBlockContent.push(line);

            if (fenceMatch) {
                const currentFence = fenceMatch[0];
                const topOfStack = fenceStack[fenceStack.length - 1];

                if (currentFence.length === topOfStack.length && trimmedLine.length === currentFence.length) {
                    fenceStack.pop();
                } else {
                    fenceStack.push(currentFence);
                }
            }

            if (fenceStack.length === 0) {
                const codeEnd = currentIndex + line.length;
                blocks.push({
                    start: codeBlockStart,
                    end: codeEnd,
                    language: codeBlockLanguage,
                    code: codeBlockContent.slice(0, -1).join('\n'),
                });

                inCodeBlock = false;
            }
        }

        currentIndex += line.length + 1;
    }

    if (inCodeBlock) {
        blocks.push({
            start: codeBlockStart,
            end: content.length,
            language: codeBlockLanguage,
            code: codeBlockContent.join('\n'),
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
 * <think></think> 블록 찾기 (스트리밍 지원)
 * 완성된 블록과 미완성된 블록 모두 처리
 */
const findThinkBlocks = (content: string): ThinkBlockInfo[] => {
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
            elements.push(...parseSimpleMarkdown(beforeText, elements.length, onViewSource));
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
                elements.push(
                    <ThinkBlock
                        key={`think-${elements.length}`}
                        content={block.content}
                        isStreaming={isStreaming}
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
        elements.push(...parseSimpleMarkdown(remainingText, elements.length, onViewSource));
    }

    return elements;
};

/**
 * 테이블 구분자 라인인지 확인하는 헬퍼 함수
 * (예: |:---|:---:|---:|)
 */
const isSeparatorLine = (line: string): boolean => {
    const trimmedLine = line.trim();
    if (!trimmedLine.includes('|') || !trimmedLine.includes('-')) {
        return false;
    }
    // 양 끝의 '|'를 제거하고, 각 컬럼을 분리
    const columns = trimmedLine.replace(/^\|/, '').replace(/\|$/, '').split('|');

    // 모든 컬럼이 유효한 구분자 형식인지 확인 (최소 3개의 하이픈)
    return columns.length > 0 && columns.every(col => /^\s*:?-{3,}:?\s*$/.test(col));
};


/**
 * 간단한 마크다운 파싱 (코드 블록 제외)
 */
const parseSimpleMarkdown = (text: string, startKey: number, onViewSource?: (sourceInfo: SourceInfo) => void): React.ReactNode[] => {
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

    for (let i = 0; i < processedLines.length; i++) {
        const line = processedLines[i];
        const key = `${startKey}-block-${i}`;

        // --- 테이블 파싱 로직 (추가된 부분) ---
        const isTableLine = (str: string) => str.trim().includes('|');
        const isTableSeparator = (str: string) => /^\s*\|?(\s*:?-+:?\s*\|)+(\s*:?-+:?\s*\|?)\s*$/.test(str.trim());

        const nextLine = processedLines[i + 1];
        if (isTableLine(line) && nextLine && isTableSeparator(nextLine)) {
            const headerLine = line;
            const separatorLine = nextLine;
            const bodyLines = [];

            let tableEndIndex = i + 2;
            while (tableEndIndex < processedLines.length && isTableLine(processedLines[tableEndIndex]) && !isTableSeparator(processedLines[tableEndIndex])) {
                bodyLines.push(processedLines[tableEndIndex]);
                tableEndIndex++;
            }

            // 정렬 처리 (이제 separatorLine은 항상 정의되어 있음)
            const alignments = separatorLine.trim().replace(/^\||\|$/g, '').split('|').map(s => {
                const trimmed = s.trim();
                if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
                if (trimmed.endsWith(':')) return 'right';
                return 'left';
            });

            // 테이블 셀 파싱 헬퍼 함수
            const parseTableRow = (rowStr: string) => rowStr.trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());

            // 헤더 생성
            const headers = parseTableRow(headerLine);
            const headerElement = (
                 <tr key="header">
                    {headers.map((header, index) => (
                        <th key={index} style={{ textAlign: alignments[index] || 'left', padding: '0.5rem 1rem', border: '1px solid #d1d5db' }}>
                            <div dangerouslySetInnerHTML={{ __html: processInlineMarkdown(header) }} />
                        </th>
                    ))}
                </tr>
            );

            // 본문 생성
            const bodyElements = bodyLines.map((bodyLine, rowIndex) => {
                const cells = parseTableRow(bodyLine);
                return (
                    <tr key={rowIndex}>
                        {cells.map((cell, cellIndex) => (
                            <td key={cellIndex} style={{ textAlign: alignments[cellIndex] || 'left', padding: '0.5rem 1rem', border: '1px solid #d1d5db' }}>
                                <div dangerouslySetInnerHTML={{ __html: processInlineMarkdown(cell) }} />
                            </td>
                        ))}
                    </tr>
                );
            });

            elements.push(
                <table key={key} style={{ borderCollapse: 'collapse', width: '100%', margin: '1rem 0', border: '1px solid #d1d5db' }}>
                    <thead style={{ background: '#f9fafb' }}>{headerElement}</thead>
                    <tbody>{bodyElements}</tbody>
                </table>
            );

            // 테이블로 처리된 라인만큼 인덱스를 건너뜀
            i = tableEndIndex - 1;
            continue;
        }

        // 수평선 처리 (---, ***, ___)
        if (/^[-*_]{3,}$/.test(line.trim())) {
            elements.push(<hr key={key} style={{ margin: '1rem 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />);
            continue;
        }

        // 헤딩 처리
        const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const headingText = processInlineMarkdown(headingMatch[2]);
            const headingElement = React.createElement(`h${level}`, { key, dangerouslySetInnerHTML: { __html: headingText } });
            elements.push(headingElement);
            continue;
        }

        // 인용문 처리
        const blockquoteMatch = line.match(/^>\s*(.+)$/);
        if (blockquoteMatch) {
            const quoteText = processInlineMarkdown(blockquoteMatch[1]);
            elements.push(
                <blockquote key={key} style={{ borderLeft: '4px solid #2563eb', margin: '0.5rem 0', padding: '0.5rem 0 0.5rem 1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '0 0.25rem 0.25rem 0', fontStyle: 'italic' }}>
                    <div dangerouslySetInnerHTML={{ __html: quoteText }} />
                </blockquote>
            );
            continue;
        }

        // 리스트 항목 처리
        const listMatch = line.match(/^(\s*)-\s+(.+)$/);
        if (listMatch) {
            const indent = listMatch[1].length;
            const listText = processInlineMarkdown(listMatch[2]);
            const marginLeft = indent * 1.5;
            elements.push(
                <div key={key} style={{ marginLeft: `${marginLeft}rem`, position: 'relative', paddingLeft: '1.5rem', margin: '0.25rem 0' }}>
                    <span style={{ position: 'absolute', left: '0', top: '0', fontWeight: 'bold' }}>•</span>
                    <div dangerouslySetInnerHTML={{ __html: listText }} />
                </div>
            );
            continue;
        }

        // 일반 텍스트 처리
        if (line.trim()) {
            const cleanedLine = cleanupJsonFragments(line);
            if (cleanedLine) {
                const processedElements = processInlineMarkdownWithCitations(cleanedLine, key, onViewSource);
                elements.push(...processedElements);
            }
        } else if (elements.length > 0 && processedLines[i - 1]?.trim() !== '') {
            // 연속된 빈 줄이 아닌 경우에만 <br> 추가
            elements.push(<br key={key} />);
        }
    }

    return elements;
};

/**
 * Citation Placeholder 컴포넌트 - 스트리밍 중 부분적인 citation 표시
 */
const CitationPlaceholder: React.FC = () => {
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
            📑 출처 정보 로딩 중...
        </span>
    );
};

/**
 * Citation을 포함한 텍스트 처리 - Citation 파싱을 마크다운보다 먼저 수행
 */
const processInlineMarkdownWithCitations = (text: string, key: string, onViewSource?: (sourceInfo: SourceInfo) => void): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];
    
    // Citation을 찾기 위한 더 안전한 접근법 - 수동으로 파싱
    const findCitations = (inputText: string): Array<{ start: number, end: number, content: string }> => {
        const citations: Array<{ start: number, end: number, content: string }> = [];
        let i = 0;
        
        while (i < inputText.length) {
            // [Cite. 패턴 찾기
            const citeStart = inputText.indexOf('[Cite.', i);
            if (citeStart === -1) break;
            
            // { 찾기
            let braceStart = -1;
            for (let j = citeStart + 6; j < inputText.length; j++) {
                if (inputText[j] === '{') {
                    braceStart = j;
                    break;
                } else if (inputText[j] !== ' ' && inputText[j] !== '\t') {
                    // 공백이 아닌 다른 문자가 나오면 유효하지 않은 citation
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
                
                if (char === '"') {
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
                // 닫는 ] 찾기 (선택적)
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
                
                citations.push({
                    start: citeStart,
                    end: finalEnd,
                    content: inputText.slice(citeStart, finalEnd)
                });
                
                i = finalEnd;
            } else {
                i = citeStart + 6;
            }
        }
        
        return citations;
    };
    
    console.log('🔍 [processInlineMarkdownWithCitations] Looking for citations in text:', text);
    
    // 1. Citation 우선 처리 - 마크다운 파싱보다 먼저 수행
    const citations = findCitations(text);
    
    if (citations.length === 0) {
        // Citation이 없는 경우 부분적인 citation 확인
        const partialCitationRegex = /\[Cite\.(?:\s*\{[^}]*)?$/;
        const partialMatch = partialCitationRegex.exec(text);
        
        if (partialMatch) {
            // 부분적인 citation 이전 텍스트 처리 - 마크다운 파싱 적용
            const beforeText = text.slice(0, partialMatch.index);
            if (beforeText) {
                const processedText = processInlineMarkdown(beforeText);
                elements.push(
                    <span key={`${key}-text-before`} dangerouslySetInnerHTML={{ __html: processedText }} />
                );
            }
            
            // 부분적인 citation placeholder 추가
            elements.push(
                <CitationPlaceholder key={`${key}-partial`} />
            );
            
            return [<div key={key} className={sourceStyles.lineWithCitations}>{elements}</div>];
        } else {
            // Citation이 전혀 없는 경우 마크다운 파싱 적용
            const processedText = processInlineMarkdown(text);
            return [<div key={key} dangerouslySetInnerHTML={{ __html: processedText }} />];
        }
    }
    
    // 2. Citation이 있는 경우 Citation과 텍스트를 분할하여 처리
    let currentIndex = 0;
    
    for (let i = 0; i < citations.length; i++) {
        const citation = citations[i];
        
        // Citation 이전 텍스트 처리 - 마크다운 파싱 적용
        if (citation.start > currentIndex) {
            const beforeText = text.slice(currentIndex, citation.start);
            if (beforeText.trim()) {
                const processedText = processInlineMarkdown(beforeText);
                elements.push(
                    <span key={`${key}-text-${i}`} dangerouslySetInnerHTML={{ __html: processedText }} />
                );
            }
        }
        
        // Citation 처리 - 버튼으로 변환 (마크다운 파싱 제외)
        const sourceInfo = parseCitation(citation.content);
        
        console.log('✅ [processInlineMarkdownWithCitations] Found citation:', citation.content);
        devLog.log('🔍 [processInlineMarkdownWithCitations] Parsed sourceInfo:', sourceInfo);
        
        if (sourceInfo && onViewSource) {
            devLog.log('✅ [processInlineMarkdownWithCitations] Creating SourceButton');
            elements.push(
                <SourceButton
                    key={`${key}-citation-${i}`}
                    sourceInfo={sourceInfo}
                    onViewSource={onViewSource}
                    className={sourceStyles.inlineCitation}
                />
            );
        } else {
            console.log('❌ [processInlineMarkdownWithCitations] Citation parsing failed, showing fallback');
            // 파싱 실패 시 원본 텍스트 표시 (마크다운 파싱 제외)
            elements.push(
                <span key={`${key}-citation-fallback-${i}`}>
                    {citation.content}
                </span>
            );
        }
        
        currentIndex = citation.end;
    }
    
    // 남은 텍스트 처리 - 마크다운 파싱 적용
    if (currentIndex < text.length) {
        const remainingText = text.slice(currentIndex);
        if (remainingText.trim()) {
            const processedText = processInlineMarkdown(remainingText);
            elements.push(
                <span key={`${key}-text-remaining`} dangerouslySetInnerHTML={{ __html: processedText }} />
            );
        }
    }
    
    // Citation이 있는 경우 div로 감싸기
    return [<div key={key} className={sourceStyles.lineWithCitations}>{elements}</div>];
};

/**
 * 텍스트에서 남은 JSON 구문 정리
 */
const cleanupJsonFragments = (text: string): string => {
    // 단독으로 남은 JSON 구문 제거 (예: '}]', '}', ']' 등)
    return text.replace(/^\s*[}]+\s*$/, '').trim();
};

/**
 * 인라인 마크다운 처리 (볼드, 이탤릭, 링크 등)
 */
const processInlineMarkdown = (text: string): string => {
    let processed = cleanupJsonFragments(text);

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
 * Think 블록 컴포넌트 - 접힐 수 있는 사고 과정 표시 (스트리밍 지원)
 */
interface ThinkBlockProps {
    content: string;
    className?: string;
    isStreaming?: boolean; // 스트리밍 중인지 여부
}

export const ThinkBlock: React.FC<ThinkBlockProps> = ({
    content,
    className = '',
    isStreaming = false
}) => {
    // 스트리밍 중일 때는 펼쳐진 상태, 완료되면 접힌 상태
    const [isExpanded, setIsExpanded] = useState(isStreaming);

    // isStreaming 상태가 변경될 때 UI 상태 업데이트
    useEffect(() => {
        if (isStreaming) {
            setIsExpanded(true);  // 스트리밍 중일 때는 펼쳐진 상태
        } else {
            setIsExpanded(false); // 완료되면 접힌 상태
        }
    }, [isStreaming]);

    const toggleExpanded = () => {
        // 스트리밍 중일 때는 접기/펼치기 비활성화
        if (!isStreaming) {
            setIsExpanded(!isExpanded);
        }
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
                    if (!isStreaming) {
                        e.currentTarget.style.backgroundColor = '#f3f4f6';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isStreaming) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }
                }}
            >
                {isStreaming ? (
                    <FiChevronDown size={16} style={{ opacity: 0.5 }} />
                ) : (
                    isExpanded ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />
                )}
                <span>💭 사고 과정</span>
                {isStreaming && (
                    <span style={{
                        color: '#3b82f6',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                    }}>
                        (진행 중...)
                    </span>
                )}
                {!isExpanded && !isStreaming && (
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
                        {isStreaming && (
                            <span className="pulse-animation" style={{
                                color: '#3b82f6',
                                marginLeft: '0.25rem'
                            }}>
                                ▋
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
