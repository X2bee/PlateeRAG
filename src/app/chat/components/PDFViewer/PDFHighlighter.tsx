'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import styles from './PDFHighlighter.module.scss';
import { filterHighlightWords, isTextMatch } from './highlightConstants';

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

    // 텍스트 매칭 기반 하이라이팅만 적용
    if (highlightRange.searchText && highlightRange.searchText.trim()) {
      const searchText = highlightRange.searchText.trim().toLowerCase();
      
      // 검색 텍스트를 단어 단위로 분리하고 제외할 단어들 필터링
      const searchWords = filterHighlightWords(searchText);
      
      // 유효한 검색 단어가 없으면 하이라이팅 안 함
      if (searchWords.length === 0) {
        return;
      }
      
      validSpans.forEach(span => {
        const spanText = span.textContent?.trim().toLowerCase() || '';
        
        // 스팬의 텍스트가 검색 단어 중 하나라도 포함하면 하이라이팅
        const hasMatch = searchWords.some(word => isTextMatch(word, spanText));
        
        if (hasMatch) {
          span.classList.add(styles.pdfHighlight);
        }
      });
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