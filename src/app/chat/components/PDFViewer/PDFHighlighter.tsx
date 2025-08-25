'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import styles from './PDFHighlighter.module.scss';

interface PDFHighlighterProps {
  pageNumber: number;
  highlightRange: HighlightRange;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  textContent?: any; // PDF.js TextContent
}

const PDFHighlighter: React.FC<PDFHighlighterProps> = ({
  pageNumber,
  highlightRange,
  scale,
  pageWidth,
  pageHeight,
  textContent
}) => {
  
  // 현재 페이지가 하이라이트 대상인지 확인
  const shouldHighlight = pageNumber === highlightRange.pageNumber;

  // 기존 하이라이팅 제거 함수
  const removeExistingHighlights = useCallback(() => {
    const pdfContainer = document.querySelector('.react-pdf__Page__textContent');
    if (!pdfContainer) return;

    const highlightedElements = pdfContainer.querySelectorAll(`.${styles.pdfHighlight}`);
    highlightedElements.forEach(element => {
      element.classList.remove(styles.pdfHighlight);
    });
  }, []);

  // PDF 텍스트 요소 찾기 (기존 함수 간소화)
  const findPDFTextLayer = useCallback(() => {
    // 페이지 번호에 따른 텍스트 레이어 검색
    const pageSelectors = [
      `[data-page-number="${pageNumber}"] .react-pdf__Page__textContent`,
      `.react-pdf__Page:nth-child(${pageNumber}) .react-pdf__Page__textContent`,
      '.react-pdf__Page__textContent'
    ];
    
    for (const selector of pageSelectors) {
      const textLayer = document.querySelector(selector);
      if (textLayer) {
        return textLayer;
      }
    }
    
    return null;
  }, [pageNumber]);

  // PDF 텍스트 하이라이팅 적용 함수
  const applyPDFHighlighting = useCallback(() => {
    const textLayer = findPDFTextLayer();
    if (!textLayer) {
      return;
    }

    // 기존 하이라이팅 제거
    removeExistingHighlights();

    // 텍스트 span 요소들 찾기
    const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
    
    if (textSpans.length === 0) {
      return;
    }

    // 유효한 텍스트를 가진 스팬들만 필터링
    const validSpans = textSpans.filter(span => {
      const text = span.textContent?.trim() || '';
      return text.length > 0;
    });

    if (validSpans.length === 0) {
      return;
    }

    // Y 좌표로 정렬하여 라인 구조 만들기
    const spanData = validSpans.map(span => {
      const rect = span.getBoundingClientRect();
      const containerRect = textLayer.getBoundingClientRect();
      
      return {
        span,
        top: rect.top - containerRect.top,
        text: span.textContent?.trim() || ''
      };
    }).sort((a, b) => a.top - b.top);

    // 라인별로 그룹화
    const lineGroups: Array<{ y: number, spans: typeof spanData }> = [];

    spanData.forEach(item => {
      const tolerance = 15; // 15px 오차 허용
      
      // 기존 라인 그룹과 매칭
      let foundGroup = false;
      for (const group of lineGroups) {
        const yDiff = Math.abs(item.top - group.y);
        if (yDiff <= tolerance) {
          group.spans.push(item);
          group.y = (group.y * (group.spans.length - 1) + item.top) / group.spans.length;
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        lineGroups.push({
          y: item.top,
          spans: [item]
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
      if (lineGroup && lineGroup.spans) {
        lineGroup.spans.forEach(item => {
          item.span.classList.add(styles.pdfHighlight);
        });
      }
    }
  }, [highlightRange, findPDFTextLayer, removeExistingHighlights]);

  // DOM 준비 상태 확인
  const waitForPDFDOM = useCallback((maxAttempts: number = 10, interval: number = 200): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkDOM = () => {
        attempts++;
        
        const textLayer = findPDFTextLayer();
        const hasTextSpans = textLayer && textLayer.querySelectorAll('span').length > 0;
        
        if (hasTextSpans) {
          // 텍스트 내용이 실제로 로드되었는지 확인
          const spans = textLayer!.querySelectorAll('span');
          let hasValidContent = false;
          for (let i = 0; i < Math.min(spans.length, 5); i++) {
            const span = spans[i] as HTMLElement;
            if (span.textContent?.trim()) {
              hasValidContent = true;
              break;
            }
          }
          
          if (hasValidContent) {
            resolve(true);
            return;
          }
        }
        
        if (attempts >= maxAttempts) {
          resolve(false);
          return;
        }
        
        setTimeout(checkDOM, interval);
      };
      
      checkDOM();
    });
  }, [findPDFTextLayer]);

  useEffect(() => {
    if (!shouldHighlight) {
      removeExistingHighlights();
      return;
    }

    // DOM 준비 상태를 확인한 후 하이라이팅 실행
    const executeHighlighting = async () => {
      // PDF DOM이 준비될 때까지 대기
      const domReady = await waitForPDFDOM();
      if (!domReady) {
        return;
      }

      // 하이라이팅 적용
      applyPDFHighlighting();
    };

    executeHighlighting();

    // 컴포넌트 언마운트 시 하이라이팅 제거
    return () => {
      removeExistingHighlights();
    };
  }, [shouldHighlight, highlightRange, scale, applyPDFHighlighting, waitForPDFDOM, removeExistingHighlights]);

  // 이 컴포넌트는 실제 DOM을 렌더링하지 않음 (CSS 클래스만 조작)
  return null;
};

export default PDFHighlighter;