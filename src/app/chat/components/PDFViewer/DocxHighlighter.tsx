'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import './DocxHighlighter.css';
import { filterHighlightWords, isTextMatch } from './highlightConstants';
import { 
  createTextChunks, 
  preciseDOCXHighlight, 
  defaultUnifiedConfig
} from './unifiedHighlighter';

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

  // 통합 DOCX 하이라이팅 적용 함수 (정밀 부분 하이라이팅)
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

    // 텍스트 매칭 기반 하이라이팅 적용
    if (highlightRange.searchText && highlightRange.searchText.trim()) {
      const searchText = highlightRange.searchText.trim();
      
      // 전체 문서 텍스트 구성 (공간 정보 보존)
      const fullDocumentText = textElements.map(el => el.textContent || '').join('\n');
      
      // 통합 시스템으로 텍스트 청크 생성
      const textChunks = createTextChunks(fullDocumentText, searchText, {
        ...defaultUnifiedConfig,
        precisionLevel: 'phrase', // DOCX는 구문 단위 정밀도로 설정
        maxHighlightRatio: 0.25,   // 더 엄격한 하이라이팅 비율
        minChunkLength: 4          // 최소 청크 길이 증가
      });
      
      if (textChunks.length === 0) {
        // 레거시 방식으로 폴백하되 더 엄격한 조건 적용
        const searchWords = filterHighlightWords(searchText);
        
        // 유효한 검색 단어가 충분한지 확인 (최소 2개 이상의 의미있는 단어)
        const meaningfulWords = searchWords.filter(word => word.length >= 4);
        if (meaningfulWords.length === 0) {
          return;
        }
        
        textElements.forEach(element => {
          const elementText = element.textContent?.trim().toLowerCase() || '';
          
          // 더 엄격한 매칭: 의미있는 단어들의 일정 비율 이상이 포함되어야 함
          const matchingWords = meaningfulWords.filter(word => isTextMatch(word, elementText));
          const matchRatio = matchingWords.length / meaningfulWords.length;
          
          if (matchRatio >= 0.5 && matchingWords.length >= 1) { // 50% 이상 매칭 + 최소 1개
            element.classList.add('docx-highlight');
            element.setAttribute('data-match-ratio', matchRatio.toFixed(2));
            element.setAttribute('data-matched-words', matchingWords.join(', '));
          }
        });
        return;
      }

      // 정밀 하이라이팅 적용
      textElements.forEach(element => {
        const elementText = element.textContent?.trim() || '';
        if (!elementText) return;

        // 해당 요소와 관련된 텍스트 청크들 찾기
        const relevantChunks = textChunks.filter(chunk => {
          const chunkLower = chunk.text.toLowerCase();
          const elementLower = elementText.toLowerCase();
          
          // 청크와 요소 텍스트 간 관련성 확인
          return elementLower.includes(chunkLower) || 
                 chunkLower.includes(elementLower) ||
                 calculateTextSimilarity(chunkLower, elementLower) > 0.3;
        });

        if (relevantChunks.length > 0) {
          // 요소가 너무 짧으면 전체 하이라이팅 (하지만 최소 길이 체크)
          if (elementText.length <= 30 && relevantChunks[0].score > 0.8) {
            element.classList.add('docx-highlight');
            element.setAttribute('data-highlight-type', 'full');
            element.setAttribute('data-score', relevantChunks[0].score.toFixed(2));
          } else {
            // 정밀 부분 하이라이팅 적용
            try {
              const originalHTML = element.innerHTML;
              preciseDOCXHighlight(element, relevantChunks, {
                ...defaultUnifiedConfig,
                maxHighlightRatio: 0.4 // 요소별로는 더 관대하게
              });
              
              // 하이라이팅이 실제로 적용되었는지 확인
              const hasHighlight = element.querySelector('.docx-highlight');
              if (hasHighlight) {
                element.setAttribute('data-highlight-type', 'precise');
                element.setAttribute('data-chunk-count', relevantChunks.length.toString());
              } else {
                // 정밀 하이라이팅 실패시 원본 복구 후 전체 하이라이팅
                element.innerHTML = originalHTML;
                if (relevantChunks[0].score > 0.6) {
                  element.classList.add('docx-highlight');
                  element.setAttribute('data-highlight-type', 'fallback');
                }
              }
            } catch (error) {
              console.warn('정밀 하이라이팅 적용 중 오류:', error);
              // 오류 발생시 점수가 높은 경우에만 전체 하이라이팅
              if (relevantChunks[0].score > 0.7) {
                element.classList.add('docx-highlight');
                element.setAttribute('data-highlight-type', 'error-fallback');
              }
            }
          }
        }
      });
    }
  }, [highlightRange, removeExistingHighlights]);

  // 텍스트 유사도 계산 헬퍼 함수
  const calculateTextSimilarity = (text1: string, text2: string): number => {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  };

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