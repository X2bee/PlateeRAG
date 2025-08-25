'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import './DocxHighlighter.css';
import { filterHighlightWords, isTextMatch } from './highlightConstants';

interface DocxHighlighterProps {
  highlightRange: HighlightRange;
  scale: number;
}

const DocxHighlighter: React.FC<DocxHighlighterProps> = ({
  highlightRange,
  scale
}) => {

  // 기존 하이라이팅 제거 함수
  const removeExistingHighlights = useCallback(() => {
    const docxContainer = document.querySelector('[class*="docxContent"], [class*="docxContainer"], .docx-content, .docx-container');
    if (!docxContainer) return;

    const highlightedElements = docxContainer.querySelectorAll('.docx-highlight');
    highlightedElements.forEach(element => {
      element.classList.remove('docx-highlight');
    });
  }, []);

  // DOCX HTML 콘텐츠에서 텍스트 라인을 찾고 하이라이팅 적용 함수
  const applyDocxHighlighting = useCallback(() => {
    const docxContainer = document.querySelector('[class*="docxContent"], [class*="docxContainer"], .docx-content, .docx-container');
    if (!docxContainer) {
      return;
    }

    // 기존 하이라이팅 제거
    removeExistingHighlights();

    // 텍스트가 있는 모든 요소 찾기 (p, span, div, h1-h6 등)
    const textElements: HTMLElement[] = [];
    const potentialTextElements = docxContainer.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th');
    
    potentialTextElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (htmlElement.textContent && htmlElement.textContent.trim().length > 0) {
        // 자식 요소가 없거나, 직접적인 텍스트 내용이 있는 요소만 선택
        const hasDirectText = Array.from(htmlElement.childNodes).some(
          child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
        );
        
        if (hasDirectText || htmlElement.children.length === 0) {
          textElements.push(htmlElement);
        }
      }
    });

    // 텍스트 매칭 기반 하이라이팅만 적용
    if (highlightRange.searchText && highlightRange.searchText.trim()) {
      const searchText = highlightRange.searchText.trim().toLowerCase();
      
      // 검색 텍스트를 단어 단위로 분리하고 제외할 단어들 필터링
      const searchWords = filterHighlightWords(searchText);
      
      // 유효한 검색 단어가 없으면 하이라이팅 안 함
      if (searchWords.length === 0) {
        return;
      }
      
      textElements.forEach(element => {
        const elementText = element.textContent?.trim().toLowerCase() || '';
        
        // 요소의 텍스트가 검색 단어 중 하나라도 포함하면 하이라이팅
        const hasMatch = searchWords.some(word => isTextMatch(word, elementText));
        
        if (hasMatch) {
          element.classList.add('docx-highlight');
        }
      });
    }
  }, [highlightRange, removeExistingHighlights]);

  // DOM 준비 상태 확인
  const waitForDocxDOM = useCallback((maxAttempts: number = 10, interval: number = 200): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkDOM = () => {
        attempts++;
        
        const docxContainer = document.querySelector('[class*="docxContent"], [class*="docxContainer"], .docx-content, .docx-container');
        const hasContent = docxContainer && docxContainer.textContent && docxContainer.textContent.trim().length > 0;
        
        if (hasContent) {
          resolve(true);
          return;
        }
        
        if (attempts >= maxAttempts) {
          resolve(false);
          return;
        }
        
        setTimeout(checkDOM, interval);
      };
      
      checkDOM();
    });
  }, []);

  useEffect(() => {
    const executeHighlighting = async () => {
      // DOCX DOM이 준비될 때까지 대기
      const domReady = await waitForDocxDOM();
      if (!domReady) {
        return;
      }

      // 하이라이팅 적용
      applyDocxHighlighting();
    };

    executeHighlighting();

    // 컴포넌트 언마운트 시 하이라이팅 제거
    return () => {
      removeExistingHighlights();
    };
  }, [highlightRange, scale, applyDocxHighlighting, removeExistingHighlights, waitForDocxDOM]);

  // 이 컴포넌트는 실제 DOM을 렌더링하지 않음 (CSS 클래스만 조작)
  return null;
};

export default DocxHighlighter;