import { FuzzyMatchOptions } from './fuzzyMatcher';

export type FuzzyAlgorithm = 'levenshtein' | 'jaro' | 'ngram';
export type HighlightLevel = 'exact' | 'similar' | 'related' | 'context' | 'entity' | 'phrase';

export interface HighlightConfig {
  fuzzyMatch: {
    enabled: boolean;
    threshold: number;
    algorithm: FuzzyAlgorithm;
    caseSensitive: boolean;
  };
  semanticMatch: {
    enabled: boolean;
    threshold: number;
    includeContext: boolean;
  };
  visual: {
    showConfidence: boolean;
    animationDuration: number;
    maxHighlights: number;
    enableHoverEffects: boolean;
  };
  textProcessing: {
    enablePhraseExtraction: boolean;
    enableEntityRecognition: boolean;
    minTermLength: number;
    maxTermLength: number;
    phraseMinWords: number;
    phraseMaxWords: number;
  };
  priority: {
    exact: number;
    similar: number;
    related: number;
    context: number;
    entity: number;
    phrase: number;
  };
}

export interface HighlightThresholds {
  exact: number;      // 1.0 (완전 일치)
  similar: number;    // 0.8+ (높은 유사도)
  related: number;    // 0.6+ (관련성 있음)
  context: number;    // 0.4+ (문맥상 관련)
}

export interface HighlightResult {
  text: string;
  level: HighlightLevel;
  confidence: number;
  bounds?: DOMRect;
  element?: HTMLElement;
  matchedBy: string; // 매칭된 알고리즘이나 방식
}

export const defaultHighlightConfig: HighlightConfig = {
  fuzzyMatch: {
    enabled: true,
    threshold: 0.7,
    algorithm: 'levenshtein',
    caseSensitive: false
  },
  semanticMatch: {
    enabled: false, // Phase 2에서 활성화 예정
    threshold: 0.6,
    includeContext: true
  },
  visual: {
    showConfidence: false,
    animationDuration: 2000,
    maxHighlights: 50,
    enableHoverEffects: true
  },
  textProcessing: {
    enablePhraseExtraction: true,
    enableEntityRecognition: true,
    minTermLength: 2,
    maxTermLength: 50,
    phraseMinWords: 2,
    phraseMaxWords: 5
  },
  priority: {
    exact: 100,
    similar: 80,
    related: 60,
    context: 40,
    entity: 90,
    phrase: 70
  }
};

export const defaultHighlightThresholds: HighlightThresholds = {
  exact: 1.0,
  similar: 0.8,
  related: 0.6,
  context: 0.4
};

/**
 * 신뢰도에 따른 하이라이트 레벨 결정
 */
export const determineHighlightLevel = (
  confidence: number,
  matchType: 'fuzzy' | 'exact' | 'entity' | 'phrase' = 'fuzzy',
  thresholds: HighlightThresholds = defaultHighlightThresholds
): HighlightLevel => {
  // 정확한 매칭
  if (confidence >= thresholds.exact) {
    return 'exact';
  }
  
  // 개체명이나 구문은 높은 우선순위
  if (matchType === 'entity' && confidence >= 0.7) {
    return 'entity';
  }
  
  if (matchType === 'phrase' && confidence >= 0.7) {
    return 'phrase';
  }
  
  // 유사도 기반 레벨 결정
  if (confidence >= thresholds.similar) {
    return 'similar';
  } else if (confidence >= thresholds.related) {
    return 'related';
  } else if (confidence >= thresholds.context) {
    return 'context';
  }
  
  // 임계값 미달
  return 'context'; // 기본값
};

/**
 * 하이라이트 레벨에 따른 CSS 클래스명 반환
 */
export const getHighlightClassName = (level: HighlightLevel): string => {
  const classMap: Record<HighlightLevel, string> = {
    exact: 'pdfHighlightExact',
    similar: 'pdfHighlightSimilar',
    related: 'pdfHighlightRelated',
    context: 'pdfHighlightContext',
    entity: 'pdfHighlightEntity',
    phrase: 'pdfHighlightPhrase'
  };
  
  return classMap[level];
};

/**
 * 하이라이트 우선순위 CSS 클래스명 반환
 */
export const getPriorityClassName = (priority: number): string => {
  if (priority >= 80) return 'highlightPriorityHigh';
  if (priority >= 50) return 'highlightPriorityMedium';
  return 'highlightPriorityLow';
};

/**
 * 설정 병합 유틸리티
 */
export const mergeHighlightConfig = (
  base: HighlightConfig,
  override: Partial<HighlightConfig>
): HighlightConfig => {
  return {
    fuzzyMatch: { ...base.fuzzyMatch, ...override.fuzzyMatch },
    semanticMatch: { ...base.semanticMatch, ...override.semanticMatch },
    visual: { ...base.visual, ...override.visual },
    textProcessing: { ...base.textProcessing, ...override.textProcessing },
    priority: { ...base.priority, ...override.priority }
  };
};

/**
 * FuzzyMatchOptions 변환 유틸리티
 */
export const configToFuzzyOptions = (config: HighlightConfig): FuzzyMatchOptions => {
  return {
    threshold: config.fuzzyMatch.threshold,
    algorithm: config.fuzzyMatch.algorithm,
    caseSensitive: config.fuzzyMatch.caseSensitive
  };
};