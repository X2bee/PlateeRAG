'use client';

import React from 'react';
import { SourceInfo } from '@/app/main/chatSection/types/source';
import { hasLatex, processLatexInText } from '@/app/_common/components/chatParser/ChatParserLatex';
import { processInlineMarkdownWithCitations } from '@/app/_common/components/chatParser/ChatParserCite';

/**
 * 비표준 파이프 문자를 표준 Markdown 파이프(|)로 정규화
 * U+2223 (DIVIDES), U+2502 (BOX DRAWINGS LIGHT VERTICAL) 등을 ASCII 파이프로 변환
 */
export const normalizeTableSeparators = (text: string): string => {
    return text
        .replace(/\u2223/g, '|')  // ∣ (DIVIDES) → |
        .replace(/\u2502/g, '|')  // │ (BOX DRAWINGS LIGHT VERTICAL) → |
        .replace(/\uFF5C/g, '|'); // ｜ (FULLWIDTH VERTICAL LINE) → |
};

/**
 * 테이블 구분자 라인인지 확인하는 헬퍼 함수
 * (예: |:---|:---:|---:|)
 */
export const isSeparatorLine = (line: string): boolean => {
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
 * 텍스트에서 남은 JSON 구문 정리
 */
export const cleanupJsonFragments = (text: string): string => {
    // 단독으로 남은 JSON 구문 제거 (예: '}]', '}', ']' 등)
    return text.replace(/^\s*[}]+\s*$/, '').trim();
};

/**
 * 텍스트에서 마지막 N줄만 추출하는 헬퍼
 * 스트리밍 중 긴 사고과정에서 최근 일부만 미리보기로 보여주기 위해 사용
 */
export const getLastLines = (text: string, n: number = 3): string => {
    if (!text) return text;
    const lines = text.split('\n');
    if (lines.length <= n) return text;
    const lastLines = lines.slice(-n).join('\n');
    return `...\n${lastLines}`;
};

interface MarkdownImageMatch {
    start: number;
    end: number;
    alt: string;
    url: string;
    title?: string;
}

const ALLOWED_IMAGE_PROTOCOLS = ['http:', 'https:', 'data:', 'blob:'];

const sanitizeImageSource = (rawUrl: string): string | null => {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    // React will escape by default, but we defensively guard against unsafe schemes
    const lower = trimmed.toLowerCase();
    if (lower.startsWith('javascript:') || lower.startsWith('vbscript:')) {
        return null;
    }

    try {
        const parsed = new URL(trimmed, 'http://localhost');
        if (parsed.origin === 'http://localhost' && !trimmed.startsWith('http') && !trimmed.startsWith('blob:') && !trimmed.startsWith('data:')) {
            // Relative path - allowed
            return trimmed;
        }
        if (ALLOWED_IMAGE_PROTOCOLS.includes(parsed.protocol)) {
            return trimmed;
        }
    } catch {
        // 입력이 상대경로이거나 URL 생성이 실패한 경우 - 공백/기타는 그대로 허용
        if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
            return trimmed;
        }
    }

    return null;
};

const unescapeMarkdownText = (text: string): string => {
    return text
        .replace(/\\\[/g, '[')
        .replace(/\\\]/g, ']')
        .replace(/\\\(/g, '(')
        .replace(/\\\)/g, ')')
        .replace(/\\!/g, '!')
        .replace(/\\\\/g, '\\');
};

const parseImageDestination = (destination: string): { url: string; title?: string } => {
    let working = destination.trim();
    let title: string | undefined;

    if (working.startsWith('<') && working.endsWith('>')) {
        working = working.slice(1, -1).trim();
    }

    const extractTitle = (quoteChar: '"' | "'") => {
        const first = working.indexOf(quoteChar);
        const last = working.lastIndexOf(quoteChar);
        if (first !== -1 && last !== -1 && last > first) {
            title = working.slice(first + 1, last);
            working = working.slice(0, first).trim();
        }
    };

    if (working.includes('"')) {
        extractTitle('"');
    } else if (working.includes("'")) {
        extractTitle("'");
    }

    return {
        url: working,
        title
    };
};

const findMarkdownImageMatches = (input: string): MarkdownImageMatch[] => {
    const matches: MarkdownImageMatch[] = [];
    let cursor = 0;

    while (cursor < input.length) {
        const bangIndex = input.indexOf('![', cursor);
        if (bangIndex === -1) break;

        const altStart = bangIndex + 2;
        const altEnd = input.indexOf(']', altStart);
        if (altEnd === -1) break;
        if (input[altEnd + 1] !== '(') {
            cursor = altEnd + 1;
            continue;
        }

        const destinationStart = altEnd + 2;
        let depth = 1;
        let pos = destinationStart;
        let destinationEnd = -1;

        while (pos < input.length) {
            const char = input[pos];

            if (char === '\\') {
                pos += 2;
                continue;
            }

            if (char === '(') {
                depth++;
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    destinationEnd = pos;
                    break;
                }
            }

            pos++;
        }

        if (destinationEnd === -1) {
            cursor = altEnd + 1;
            continue;
        }

        const altRaw = input.slice(altStart, altEnd);
        const destinationRaw = input.slice(destinationStart, destinationEnd);
        const { url, title } = parseImageDestination(destinationRaw);

        matches.push({
            start: bangIndex,
            end: destinationEnd + 1,
            alt: unescapeMarkdownText(altRaw.trim()),
            url: unescapeMarkdownText(url.trim()),
            title: title ? title.trim() : undefined
        });

        cursor = destinationEnd + 1;
    }

    return matches;
};

export const renderMarkdownTextWithImages = (
    text: string,
    key: string,
    options: { wrapper?: 'div' | 'span'; className?: string } = {}
): React.ReactNode | null => {
    const { wrapper = 'div', className } = options;
    const matches = findMarkdownImageMatches(text);

    if (matches.length === 0) {
        const processedText = processInlineMarkdown(text);
        if (!processedText) return null;
        if (wrapper === 'span') {
            return <span key={key} className={className} dangerouslySetInnerHTML={{ __html: processedText }} />;
        }
        return <div key={key} className={className} dangerouslySetInnerHTML={{ __html: processedText }} />;
    }

    const Wrapper = wrapper === 'span' ? 'span' : 'div';
    const children: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, index) => {
        if (match.start > lastIndex) {
            const slice = text.slice(lastIndex, match.start);
            if (slice.trim()) {
                const html = processInlineMarkdown(slice);
                if (html) {
                    children.push(
                        <span key={`${key}-text-${index}`} dangerouslySetInnerHTML={{ __html: html }} />
                    );
                }
            }
        }

        const sanitizedUrl = sanitizeImageSource(match.url);
        if (sanitizedUrl) {
            children.push(
                <span key={`${key}-img-${index}`} className="markdown-image-wrapper">
                    <img
                        src={sanitizedUrl}
                        alt={match.alt || ''}
                        title={match.title || undefined}
                        loading="lazy"
                    />
                </span>
            );
        } else {
            const fallbackHtml = processInlineMarkdown(`![${match.alt}](${match.url})`);
            children.push(
                <span key={`${key}-img-fallback-${index}`} dangerouslySetInnerHTML={{ __html: fallbackHtml }} />
            );
        }

        lastIndex = match.end;
    });

    if (lastIndex < text.length) {
        const slice = text.slice(lastIndex);
        if (slice.trim()) {
            const html = processInlineMarkdown(slice);
            if (html) {
                children.push(
                    <span key={`${key}-text-final`} dangerouslySetInnerHTML={{ __html: html }} />
                );
            }
        }
    }

    if (children.length === 0) {
        return null;
    }

    return (
        <Wrapper key={key} className={className}>
            {children}
        </Wrapper>
    );
};

/**
 * 인라인 마크다운 처리 (볼드, 이탤릭, 링크 등) - LaTeX 제외
 */
export const processInlineMarkdown = (text: string): string => {
    let processed = cleanupJsonFragments(text);

    // LaTeX가 있는 경우 처리하지 않고 원본 반환 (LaTeX는 별도 처리됨)
    if (hasLatex(processed)) {
        return processed;
    }

    // 인라인 코드 처리 (가장 먼저)
    processed = processed.replace(/`([^`\n]+)`/g, '<code class="inline-code">$1</code>');

    // 볼드 처리 (**text** 우선, __text__ 나중에)
    processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // 이탤릭 처리 (*text* 우선, _text_ 나중에) - 볼드와 겹치지 않도록
    processed = processed.replace(/(?<!\*)\*([^*\s][^*]*[^*\s]|\S)\*(?!\*)/g, '<em>$1</em>');
    // processed = processed.replace(/(?<!_)_([^_\s][^_]*[^_\s]|\S)_(?!_)/g, '<em>$1</em>');

    // 취소선 처리
    processed = processed.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 링크 처리 - Citation이 아닌 일반 링크만 처리
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return processed;
};

/**
 * 간단한 마크다운 파싱 (코드 블록 제외)
 */
export const parseSimpleMarkdown = (
    text: string,
    startKey: number,
    onViewSource?: (sourceInfo: SourceInfo) => void,
    parseCitation?: (citationText: string) => SourceInfo | null,
    isStreaming: boolean = false,
    onHeightChange?: () => void
): React.ReactNode[] => {
    if (!text.trim()) return [];

    // LaTeX가 포함된 경우 전체 텍스트를 LaTeX 처리기로 넘김 (라인 분할하지 않음)
    if (hasLatex(text)) {
        return processLatexInText(text, `${startKey}-latex`, isStreaming, onHeightChange);
    }

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
        const line = normalizeTableSeparators(processedLines[i]);
        const key = `${startKey}-block-${i}`;

        // --- 테이블 파싱 로직 (추가된 부분) ---
        const isTableLine = (str: string) => str.trim().includes('|');
        const isTableSeparator = (str: string) => /^\s*\|?(\s*:?-+:?\s*\|)+(\s*:?-+:?\s*\|?)\s*$/.test(str.trim());

        const nextLine = processedLines[i + 1] ? normalizeTableSeparators(processedLines[i + 1]) : undefined;
        if (isTableLine(line) && nextLine && isTableSeparator(nextLine)) {
            const headerLine = line;
            const separatorLine = nextLine;
            const bodyLines = [];

            let tableEndIndex = i + 2;
            while (tableEndIndex < processedLines.length) {
                const normalizedLine = normalizeTableSeparators(processedLines[tableEndIndex]);
                if (isTableLine(normalizedLine) && !isTableSeparator(normalizedLine)) {
                    bodyLines.push(normalizedLine);
                    tableEndIndex++;
                } else {
                    break;
                }
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
                            <div>{processInlineMarkdownWithCitations(header, `${key}-header-${index}`, onViewSource, parseCitation, isStreaming)}</div>
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
                                <div>{processInlineMarkdownWithCitations(cell, `${key}-cell-${rowIndex}-${cellIndex}`, onViewSource, parseCitation, isStreaming)}</div>
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
            const headingContent = processInlineMarkdownWithCitations(headingMatch[2], `${key}-heading`, onViewSource, parseCitation, isStreaming);
            // eslint-disable-next-line react/no-children-prop
            const headingElement = React.createElement(`h${level}`, { key, children: headingContent });
            elements.push(headingElement);
            continue;
        }

        // 인용문 처리
        const blockquoteMatch = line.match(/^>\s*(.+)$/);
        if (blockquoteMatch) {
            const quoteContent = processInlineMarkdownWithCitations(blockquoteMatch[1], `${key}-quote`, onViewSource, parseCitation, isStreaming);
            elements.push(
                <blockquote key={key} style={{ borderLeft: '4px solid #2563eb', margin: '0.5rem 0', padding: '0.5rem 0 0.5rem 1rem', background: 'rgba(37, 99, 235, 0.05)', borderRadius: '0 0.25rem 0.25rem 0', fontStyle: 'italic' }}>
                    <div>{quoteContent}</div>
                </blockquote>
            );
            continue;
        }

        // 리스트 항목 처리
        const listMatch = line.match(/^(\s*)-\s+(.+)$/);
        if (listMatch) {
            const indent = listMatch[1].length;
            const marginLeft = indent * 1.5;
            const listContent = processInlineMarkdownWithCitations(listMatch[2], `${key}-list`, onViewSource, parseCitation, isStreaming);
            elements.push(
                <div key={key} style={{ marginLeft: `${marginLeft}rem`, position: 'relative', paddingLeft: '1.5rem', margin: '0.25rem 0' }}>
                    <span style={{ position: 'absolute', left: '0', top: '0', fontWeight: 'bold' }}>•</span>
                    <div>{listContent}</div>
                </div>
            );
            continue;
        }

        // 일반 텍스트 처리
        if (line.trim()) {
            const cleanedLine = cleanupJsonFragments(line);
            if (cleanedLine) {
                const processedElements = processInlineMarkdownWithCitations(cleanedLine, key, onViewSource, parseCitation, isStreaming);
                elements.push(...processedElements);
            }
        } else if (elements.length > 0 && processedLines[i - 1]?.trim() !== '') {
            // 연속된 빈 줄이 아닌 경우에만 <br> 추가
            elements.push(<br key={key} />);
        }
    }

    return elements;
};
