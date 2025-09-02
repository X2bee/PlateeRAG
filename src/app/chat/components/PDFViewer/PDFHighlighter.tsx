'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import styles from './PDFHighlighter.module.scss';
import highlightStyles from './HighlightStyles.module.scss';
import { filterHighlightWords, isTextMatch } from './highlightConstants';
import { fuzzyTextMatch, defaultFuzzyOptions } from './fuzzyMatcher';
import { processTextForHighlighting, NamedEntity } from './textProcessor';
import { 
  defaultHighlightConfig, 
  determineHighlightLevel, 
  getHighlightClassName, 
  getPriorityClassName,
  configToFuzzyOptions,
  HighlightResult,
  HighlightLevel 
} from './highlightConfig';

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

  // 향상된 하이라이팅 제거 함수 (모든 하이라이트 레벨 제거)
  const removeExistingHighlights = useCallback(() => {
    const pdfContainer = document.querySelector('.react-pdf__Page__textContent');
    if (!pdfContainer) return;

    // 기존 레거시 하이라이트 제거
    const legacyHighlights = pdfContainer.querySelectorAll(`.${styles.pdfHighlight}`);
    legacyHighlights.forEach(element => {
      element.classList.remove(styles.pdfHighlight);
    });

    // 새로운 다층 하이라이트 제거
    const highlightClasses = [
      'pdfHighlightExact',
      'pdfHighlightSimilar', 
      'pdfHighlightRelated',
      'pdfHighlightContext',
      'pdfHighlightEntity',
      'pdfHighlightPhrase',
      'highlightPriorityHigh',
      'highlightPriorityMedium',
      'highlightPriorityLow'
    ];
    
    highlightClasses.forEach(className => {
      const elements = pdfContainer.querySelectorAll(`.${highlightStyles[className]}`);
      elements.forEach(element => {
        element.classList.remove(highlightStyles[className]);
        element.removeAttribute('data-confidence');
        element.removeAttribute('data-matched-by');
      });
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

  // 향상된 PDF 텍스트 하이라이팅 적용 함수
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

    // 텍스트 매칭 기반 하이라이팅 적용
    if (highlightRange.searchText && highlightRange.searchText.trim()) {
      const searchText = highlightRange.searchText.trim();
      
      // 향상된 텍스트 처리
      const processedText = processTextForHighlighting(searchText);
      const fuzzyOptions = configToFuzzyOptions(defaultHighlightConfig);
      
      // 하이라이트 결과 수집
      const highlightResults: HighlightResult[] = [];
      
      validSpans.forEach(span => {
        const spanText = span.textContent?.trim() || '';
        if (!spanText) return;
        
        let bestMatch: HighlightResult | null = null;
        
        // 1. 정확한 매칭 확인
        if (spanText.toLowerCase().includes(searchText.toLowerCase())) {
          bestMatch = {
            text: spanText,
            level: 'exact',
            confidence: 1.0,
            element: span,
            matchedBy: 'exact'
          };
        }
        
        // 2. 개체명 매칭 확인
        if (!bestMatch) {
          for (const entity of processedText.entities) {
            if (spanText.toLowerCase().includes(entity.text.toLowerCase()) ||
                entity.text.toLowerCase().includes(spanText.toLowerCase())) {
              bestMatch = {
                text: spanText,
                level: 'entity',
                confidence: entity.confidence,
                element: span,
                matchedBy: `entity-${entity.type}`
              };
              break;
            }
          }
        }
        
        // 3. 구문 매칭 확인
        if (!bestMatch) {
          for (const phrase of processedText.phrases) {
            const fuzzyResult = fuzzyTextMatch(phrase, spanText, fuzzyOptions);
            if (fuzzyResult.isMatch && fuzzyResult.confidence >= 0.7) {
              bestMatch = {
                text: spanText,
                level: 'phrase',
                confidence: fuzzyResult.confidence,
                element: span,
                matchedBy: `phrase-${fuzzyResult.algorithm}`
              };
              break;
            }
          }
        }
        
        // 4. 키워드 fuzzy 매칭
        if (!bestMatch) {
          for (const keyTerm of processedText.keyTerms) {
            const fuzzyResult = fuzzyTextMatch(keyTerm, spanText, fuzzyOptions);
            if (fuzzyResult.isMatch) {
              const level = determineHighlightLevel(fuzzyResult.confidence);
              bestMatch = {
                text: spanText,
                level,
                confidence: fuzzyResult.confidence,
                element: span,
                matchedBy: `fuzzy-${fuzzyResult.algorithm}`
              };
              break;
            }
          }
        }
        
        // 5. 레거시 매칭 (기존 방식)
        if (!bestMatch) {
          const searchWords = filterHighlightWords(searchText);
          const hasLegacyMatch = searchWords.some(word => isTextMatch(word, spanText.toLowerCase()));
          
          if (hasLegacyMatch) {
            bestMatch = {
              text: spanText,
              level: 'related',
              confidence: 0.6,
              element: span,
              matchedBy: 'legacy'
            };
          }
        }
        
        if (bestMatch) {
          highlightResults.push(bestMatch);
        }
      });
      
      // 우선순위 기반 정렬 및 최대 개수 제한
      highlightResults
        .sort((a, b) => {
          const priorityA = defaultHighlightConfig.priority[a.level];
          const priorityB = defaultHighlightConfig.priority[b.level];
          if (priorityA !== priorityB) return priorityB - priorityA;
          return b.confidence - a.confidence;
        })
        .slice(0, defaultHighlightConfig.visual.maxHighlights)
        .forEach(result => {
          if (result.element) {
            const highlightClass = getHighlightClassName(result.level);
            const priorityClass = getPriorityClassName(defaultHighlightConfig.priority[result.level]);
            
            // CSS 클래스 적용
            result.element.classList.add(highlightStyles[highlightClass]);
            result.element.classList.add(highlightStyles[priorityClass]);
            
            // 신뢰도 표시 (선택적)
            if (defaultHighlightConfig.visual.showConfidence) {
              result.element.setAttribute('data-confidence', result.confidence.toFixed(2));
              result.element.setAttribute('data-matched-by', result.matchedBy);
            }
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