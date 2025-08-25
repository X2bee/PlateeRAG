'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import './DocxHighlighter.css';

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

    // Y 좌표로 정렬하여 라인 구조 만들기
    const elementsWithPosition = textElements.map(element => {
      const rect = element.getBoundingClientRect();
      const containerRect = docxContainer.getBoundingClientRect();
      
      return {
        element,
        top: rect.top - containerRect.top,
        left: rect.left - containerRect.left,
        text: element.textContent?.trim() || ''
      };
    }).filter(item => item.text.length > 0);

    // Y 좌표로 정렬
    elementsWithPosition.sort((a, b) => a.top - b.top);

    // 라인별로 그룹화
    const lineGroups: Array<{ y: number, elements: typeof elementsWithPosition }> = [];

    elementsWithPosition.forEach(item => {
      const tolerance = 15; // 15px 오차 허용
      
      // 기존 라인 그룹과 매칭
      let foundGroup = false;
      for (const group of lineGroups) {
        const yDiff = Math.abs(item.top - group.y);
        if (yDiff <= tolerance) {
          group.elements.push(item);
          group.y = (group.y * (group.elements.length - 1) + item.top) / group.elements.length;
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        lineGroups.push({
          y: item.top,
          elements: [item]
        });
      }
    });

    // 라인 그룹을 Y 좌표로 정렬
    lineGroups.sort((a, b) => a.y - b.y);

    // 지정된 라인 범위에 하이라이팅 적용
    const startLine = highlightRange.lineStart - 1; // 0-based index
    const endLine = highlightRange.lineEnd - 1;

    for (let lineIndex = startLine; lineIndex <= endLine && lineIndex < lineGroups.length; lineIndex++) {
      const lineGroup = lineGroups[lineIndex];
      if (lineGroup && lineGroup.elements) {
        lineGroup.elements.forEach(item => {
          item.element.classList.add('docx-highlight');
        });
      }
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