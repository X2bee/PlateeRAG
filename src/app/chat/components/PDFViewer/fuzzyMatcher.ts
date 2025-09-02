export interface FuzzyMatchOptions {
  threshold: number;        // Similarity threshold (0.0-1.0)
  algorithm: 'levenshtein' | 'jaro' | 'ngram';
  caseSensitive: boolean;
}

export interface FuzzyMatchResult {
  isMatch: boolean;
  confidence: number;
  algorithm: string;
}

/**
 * Levenshtein distance 알고리즘 구현
 * 두 문자열 간의 편집 거리를 계산
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // 빈 문자열 처리
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // 매트릭스 초기화
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // 매트릭스 계산
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // 삭제
          matrix[i][j - 1] + 1,     // 삽입
          matrix[i - 1][j - 1] + 1  // 교체
        );
      }
    }
  }

  return matrix[len1][len2];
};

/**
 * Levenshtein 거리를 유사도로 변환 (0.0-1.0)
 */
export const levenshteinSimilarity = (str1: string, str2: string): number => {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1.0;
  return 1 - (distance / maxLength);
};

/**
 * Jaro 유사도 알고리즘 구현
 * 문자열의 순서와 위치를 고려한 유사도 계산
 */
export const jaroSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1.0;
  if (str1.length === 0 || str2.length === 0) return 0.0;

  const matchWindow = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  if (matchWindow < 0) return 0.0;

  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // 매칭 찾기
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = true;
      str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // 전위(transposition) 계산
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  return (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
};

/**
 * N-gram 생성 함수
 */
export const generateNgrams = (text: string, n: number): string[] => {
  if (text.length < n) return [text];
  
  const ngrams: string[] = [];
  for (let i = 0; i <= text.length - n; i++) {
    ngrams.push(text.substring(i, i + n));
  }
  return ngrams;
};

/**
 * N-gram 기반 유사도 계산
 */
export const ngramSimilarity = (str1: string, str2: string, n: number = 2): number => {
  const ngrams1 = new Set(generateNgrams(str1.toLowerCase(), n));
  const ngrams2 = new Set(generateNgrams(str2.toLowerCase(), n));
  
  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
};

/**
 * 메인 fuzzy 매칭 함수
 */
export const fuzzyTextMatch = (
  searchWord: string, 
  targetText: string, 
  options: FuzzyMatchOptions
): FuzzyMatchResult => {
  // 대소문자 처리
  const search = options.caseSensitive ? searchWord : searchWord.toLowerCase();
  const target = options.caseSensitive ? targetText : targetText.toLowerCase();

  let confidence = 0;
  
  // 정확한 매칭 우선 확인
  if (target.includes(search)) {
    return {
      isMatch: true,
      confidence: 1.0,
      algorithm: 'exact'
    };
  }

  // 선택된 알고리즘에 따른 유사도 계산
  switch (options.algorithm) {
    case 'levenshtein':
      confidence = levenshteinSimilarity(search, target);
      break;
    case 'jaro':
      confidence = jaroSimilarity(search, target);
      break;
    case 'ngram':
      confidence = ngramSimilarity(search, target, 2);
      break;
    default:
      confidence = levenshteinSimilarity(search, target);
  }

  return {
    isMatch: confidence >= options.threshold,
    confidence,
    algorithm: options.algorithm
  };
};

/**
 * 기본 fuzzy 매칭 옵션
 */
export const defaultFuzzyOptions: FuzzyMatchOptions = {
  threshold: 0.7,
  algorithm: 'levenshtein',
  caseSensitive: false
};

/**
 * 빠른 fuzzy 매칭 (기본 옵션 사용)
 */
export const quickFuzzyMatch = (searchWord: string, targetText: string): boolean => {
  return fuzzyTextMatch(searchWord, targetText, defaultFuzzyOptions).isMatch;
};