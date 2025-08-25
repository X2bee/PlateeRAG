'use client';

import React, { useState, useRef } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';
import { Prism } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
 * 코드 블록 정보
 */
export interface CodeBlockInfo {
    start: number;
    end: number;
    language: string;
    code: string;
}

/**
 * 스택(Stack)을 이용해 중첩 구조를 완벽히 파악하고 스트리밍을 지원하는 코드 블록 파서
 */
export const findCodeBlocks = (content: string): CodeBlockInfo[] => {
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
