'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import { 
  smartTokenize, 
  findCombinationMatches, 
  testSmartTokenizer,
  CombinationMatch
} from './smartTokenizer';
import { 
  defaultHighlightConfig, 
  HighlightConfig 
} from './highlightConfig';

interface PDFHighlighterProps {
  pageNumber: number;
  highlightRange: HighlightRange & { searchText?: string };
  scale: number;
  pageWidth: number;
  pageHeight: number;
  textContent?: any; // PDF.js TextContent
  highlightConfig?: HighlightConfig; // 하이라이팅 설정
}

const PDFHighlighter: React.FC<PDFHighlighterProps> = ({
  pageNumber,
  highlightRange,
  scale,
  pageWidth,
  pageHeight,
  textContent,
  highlightConfig = defaultHighlightConfig
}) => {
  
  // 현재 페이지가 하이라이트 대상인지 확인
  const shouldHighlight = pageNumber === highlightRange.pageNumber;

  // 스마트 하이라이팅 제거 함수
  const removeExistingHighlights = useCallback(() => {
    const pdfContainer = document.querySelector('.react-pdf__Page__textContent');
    if (!pdfContainer) return;

    // 기존 하이라이팅된 span들 찾기
    const highlightedSpans = pdfContainer.querySelectorAll('[data-smart-score]');
    
    highlightedSpans.forEach(span => {
      // 인라인 스타일 제거
      const element = span as HTMLElement;
      element.style.backgroundColor = '';
      element.style.background = '';
      element.style.boxShadow = '';
      element.style.borderLeft = '';
      element.style.borderRadius = '';
      element.style.padding = '';
      element.style.margin = '';
      element.style.transition = '';
      element.style.display = '';
      element.style.lineHeight = '';
      
      // 데이터 속성 제거
      element.removeAttribute('data-smart-score');
      element.removeAttribute('data-matched-tokens');
      element.removeAttribute('data-matched-text');
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

  // 🎯 PDF 스마트 하이라이팅 적용 함수
  const applySmartHighlighting = useCallback((
    textSpans: HTMLElement[], 
    combinationMatches: CombinationMatch[]
  ) => {
    textSpans.forEach(span => {
      const spanText = span.textContent?.trim() || '';
      if (!spanText) return;

      // 해당 span과 겹치는 매칭들 찾기
      const spanMatches = combinationMatches.filter(match => {
        const spanLower = spanText.toLowerCase();
        const matchedLower = match.matchedText.toLowerCase();
        return spanLower.includes(matchedLower) || matchedLower.includes(spanLower);
      });

      if (spanMatches.length > 0) {
        // 가장 높은 점수 선택
        const bestMatch = spanMatches.reduce((best, current) => 
          current.score > best.score ? current : best
        );

        // 점수별 인라인 스타일 직접 적용
        const styles = getScoreStyles(bestMatch.score);
        Object.assign(span.style, styles);
        span.setAttribute('data-smart-score', bestMatch.score.toString());
        span.setAttribute('data-matched-tokens', bestMatch.tokens.map(t => t.text).join(' + '));
        span.setAttribute('data-matched-text', bestMatch.matchedText);
      }
    });
  }, []);

  // 개별 토큰 하이라이팅 적용 함수
  const applyTokenHighlighting = useCallback((
    textSpans: HTMLElement[], 
    smartTokens: ReturnType<typeof smartTokenize>
  ) => {
    textSpans.forEach(span => {
      const spanText = span.textContent?.trim() || '';
      if (!spanText) return;

      const spanLower = spanText.toLowerCase();
      const matchedTokens: string[] = [];

      // 개별 토큰 매칭 확인
      smartTokens.forEach(token => {
        if (spanLower.includes(token.text.toLowerCase())) {
          matchedTokens.push(token.text);
        }
      });

      if (matchedTokens.length > 0) {
        // 개별 토큰은 1점으로 처리 - 인라인 스타일 적용
        const styles = getScoreStyles(1);
        Object.assign(span.style, styles);
        span.setAttribute('data-smart-score', '1');
        span.setAttribute('data-matched-tokens', matchedTokens.join(' + '));
      }
    });
  }, []);

  // 점수별 인라인 스타일 반환
  const getScoreStyles = (score: number): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      borderRadius: '1px',
      padding: '0px 1px',
      margin: '0',
      transition: 'all 0.2s ease',
      display: 'inline',
      lineHeight: 'normal'
    };

    if (score >= 6) {
      return {
        ...baseStyles,
        background: 'linear-gradient(45deg, rgba(255, 0, 255, 0.2), rgba(255, 215, 0, 0.2))',
        boxShadow: '0 0 2px rgba(255, 0, 255, 0.6)',
      };
    } else if (score >= 5) {
      return {
        ...baseStyles,
        backgroundColor: 'rgba(255, 20, 147, 0.2)',
        boxShadow: '0 0 0 2px rgba(255, 20, 147, 0.5)',
      };
    } else if (score >= 4) {
      return {
        ...baseStyles,
        backgroundColor: 'rgba(0, 191, 255, 0.2)',
        boxShadow: '0 0 0 2px rgba(0, 191, 255, 0.5)',
      };
    } else if (score >= 3) {
      return {
        ...baseStyles,
        backgroundColor: 'rgba(0, 255, 127, 0.2)',
        boxShadow: '0 0 0 1px rgba(0, 255, 127, 0.5)',
      };
    } else if (score >= 2) {
      return {
        ...baseStyles,
        backgroundColor: 'rgba(255, 165, 0, 0.2)',
        boxShadow: '0 0 0 1px rgba(255, 165, 0, 0.5)',
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: 'rgba(255, 255, 0, 0.2)',
        boxShadow: '0 0 0 1px rgba(255, 255, 0, 0.4)',
      };
    }
  };

  // 통합 PDF 텍스트 하이라이팅 적용 함수 (스마트 토큰화)
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

    // 스마트 토큰화 기반 하이라이팅 적용
    if (highlightRange.searchText && highlightRange.searchText.trim()) {
      const searchText = highlightRange.searchText.trim();
      
      // 전체 페이지 텍스트 구성 (공간 정보 보존)
      const fullPageText = validSpans.map(span => span.textContent || '').join(' ');
      
      // 🎯 새로운 스마트 토큰화 시스템 사용 (설정 기반)
      const smartTokens = smartTokenize(searchText);
      const combinationMatches = findCombinationMatches(fullPageText, smartTokens, {
        singleTokenScore: highlightConfig.scoring.singleTokenScore,
        combinationBonus: highlightConfig.scoring.combinationBonus,
        continuityBonus: highlightConfig.scoring.continuityBonus,
        proximityBonus: highlightConfig.scoring.proximityBonus,
        minScore: highlightConfig.thresholds.minScore,
        maxScore: highlightConfig.thresholds.maxScore
      });
      
      // 디버깅용 테스트 (설정에 따라)
      if (window.location.search.includes('debug=smart') || highlightConfig.visual.showScoreInfo) {
        console.log('=== PDF 스마트 토큰화 디버깅 ===');
        console.log('검색 텍스트:', searchText);
        console.log('스마트 토큰들:', smartTokens);
        console.log('조합 매칭 결과:', combinationMatches);
        console.log('하이라이팅 설정:', highlightConfig);
        testSmartTokenizer();
      }
      
      // 🎯 스마트 토큰 조합 매칭 기반 하이라이팅
      if (combinationMatches.length > 0) {
        applySmartHighlighting(validSpans, combinationMatches);
        return;
      }
      
      // 폴백: 개별 스마트 토큰 매칭
      if (smartTokens.length > 0) {
        applyTokenHighlighting(validSpans, smartTokens);
        return;
      }
    }
  }, [highlightRange, findPDFTextLayer, removeExistingHighlights, applySmartHighlighting, applyTokenHighlighting, highlightConfig]);

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