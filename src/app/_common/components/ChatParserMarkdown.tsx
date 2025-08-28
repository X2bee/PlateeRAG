'use client';

import React from 'react';
import { SourceInfo } from '@/app/chat/types/source';
import { hasLatex, processLatexInText } from './ChatParserLatex';
import { processInlineMarkdownWithCitations } from './ChatParserCite';

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
