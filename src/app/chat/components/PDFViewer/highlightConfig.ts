/**
 * 스마트 하이라이팅 설정
 */

export interface HighlightConfig {
  // 점수 임계값 설정
  thresholds: {
    minScore: number;           // 최소 하이라이팅 점수 (이 점수 이상만 하이라이팅)
    maxScore: number;           // 최대 점수 제한
  };
  
  // 점수 가중치 설정
  scoring: {
    singleTokenScore: number;   // 단일 토큰 기본 점수
    combinationBonus: number;   // 조합 보너스 점수 (토큰 개수당)
    continuityBonus: number;    // 문서 내 연속성 보너스 점수
    proximityBonus: number;     // 인접 단어 보너스 점수
  };
  
  // 연속성 검사 설정
  continuity: {
    maxDistance: number;        // 연속성으로 인정할 최대 단어 거리
    minMatchRatio: number;      // 최소 매칭 비율 (0.0-1.0)
  };
  
  // 시각적 설정
  visual: {
    enableAnimations: boolean;  // 애니메이션 활성화
    showScoreInfo: boolean;     // 점수 정보 표시 (개발용)
  };
}

// 기본 설정
export const defaultHighlightConfig: HighlightConfig = {
  thresholds: {
    minScore: 1,      // 1점 이상만 하이라이팅
    maxScore: 10,     // 최대 10점
  },
  
  scoring: {
    singleTokenScore: 1,      // 단일 토큰 = 1점
    combinationBonus: 1,      // 조합당 +1점 (2개 조합 = 2점 + 1점 = 3점)
    continuityBonus: 1,       // 연속성 보너스 +1점
    proximityBonus: 0.5,      // 인접성 보너스 +0.5점
  },
  
  continuity: {
    maxDistance: 3,           // 3단어 이내 거리
    minMatchRatio: 0.6,       // 60% 이상 매칭
  },
  
  visual: {
    enableAnimations: true,
    showScoreInfo: false,     // 프로덕션에서는 false
  },
};

// 설정 레벨별 프리셋
export const highlightPresets = {
  // 엄격한 매칭 (고품질만)
  strict: {
    ...defaultHighlightConfig,
    thresholds: { minScore: 3, maxScore: 10 },
    scoring: {
      singleTokenScore: 1,
      combinationBonus: 2,      // 조합 보너스 더 높게
      continuityBonus: 2,
      proximityBonus: 1,
    },
  },
  
  // 관대한 매칭 (더 많은 하이라이팅)
  permissive: {
    ...defaultHighlightConfig,
    thresholds: { minScore: 0.5, maxScore: 15 },
    scoring: {
      singleTokenScore: 1,
      combinationBonus: 0.5,    // 조합 보너스 낮게
      continuityBonus: 1,
      proximityBonus: 0.3,
    },
  },
  
  // 균형잡힌 기본값
  balanced: defaultHighlightConfig,
} as const;

export type HighlightPreset = keyof typeof highlightPresets;