/**
 * 통합 하이라이팅 시스템
 * PDF와 DOCX의 하이라이팅 차이를 해결하는 범용 솔루션
 * 
 * 주요 특징:
 * - 문서 유형에 관계없이 동작하는 범용 시스템
 * - 사용자 정의 중요 키워드 관리 가능
 * - 유연한 매칭 로직 (정확 매칭, 구문 매칭)
 * - 과도한 하이라이팅 방지
 * 
 * 사용법:
 * ```typescript
 * // 기본 사용
 * const chunks = createTextChunks(documentText, searchText);
 * 
 * // 사용자 정의 키워드와 함께 사용
 * const customConfig = addCustomKeywords(['특별키워드', '중요용어']);
 * const chunks = createTextChunks(documentText, searchText, defaultConfig, customConfig);
 * ```
 */

import { filterHighlightWords, isImportantKeyword, ImportantKeywordConfig } from './highlightConstants';

export interface TextChunk {
  text: string;
  start: number;
  end: number;
  score: number;
  type: 'exact' | 'phrase' | 'context' | 'partial' | 'ngram';
}

export interface HighlightGroup {
  chunks: TextChunk[];
  elements: HTMLElement[];
  boundingRect: DOMRect;
  continuity: number; // 0-1, 연속성 점수
}

export interface UnifiedHighlightConfig {
  minChunkLength: number;      // 최소 하이라이트 단위 (기본: 3글자)
  maxDistance: number;         // 연속 하이라이트 최대 거리 (픽셀)
  contextWords: number;        // 앞뒤 문맥 단어 수
  precisionLevel: 'word' | 'phrase' | 'sentence';
  maxHighlightRatio: number;   // 전체 대비 최대 하이라이트 비율
  groupingThreshold: number;   // 그룹화 임계값
  ngramSize: number;           // N-gram 크기 (기본: 2-3)
  ngramThreshold: number;      // N-gram 매칭 임계값 (0-1)
}

export const defaultUnifiedConfig: UnifiedHighlightConfig = {
  minChunkLength: 2,        // 최소 길이를 2로 완화 (AAA, AA+ 등을 위해)
  maxDistance: 30,          // 연속 거리 단축
  contextWords: 1,          // 컨텍스트 단어 수 감소
  precisionLevel: 'phrase',   // 단어 단위로 정밀도 향상
  maxHighlightRatio: 0.25,  // 최대 하이라이트 비율을 25%로 상향 조정
  groupingThreshold: 0.8,   // 그룹화 임계값 상향
  ngramSize: 1,
  ngramThreshold: 0.7       // N-gram 임계값 상향 조정
};

/**
 * 텍스트를 의미있는 청크로 분할
 */
export const createTextChunks = (
  fullText: string,
  searchText: string,
  config: UnifiedHighlightConfig = defaultUnifiedConfig,
  keywordConfig?: ImportantKeywordConfig
): TextChunk[] => {
  if (!searchText.trim()) return [];

  const searchTerms = filterHighlightWords(searchText, keywordConfig);
  
  // 검색어 품질 검증 - 더 관대한 필터링으로 수정
  const qualityTerms = searchTerms.filter(term => {
    // 빈 문자열이나 순수 기호만 제외
    if (!term || term.trim().length === 0) return false;
    if (/^[\-|~\s.,]+$/.test(term)) return false; // 순수 기호만
    
    // 범위 표현 단어들은 매우 중요하므로 무조건 포함
    const rangeWords = ['이하', '초과', '미만', '이상'];
    if (rangeWords.includes(term.toLowerCase())) return true;
    
    // 숫자 패턴 포함 ("0.2", "1", "2" 등)
    if (/^\d+(\.\d+)?$/.test(term)) return true;
    
    // 중요한 키워드들은 길이에 관계없이 포함
    if (isImportantKeyword(term, keywordConfig)) return true;
    
    // 영문 약어는 길이 관계없이 포함 (CSS 등)
    if (/^[A-Z]{2,}$/.test(term)) return true;
    
    // 한글 단어는 1글자부터 포함 (가계의 "가" 등)
    if (/^[가-힣]+$/.test(term)) return true;
    
    // 너무 일반적인 단어만 제외 (범위 표현은 이미 위에서 포함됨)
    const commonWords = ['관련', '해당', '포함', '제외', '기타'];
    if (commonWords.includes(term.toLowerCase())) return false;
    
    // 기본적으로 1글자 이상이면 포함
    return term.length >= 1;
  });

  if (qualityTerms.length === 0) return [];

  const chunks: TextChunk[] = [];
  const fullTextLower = fullText.toLowerCase();

  // 0. 연속된 키워드 조합 찾기 (예: "0.2 이하", "가계 CSS 대출" 등)
  for (let i = 0; i < qualityTerms.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 4, qualityTerms.length); j++) { // 최대 4개까지 조합
      const combinedTerm = qualityTerms.slice(i, j + 1).join(' ');
      const combinedTermLower = combinedTerm.toLowerCase();
      
      if (fullTextLower.includes(combinedTermLower)) {
        const index = fullTextLower.indexOf(combinedTermLower);
        chunks.push({
          text: fullText.substring(index, index + combinedTerm.length),
          start: index,
          end: index + combinedTerm.length,
          score: 1.2, // 조합 매칭은 더 높은 점수
          type: 'exact'
        });
      }
    }
  }

  // 1. 정확한 매칭 찾기 (가장 높은 우선순위)
  qualityTerms.forEach(term => {
    const termLower = term.toLowerCase();
    let startIndex = 0;
    while (true) {
      const index = fullTextLower.indexOf(termLower, startIndex);
      if (index === -1) break;

      // 더 유연한 단어 경계 확인
      const beforeChar = index > 0 ? fullTextLower[index - 1] : ' ';
      const afterChar = index + termLower.length < fullTextLower.length ? 
        fullTextLower[index + termLower.length] : ' ';
      
      // 중요한 키워드들은 단어 경계 검사를 완화
      const isImportantTerm = isImportantKeyword(termLower, keywordConfig);
      
      let isValidBoundary = false;
      
      if (isImportantTerm) {
        // 중요 키워드는 더 관대한 경계 검사
        isValidBoundary = (
          /[\s.,\-|()[\]{}~]/.test(beforeChar) ||
          /[\s.,\-|()[\]{}~]/.test(afterChar) ||
          index === 0 ||
          index + termLower.length === fullTextLower.length
        );
      } else {
        // 일반 키워드는 기존 로직 유지
        const isKoreanWordBoundary = (
          !/[\uAC00-\uD7AF\u3130-\u318F]/.test(beforeChar) &&
          !/[\uAC00-\uD7AF\u3130-\u318F]/.test(afterChar)
        ) || (
          /[\s.,\-|()[\]{}]/.test(beforeChar) &&
          /[\s.,\-|()[\]{}]/.test(afterChar)
        );

        const isEnglishWordBoundary = (
          !/[a-zA-Z]/.test(beforeChar) &&
          !/[a-zA-Z]/.test(afterChar)
        );
        
        isValidBoundary = isKoreanWordBoundary || isEnglishWordBoundary;
      }

      if (isValidBoundary) {
        chunks.push({
          text: fullText.substring(index, index + termLower.length),
          start: index,
          end: index + termLower.length,
          score: 1.0,
          type: 'exact'
        });
      }

      startIndex = index + 1;
    }
  });

  // 2. 구문 매칭 - 더 엄격한 조건으로만 수행
  if (qualityTerms.length >= 2) {
    const phrases = extractPhrases(qualityTerms.join(' '), 1, keywordConfig); // contextWords를 1로 고정
    phrases.forEach(phrase => {
      if (phrase.length < 6) return; // 너무 짧은 구문 제외
      
      let startIndex = 0;
      const phraseLower = phrase.toLowerCase();
      while (true) {
        const index = fullTextLower.indexOf(phraseLower, startIndex);
        if (index === -1) break;

        // 구문이 정확히 매칭되는지 확인
        const beforeChar = index > 0 ? fullTextLower[index - 1] : ' ';
        const afterChar = index + phraseLower.length < fullTextLower.length ? 
          fullTextLower[index + phraseLower.length] : ' ';
        
        if (/[\s.,\-|()[\]{}]/.test(beforeChar) && /[\s.,\-|()[\]{}]/.test(afterChar)) {
          chunks.push({
            text: fullText.substring(index, index + phrase.length),
            start: index,
            end: index + phrase.length,
            score: 0.9,
            type: 'phrase'
          });
        }

        startIndex = index + phrase.length;
      }
    });
  }

  // N-gram 매칭은 비활성화 (너무 많은 false positive 생성)

  // 4. 중복 제거 및 병합
  const mergedChunks = mergeOverlappingChunks(chunks);

  // 5. 컨텍스트 확장 생략 (정확성 우선)

  // 6. 점수순 정렬 및 개수 제한 - 더 엄격한 제한
  const maxChunks = Math.max(3, Math.floor(qualityTerms.length * 1.5));
  return mergedChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);
};

// N-gram 관련 함수들은 현재 비활성화됨 (과도한 매칭 방지)

/**
 * 검색어에서 의미있는 구문 추출
 */
const extractPhrases = (
  searchText: string, 
  contextWords: number,
  keywordConfig?: ImportantKeywordConfig
): string[] => {
  const words = filterHighlightWords(searchText, keywordConfig);
  const phrases: string[] = [];

  // 2-3 단어 조합으로 구문 생성
  for (let i = 0; i < words.length; i++) {
    for (let j = 2; j <= Math.min(contextWords + 1, words.length - i); j++) {
      const phrase = words.slice(i, i + j).join(' ');
      
      // 구문이 중요한 키워드를 포함하거나 충분한 길이인 경우만 포함
      const containsImportantKeyword = words.slice(i, i + j).some(word => 
        isImportantKeyword(word, keywordConfig)
      );
      
      if (containsImportantKeyword || phrase.length >= 6) {
        phrases.push(phrase);
      }
    }
  }

  return [...new Set(phrases)]; // 중복 제거
};

/**
 * 겹치는 청크들을 병합
 */
const mergeOverlappingChunks = (chunks: TextChunk[]): TextChunk[] => {
  if (chunks.length === 0) return [];

  const sorted = chunks.sort((a, b) => a.start - b.start);
  const merged: TextChunk[] = [];

  let current = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    
    // 겹치거나 인접한 경우 병합
    if (current.end >= next.start - 1) {
      current = {
        text: `${current.text}${next.text.substring(Math.max(0, current.end - next.start))}`,
        start: current.start,
        end: Math.max(current.end, next.end),
        score: Math.max(current.score, next.score),
        type: current.score > next.score ? current.type : next.type
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  return merged;
};

// 컨텍스트 확장은 현재 비활성화됨 (정확성 우선)

/**
 * PDF용: 연속된 span 요소들을 그룹화
 */
export const groupPDFElements = (
  elements: HTMLElement[],
  config: UnifiedHighlightConfig = defaultUnifiedConfig
): HighlightGroup[] => {
  const groups: HighlightGroup[] = [];
  const processed = new Set<HTMLElement>();

  elements.forEach(element => {
    if (processed.has(element)) return;

    const rect = element.getBoundingClientRect();
    const group: HighlightGroup = {
      chunks: [],
      elements: [element],
      boundingRect: rect,
      continuity: 1.0
    };

    // 인근 요소들 찾아서 그룹에 추가
    elements.forEach(otherElement => {
      if (processed.has(otherElement) || otherElement === element) return;

      const otherRect = otherElement.getBoundingClientRect();
      const distance = Math.sqrt(
        Math.pow(rect.left - otherRect.left, 2) + 
        Math.pow(rect.top - otherRect.top, 2)
      );

      if (distance <= config.maxDistance) {
        group.elements.push(otherElement);
        processed.add(otherElement);

        // 연속성 점수 계산
        const continuityScore = Math.max(0, 1 - distance / config.maxDistance);
        group.continuity = Math.min(group.continuity, continuityScore);
      }
    });

    processed.add(element);
    groups.push(group);
  });

  return groups;
};

/**
 * DOCX용: 텍스트 요소를 정밀하게 분할하여 하이라이팅
 */
export const preciseDOCXHighlight = (
  element: HTMLElement,
  textChunks: TextChunk[],
  config: UnifiedHighlightConfig = defaultUnifiedConfig
): void => {
  const originalText = element.textContent || '';
  if (!originalText.trim()) return;

  // 매칭되는 청크들 찾기
  const matchingChunks = textChunks.filter(chunk => 
    originalText.toLowerCase().includes(chunk.text.toLowerCase())
  );

  if (matchingChunks.length === 0) return;

  // 텍스트를 분할점들로 나누기
  const splitPoints = new Set<number>([0, originalText.length]);
  matchingChunks.forEach(chunk => {
    const index = originalText.toLowerCase().indexOf(chunk.text.toLowerCase());
    if (index !== -1) {
      splitPoints.add(index);
      splitPoints.add(index + chunk.text.length);
    }
  });

  const sortedPoints = Array.from(splitPoints).sort((a, b) => a - b);
  const textParts: Array<{text: string, shouldHighlight: boolean, score: number}> = [];

  for (let i = 0; i < sortedPoints.length - 1; i++) {
    const start = sortedPoints[i];
    const end = sortedPoints[i + 1];
    const partText = originalText.substring(start, end);

    const matchingChunk = matchingChunks.find(chunk =>
      partText.toLowerCase() === chunk.text.toLowerCase() ||
      chunk.text.toLowerCase().includes(partText.toLowerCase())
    );

    textParts.push({
      text: partText,
      shouldHighlight: !!matchingChunk && partText.trim().length >= config.minChunkLength,
      score: matchingChunk?.score || 0
    });
  }

  // 과도한 하이라이팅 방지
  const totalLength = originalText.length;
  const highlightLength = textParts
    .filter(part => part.shouldHighlight)
    .reduce((sum, part) => sum + part.text.length, 0);

  if (highlightLength / totalLength > config.maxHighlightRatio) {
    // 점수가 높은 부분만 유지
    const sortedParts = textParts
      .filter(part => part.shouldHighlight)
      .sort((a, b) => b.score - a.score);
    
    let allowedLength = Math.floor(totalLength * config.maxHighlightRatio);
    const allowedParts = new Set<string>();
    
    for (const part of sortedParts) {
      if (allowedLength >= part.text.length) {
        allowedParts.add(part.text);
        allowedLength -= part.text.length;
      }
    }

    textParts.forEach(part => {
      if (!allowedParts.has(part.text)) {
        part.shouldHighlight = false;
      }
    });
  }

  // DOM 재구성
  element.innerHTML = '';
  textParts.forEach(part => {
    if (part.shouldHighlight) {
      const span = document.createElement('span');
      span.className = 'docx-highlight';
      span.textContent = part.text;
      span.setAttribute('data-score', part.score.toString());
      element.appendChild(span);
    } else {
      const textNode = document.createTextNode(part.text);
      element.appendChild(textNode);
    }
  });
};

/**
 * 테스트용 함수 - 하이라이팅 품질 검증
 */
export const testHighlighting = () => {
  const testDocument1 = `
  AAA ~ AA+ 신용대출 - - 3 이하 10 이하 25 이하 25억 초과 ① 제1,2,3,4,5호 여신제외② 특수이해관계인 할인어음 포함
  담보대출(신용대출 금액 포함) - - 20 이하 40이하 60 이하 60억 초과
  BB~BB- 신용대출 0.2 이하 2 이하 7 이하 7억 초과
  `;

  const testDocument2 = `
  가계CSS대출 비적용 대상 및 재심사(신용대출) - - 0.2 이하 1 이하 1 초과 - -
  `;

  const testQuery1 = `"AAA ~ AA+ | 신용대출 | - | - | 3 이하 | 10 이하 | 25 이하 | 25억 초과 | ① 제1,2,3,4,5호 여신제외② 특수이해관계인 할인어음 포함 | 담보대출(신용대출 금액 포함) | - | - | 20 이하 | 40이하 | 60 이하 | 60억 초과"`;
  const testQuery2 = `"가계CSS대출 | 비적용 대상 및 재심사(신용대출) | - | - | 0.2 이하 | 1 이하 | 1 초과 | - | -"`;
  
  console.log('=== 개선된 범용 하이라이팅 테스트 결과 ===');
  
  // 첫 번째 테스트
  console.log('\n1. 금융 신용등급 테스트:');
  console.log('검색어:', testQuery1);
  const chunks1 = createTextChunks(testDocument1, testQuery1);
  console.log('매칭된 청크들:', chunks1.map(chunk => ({
    text: chunk.text,
    type: chunk.type,
    score: chunk.score
  })));
  console.log('예상 매칭: AAA, AA+, 신용대출, 25억, 담보대출, 60억');
  
  // 두 번째 테스트
  console.log('\n2. CSS대출 비적용 테스트:');
  console.log('검색어:', testQuery2);
  const chunks2 = createTextChunks(testDocument2, testQuery2);
  console.log('매칭된 청크들:', chunks2.map(chunk => ({
    text: chunk.text,
    type: chunk.type,
    score: chunk.score
  })));
  console.log('예상 매칭: 가계CSS대출, 비적용, 재심사, 신용대출');
  
  return { test1: chunks1, test2: chunks2 };
};