'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import styles from './PDFHighlighter.module.scss';
import highlightStyles from './HighlightStyles.module.scss';
import { filterHighlightWords, isTextMatch } from './highlightConstants';
import { 
  createTextChunks, 
  groupPDFElements, 
  defaultUnifiedConfig,
  TextChunk,
  HighlightGroup 
} from './unifiedHighlighter';

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

  // 통합 PDF 텍스트 하이라이팅 적용 함수 (연속성 보장)
  const applyPDFHighlighting = useCallback(() => {
    const textLayer = findPDFTextLayer();
    if (!textLayer) return;

    // 기존 하이라이팅 제거
    removeExistingHighlights();

    // 텍스트 span 요소들 찾기
    const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
    if (textSpans.length === 0) return;

    // 유효한 텍스트를 가진 스팬들만 필터링
    const validSpans = textSpans.filter(span => {
      const text = span.textContent?.trim() || '';
      return text.length > 0;
    });

    if (validSpans.length === 0) return;

    // 텍스트 매칭 기반 하이라이팅 적용
    if (highlightRange.searchText && highlightRange.searchText.trim()) {
      const searchText = highlightRange.searchText.trim();
      
      // 전체 페이지 텍스트 구성
      const fullPageText = validSpans.map(span => span.textContent || '').join(' ');
      
      // 통합 시스템으로 텍스트 청크 생성
      const textChunks = createTextChunks(fullPageText, searchText, defaultUnifiedConfig);
      
      if (textChunks.length === 0) {
        // 레거시 방식으로 폴백
        const searchWords = filterHighlightWords(searchText);
        validSpans.forEach(span => {
          const spanText = span.textContent?.trim().toLowerCase() || '';
          const hasMatch = searchWords.some(word => isTextMatch(word, spanText));
          if (hasMatch) {
            span.classList.add(styles.pdfHighlight);
          }
        });
        return;
      }

      // 매칭되는 span 요소들 찾기
      const matchingSpans: Array<{span: HTMLElement, chunk: TextChunk, score: number}> = [];
      
      validSpans.forEach(span => {
        const spanText = span.textContent?.trim() || '';
        if (!spanText) return;

        // 각 청크와의 매칭 확인
        textChunks.forEach(chunk => {
          const chunkWords = chunk.text.toLowerCase().split(/\s+/);
          const spanWords = spanText.toLowerCase().split(/\s+/);
          
          // 단어 수준 매칭 점수 계산
          let matchScore = 0;
          spanWords.forEach(spanWord => {
            if (chunkWords.some(chunkWord => 
              chunkWord.includes(spanWord) || spanWord.includes(chunkWord)
            )) {
              matchScore += 1;
            }
          });
          
          const normalizedScore = matchScore / Math.max(spanWords.length, 1);
          
          if (normalizedScore > 0.3) { // 30% 이상 매칭시 하이라이트 후보
            matchingSpans.push({
              span,
              chunk,
              score: normalizedScore * chunk.score
            });
          }
        });
      });

      // 연속된 span들을 그룹화
      const spanGroups = groupPDFElements(
        matchingSpans.map(m => m.span),
        defaultUnifiedConfig
      );

      // 그룹별 하이라이팅 적용 (연속성 보장)
      spanGroups.forEach((group, groupIndex) => {
        // 그룹의 평균 점수 계산
        const groupScore = matchingSpans
          .filter(m => group.elements.includes(m.span))
          .reduce((sum, m) => sum + m.score, 0) / group.elements.length;

        // 하이라이트 클래스 결정
        let highlightClass = styles.pdfHighlight;
        if (groupScore > 0.8) {
          highlightClass = `${highlightStyles.pdfHighlightExact}`;
        } else if (groupScore > 0.6) {
          highlightClass = `${highlightStyles.pdfHighlightSimilar}`;
        } else {
          highlightClass = `${highlightStyles.pdfHighlightRelated}`;
        }

        // 그룹 내 모든 span에 하이라이팅 적용
        group.elements.forEach((span, spanIndex) => {
          span.classList.add(highlightClass);
          span.setAttribute('data-group', groupIndex.toString());
          span.setAttribute('data-continuity', group.continuity.toFixed(2));
          span.setAttribute('data-score', groupScore.toFixed(2));
        });

        // 연속성이 높은 그룹에 시각적 연결 효과 추가
        if (group.continuity > 0.7 && group.elements.length > 1) {
          group.elements.forEach((span, spanIndex) => {
            span.classList.add(`${highlightStyles.highlightPriorityHigh}`);
            
            // 첫 번째와 마지막 요소에 특별한 스타일 적용
            if (spanIndex === 0) {
              span.style.borderRadius = '3px 0 0 3px';
            } else if (spanIndex === group.elements.length - 1) {
              span.style.borderRadius = '0 3px 3px 0';
            } else {
              span.style.borderRadius = '0';
            }
          });
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