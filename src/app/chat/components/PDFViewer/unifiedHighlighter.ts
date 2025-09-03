/**
 * 통합 하이라이팅 시스템
 * PDF와 DOCX의 하이라이팅 차이를 해결하는 통합 솔루션
 */

import { filterHighlightWords } from './highlightConstants';

export interface TextChunk {
  text: string;
  start: number;
  end: number;
  score: number;
  type: 'exact' | 'phrase' | 'context' | 'partial';
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
}

export const defaultUnifiedConfig: UnifiedHighlightConfig = {
  minChunkLength: 3,
  maxDistance: 50,
  contextWords: 2,
  precisionLevel: 'phrase',
  maxHighlightRatio: 0.3,
  groupingThreshold: 0.7
};

/**
 * 텍스트를 의미있는 청크로 분할
 */
export const createTextChunks = (
  fullText: string,
  searchText: string,
  config: UnifiedHighlightConfig = defaultUnifiedConfig
): TextChunk[] => {
  if (!searchText.trim()) return [];

  const searchTerms = filterHighlightWords(searchText);
  
  const chunks: TextChunk[] = [];
  const fullTextLower = fullText.toLowerCase();

  // 1. 정확한 매칭 찾기
  searchTerms.forEach(term => {
    let startIndex = 0;
    while (true) {
      const index = fullTextLower.indexOf(term, startIndex);
      if (index === -1) break;

      // 단어 경계 확인 (완전한 단어만 매칭)
      const isWordBoundary = (
        (index === 0 || !/\w/.test(fullTextLower[index - 1])) &&
        (index + term.length === fullTextLower.length || !/\w/.test(fullTextLower[index + term.length]))
      );

      if (isWordBoundary) {
        chunks.push({
          text: fullText.substring(index, index + term.length),
          start: index,
          end: index + term.length,
          score: 1.0,
          type: 'exact'
        });
      }

      startIndex = index + 1;
    }
  });

  // 2. 구문 단위 매칭 (여러 단어 조합)
  const phrases = extractPhrases(searchText, config.contextWords);
  phrases.forEach(phrase => {
    let startIndex = 0;
    while (true) {
      const index = fullTextLower.indexOf(phrase.toLowerCase(), startIndex);
      if (index === -1) break;

      chunks.push({
        text: fullText.substring(index, index + phrase.length),
        start: index,
        end: index + phrase.length,
        score: 0.8,
        type: 'phrase'
      });

      startIndex = index + phrase.length;
    }
  });

  // 3. 중복 제거 및 병합
  const mergedChunks = mergeOverlappingChunks(chunks);

  // 4. 컨텍스트 확장
  const expandedChunks = expandChunksWithContext(mergedChunks, fullText, config);

  // 5. 점수순 정렬 및 개수 제한
  return expandedChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.floor(fullText.length * config.maxHighlightRatio / 10));
};

/**
 * 검색어에서 의미있는 구문 추출
 */
const extractPhrases = (searchText: string, contextWords: number): string[] => {
  const words = filterHighlightWords(searchText);
  const phrases: string[] = [];

  // 2-3 단어 조합으로 구문 생성
  for (let i = 0; i < words.length; i++) {
    for (let j = 2; j <= Math.min(contextWords + 1, words.length - i); j++) {
      const phrase = words.slice(i, i + j).join(' ');
      if (phrase.length >= 6) { // 최소 구문 길이
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

/**
 * 청크를 컨텍스트와 함께 확장
 */
const expandChunksWithContext = (
  chunks: TextChunk[],
  fullText: string,
  config: UnifiedHighlightConfig
): TextChunk[] => {
  return chunks.map(chunk => {
    const words = fullText.split(/\s+/);
    const chunkText = fullText.substring(chunk.start, chunk.end);
    const chunkStart = fullText.indexOf(chunkText);
    
    // 단어 경계 찾기
    let wordStart = 0;
    let wordEnd = words.length - 1;
    
    let currentPos = 0;
    for (let i = 0; i < words.length; i++) {
      const wordEnd = currentPos + words[i].length;
      if (currentPos <= chunkStart && wordEnd >= chunkStart) {
        wordStart = Math.max(0, i - config.contextWords);
        break;
      }
      currentPos = wordEnd + 1; // 공백 포함
    }

    currentPos = 0;
    for (let i = 0; i < words.length; i++) {
      const wordStartPos = currentPos;
      const wordEndPos = currentPos + words[i].length;
      if (wordStartPos <= chunk.end && wordEndPos >= chunk.end) {
        wordEnd = Math.min(words.length - 1, i + config.contextWords);
        break;
      }
      currentPos = wordEndPos + 1; // 공백 포함
    }

    // 컨텍스트 포함 텍스트 생성
    const contextWords = words.slice(wordStart, wordEnd + 1);
    const contextText = contextWords.join(' ');
    
    const newStart = fullText.indexOf(contextWords[0]);
    const newEnd = newStart + contextText.length;

    return {
      ...chunk,
      text: contextText,
      start: newStart,
      end: newEnd,
      type: chunk.type === 'exact' ? 'exact' : 'context' as TextChunk['type']
    };
  });
};

/**
 * PDF용: 연속된 span 요소들을 그룹화
 */
export const groupPDFElements = (
  elements: HTMLElement[],
  textChunks: TextChunk[],
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