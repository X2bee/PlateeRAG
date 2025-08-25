'use client';

import React from 'react';
import SourceButton from '@/app/chat/components/SourceButton';
import { SourceInfo } from '@/app/chat/types/source';
import sourceStyles from '@/app/chat/assets/SourceButton.module.scss';
import { devLog } from '@/app/_common/utils/logger';

/**
 * Citation Placeholder 컴포넌트 - 스트리밍 중 부분적인 citation 표시
 */
export const CitationPlaceholder: React.FC = () => {
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
 * 인라인 마크다운 처리 (볼드, 이탤릭, 링크 등)
 */
export const processInlineMarkdown = (text: string): string => {
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
 * Citation을 포함한 텍스트 처리 - Citation 파싱을 마크다운보다 먼저 수행
 * Cite.로 시작하는 텍스트는 마크다운 렌더링하지 말고 무조건 출처 버튼 처리만 함
 */
export const processInlineMarkdownWithCitations = (
    text: string,
    key: string,
    onViewSource?: (sourceInfo: SourceInfo) => void,
    parseCitation?: (citationText: string) => SourceInfo | null
): React.ReactNode[] => {
    const elements: React.ReactNode[] = [];

    // parseCitation이 없으면 Citation 처리 없이 마크다운만 처리
    if (!parseCitation) {
        const processedText = processInlineMarkdown(text);
        return [<div key={key} dangerouslySetInnerHTML={{ __html: processedText }} />];
    }

    // Citation을 찾기 위한 더 안전한 접근법 - 수동으로 파싱
    const findCitations = (inputText: string): Array<{ start: number, end: number, content: string }> => {
        console.log('🔍 [findCitations] Input text:', inputText);

        // 먼저 전체 텍스트에 대해 기본적인 전처리 수행
        let preprocessedText = inputText;
        // 이중 중괄호를 단일 중괄호로 변환
        preprocessedText = preprocessedText.replace(/\{\{/g, '{').replace(/\}\}/g, '}');
        // 숫자 필드 뒤의 잘못된 따옴표 제거
        preprocessedText = preprocessedText.replace(/(\d)"\s*([,}])/g, '$1$2');

        console.log('🔍 [findCitations] After basic preprocessing:', preprocessedText);

        const citations: Array<{ start: number, end: number, content: string }> = [];
        let i = 0;

        while (i < preprocessedText.length) {
            // [Cite. 패턴 찾기
            const citeStart = preprocessedText.indexOf('[Cite.', i);
            if (citeStart === -1) break;

            // { 또는 {{ 찾기
            let braceStart = -1;
            for (let j = citeStart + 6; j < preprocessedText.length; j++) {
                if (preprocessedText[j] === '{') {
                    braceStart = j;
                    break;
                } else if (preprocessedText[j] !== ' ' && preprocessedText[j] !== '\t') {
                    // 공백이 아닌 다른 문자가 나오면 유효하지 않은 citation
                    break;
                }
            }

            console.log('🔍 [findCitations] Brace start found at:', braceStart);

            if (braceStart === -1) {
                i = citeStart + 6;
                continue;
            }

            // 균형잡힌 괄호 찾기 - 이스케이프 문자 처리 개선
            let braceCount = 1;
            let braceEnd = -1;
            let inString = false;
            let escaped = false;

            console.log('🔍 [findCitations] Starting brace counting from position:', braceStart + 1);

            for (let j = braceStart + 1; j < preprocessedText.length; j++) {
                const char = preprocessedText[j];

                // 이전 문자가 백슬래시인 경우 현재 문자는 이스케이프됨
                if (escaped) {
                    escaped = false;
                    continue;
                }

                // 백슬래시 처리 - 다음 문자를 이스케이프
                if (char === '\\') {
                    escaped = true;
                    continue;
                }

                // 따옴표 처리 - 문자열 상태 토글 (전처리로 인해 더 간단해짐)
                if (char === '"' && !escaped) {
                    inString = !inString;
                    continue;
                }

                // 문자열 내부가 아닐 때만 중괄호 카운팅
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

            console.log('🔍 [findCitations] Final brace end:', braceEnd);

            if (braceEnd !== -1) {
                // 닫는 ] 찾기 (선택적) - 백슬래시는 텍스트 끝까지 포함
                let finalEnd = braceEnd + 1;
                while (finalEnd < preprocessedText.length &&
                    (preprocessedText[finalEnd] === ' ' || preprocessedText[finalEnd] === '\t' ||
                        preprocessedText[finalEnd] === ']' || preprocessedText[finalEnd] === '.' ||
                        preprocessedText[finalEnd] === '\\')) {
                    if (preprocessedText[finalEnd] === ']') {
                        finalEnd++;
                        break;
                    }
                    finalEnd++;
                }

                // 텍스트 끝에 백슬래시가 있는 경우 포함
                if (finalEnd === preprocessedText.length && preprocessedText.endsWith('\\')) {
                    // 백슬래시까지 포함
                }

                console.log('🔍 [findCitations] Found citation from', citeStart, 'to', finalEnd);

                citations.push({
                    start: citeStart,
                    end: finalEnd,
                    content: preprocessedText.slice(citeStart, finalEnd)
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
    console.log('🔍 [processInlineMarkdownWithCitations] Found citations count:', citations.length);
    citations.forEach((cite, idx) => {
        console.log(`🔍 [processInlineMarkdownWithCitations] Citation ${idx}:`, cite);
    });

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
        // Cite.로 시작하면 이스케이프 문자 변환: \" → "
        let processedCitationContent = citation.content;
        if (citation.content.trim().startsWith('Cite.')) {
            processedCitationContent = citation.content.replace(/\\"/g, '"');
        }

        const sourceInfo = parseCitation(processedCitationContent);

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
            // 파싱 실패 시 원본 텍스트 표시 (마크다운 파싱 제외)
            elements.push(
                <span key={`${key}-citation-fallback-${i}`}>
                    {processedCitationContent}
                </span>
            );
        }

        // Citation 처리 후 trailing 문자들 건너뛰기
        let nextIndex = citation.end;
        // Citation 뒤에 있는 }], \, 공백 문자들을 모두 건너뛰기
        while (nextIndex < text.length &&
            /[}\]\\.\s]/.test(text[nextIndex])) {
            nextIndex++;
        }

        currentIndex = nextIndex;
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
 * 간단한 마크다운 파싱 (코드 블록 제외)
 */
export const parseSimpleMarkdown = (
    text: string,
    startKey: number,
    onViewSource?: (sourceInfo: SourceInfo) => void,
    parseCitation?: (citationText: string) => SourceInfo | null
): React.ReactNode[] => {
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
                const processedElements = processInlineMarkdownWithCitations(cleanedLine, key, onViewSource, parseCitation);
                elements.push(...processedElements);
            }
        } else if (elements.length > 0 && processedLines[i - 1]?.trim() !== '') {
            // 연속된 빈 줄이 아닌 경우에만 <br> 추가
            elements.push(<br key={key} />);
        }
    }

    return elements;
};
