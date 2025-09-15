'use client';

import React, { useEffect, useCallback } from 'react';
import { HighlightRange } from '../../types/source';
import './DocxHighlighter.css';
import { 
  smartTokenize, 
  findCombinationMatches, 
  testSmartTokenizer,
  CombinationMatch
} from './smartTokenizer';
import { 
  defaultHighlightConfig, 
  HighlightConfig, 
  highlightPresets
} from './highlightConfig';

interface DocxHighlighterProps {
  highlightRange: HighlightRange & { searchText?: string };
  scale: number;
  highlightConfig?: HighlightConfig; // 하이라이팅 설정
}

const DocxHighlighter: React.FC<DocxHighlighterProps> = ({
  highlightRange,
  scale,
  highlightConfig = highlightPresets.strict || defaultHighlightConfig
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

  // 🎯 스마트 하이라이팅 적용 함수
  const applySmartHighlighting = useCallback((
    textElements: HTMLElement[], 
    combinationMatches: CombinationMatch[]
  ) => {
    // 각 텍스트 요소에 대해 매칭 확인
    textElements.forEach(element => {
      const elementText = element.textContent?.trim() || '';
      if (!elementText) return;

      // 해당 요소와 겹치는 매칭들 찾기
      const elementMatches = combinationMatches.filter(match => {
        const elementLower = elementText.toLowerCase();
        const matchedLower = match.matchedText.toLowerCase();
        return elementLower.includes(matchedLower) || matchedLower.includes(elementLower);
      });

      if (elementMatches.length > 0) {
        // 가장 높은 점수 선택
        const bestMatch = elementMatches.reduce((best, current) => 
          current.score > best.score ? current : best
        );

        // 점수별 CSS 클래스 적용
        const scoreClass = getScoreClass(bestMatch.score);
        element.classList.add(scoreClass);
        element.setAttribute('data-smart-score', bestMatch.score.toString());
        element.setAttribute('data-matched-tokens', bestMatch.tokens.map(t => t.text).join(' + '));
        element.setAttribute('data-matched-text', bestMatch.matchedText);
      }
    });
  }, []);

  // 개별 토큰 하이라이팅 적용 함수  
  const applyTokenHighlighting = useCallback((
    textElements: HTMLElement[], 
    smartTokens: ReturnType<typeof smartTokenize>
  ) => {
    textElements.forEach(element => {
      const elementText = element.textContent?.trim() || '';
      if (!elementText) return;

      const elementLower = elementText.toLowerCase();
      const matchedTokens: string[] = [];

      // 개별 토큰 매칭 확인
      smartTokens.forEach(token => {
        if (elementLower.includes(token.text.toLowerCase())) {
          matchedTokens.push(token.text);
        }
      });

      if (matchedTokens.length > 0) {
        // 개별 토큰은 1점으로 처리
        element.classList.add('docx-highlight-score-1');
        element.setAttribute('data-smart-score', '1');
        element.setAttribute('data-matched-tokens', matchedTokens.join(' + '));
      }
    });
  }, []);

  // 중복 요소 제거 함수 (부모-자식 관계에서 자식 요소 우선)
  const removeDuplicateElements = useCallback((elements: HTMLElement[]): HTMLElement[] => {
    return elements.filter((element, index) => {
      // 다른 요소들 중에서 현재 요소를 포함하는 부모 요소가 있는지 확인
      for (let i = 0; i < elements.length; i++) {
        if (i !== index) {
          const otherElement = elements[i];
          // otherElement가 element의 부모인 경우, element를 우선 선택
          if (otherElement.contains(element) && otherElement !== element) {
            return true; // 자식 요소이므로 포함
          }
          // element가 otherElement의 부모인 경우, otherElement를 우선 선택
          if (element.contains(otherElement) && element !== otherElement) {
            return false; // 부모 요소이므로 제외
          }
        }
      }
      return true; // 중복되지 않는 요소
    });
  }, []);

  // 통합 DOCX 하이라이팅 적용 함수 (정밀 부분 하이라이팅)
  const applyDocxHighlighting = useCallback(() => {
    const docxContainer = document.querySelector('[class*="docxContent"], [class*="docxContainer"], .docx-content, .docx-container');
    if (!docxContainer) return;

    // 기존 하이라이팅 제거
    removeExistingHighlights();

    // 텍스트가 있는 모든 요소 찾기 (중첩 요소 포함)
    const textElements: HTMLElement[] = [];
    
    // 1단계: 모든 텍스트를 포함한 요소들 찾기 (p, span, div, h1-h6, strong, em, b, i 등)
    const potentialTextElements = docxContainer.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, li, td, th, strong, em, b, i, u, mark');
    
    potentialTextElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (htmlElement.textContent && htmlElement.textContent.trim().length > 0) {
        // 직접 텍스트가 있는 요소 또는 리프 노드(자식이 없는 요소)
        const hasDirectText = Array.from(htmlElement.childNodes).some(
          child => child.nodeType === Node.TEXT_NODE && child.textContent?.trim()
        );
        
        const isLeafNode = htmlElement.children.length === 0;
        
        // 직접 텍스트가 있거나 리프 노드인 경우 포함
        if (hasDirectText || isLeafNode) {
          textElements.push(htmlElement);
        }
      }
    });
    
    // 2단계: 중복 제거 (부모-자식 관계에서 자식 요소 우선)
    const finalTextElements = removeDuplicateElements(textElements);

    // 스마트 토큰화 기반 하이라이팅 적용
    if (highlightRange.searchText && highlightRange.searchText.trim()) {
      const searchText = highlightRange.searchText.trim();
      
      // 전체 문서 텍스트 구성 (공간 정보 보존)
      const fullDocumentText = finalTextElements.map(el => el.textContent || '').join('\n');
      
      // 🎯 새로운 스마트 토큰화 시스템 사용 (설정 기반)
      const smartTokens = smartTokenize(searchText);
      const combinationMatches = findCombinationMatches(fullDocumentText, smartTokens, {
        singleTokenScore: highlightConfig.scoring.singleTokenScore,
        combinationBonus: highlightConfig.scoring.combinationBonus,
        continuityBonus: highlightConfig.scoring.continuityBonus,
        proximityBonus: highlightConfig.scoring.proximityBonus,
        minScore: highlightConfig.thresholds.minScore,
        maxScore: highlightConfig.thresholds.maxScore
      });
      
      // 디버깅용 테스트 (설정에 따라)
      if (window.location.search.includes('debug=smart') || highlightConfig.visual.showScoreInfo) {
        console.log('=== DOCX 스마트 토큰화 디버깅 ===');
        console.log('검색 텍스트:', searchText);
        console.log('스마트 토큰들:', smartTokens);
        console.log('조합 매칭 결과:', combinationMatches);
        console.log('하이라이팅 설정:', highlightConfig);
        console.log('최종 텍스트 요소들:', finalTextElements);
        
        // 테스트 함수는 별도 호출시에만 실행
        if (window.location.search.includes('debug=test')) {
          testSmartTokenizer();
        }
      }
      
      // 🎯 스마트 토큰 조합 매칭 기반 하이라이팅
      if (combinationMatches.length > 0) {
        applySmartHighlighting(finalTextElements, combinationMatches);
        return;
      }
      
      // 폴백: 개별 스마트 토큰 매칭
      if (smartTokens.length > 0) {
        applyTokenHighlighting(finalTextElements, smartTokens);
        return;
      }
    }
  }, [highlightRange, removeExistingHighlights, applySmartHighlighting, applyTokenHighlighting, highlightConfig, removeDuplicateElements]);

  // 점수별 CSS 클래스 반환
  const getScoreClass = (score: number): string => {
    if (score >= 6) return 'docx-highlight-score-6-plus';
    if (score >= 5) return 'docx-highlight-score-5';
    if (score >= 4) return 'docx-highlight-score-4';
    if (score >= 3) return 'docx-highlight-score-3';
    if (score >= 2) return 'docx-highlight-score-2';
    return 'docx-highlight-score-1';
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