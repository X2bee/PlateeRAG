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
    minScore: 1,      // 1점 이상만 하이라이팅 (조합 전용 단어는 0.5점이므로 단독 제외)
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

/**
 * 단독으로는 하이라이팅되지 않지만 조합에서는 허용되는 단어들
 * 예: "이하", "초과", "대상", "적용" 등
 */
export const COMBINATION_ONLY_WORDS = [
  // 범위/조건 관련
  '이하', '초과', '미만', '이상', '이내', '범위',
  
  // 상태/분류 관련  
  '대상', '적용', '비적용', '해당', '포함', '제외', '구분',
  
  // 일반적인 동사/형용사
  '가능', '불가능', '필요', '불필요', '완료', '미완료',
  '승인', '거부', '통과', '실패', '성공',
  
  // 기본 단위/개념
  '건', '개', '명', '원', '점', '회', '차', '등급', '단계', '수준',
  
  // 시간 관련
  '전', '후', '중', '간', '시', '일', '월', '년',
  
  // 공통 접두사/접미사  
  '신', '구', '재', '최', '고', '저', '상', '하', '좌', '우'
];

/**
 * 단어가 조합에서만 허용되는 단어인지 확인
 */
export const isCombinationOnlyWord = (word: string): boolean => {
  return COMBINATION_ONLY_WORDS.includes(word.toLowerCase().trim());
};