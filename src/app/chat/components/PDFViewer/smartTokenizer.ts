/**
 * 스마트 토큰화 및 조합 점수 시스템
 * 언어 경계를 인식하여 텍스트를 분할하고, 조합별 점수를 부여
 */

export interface SmartToken {
  text: string;
  type: 'korean' | 'english' | 'number' | 'symbol' | 'mixed';
  original: string;
}

export interface CombinationMatch {
  tokens: SmartToken[];
  matchedText: string;
  score: number; // 매칭된 토큰 개수 = 점수
  startIndex: number;
  endIndex: number;
}

/**
 * 한국어 불용어 및 조사 (필터링할 단어들)
 */
const KOREAN_STOPWORDS = [
  // 조사
  '은', '는', '이', '가', '을', '를', '에', '에서', '으로', '로', '와', '과', '의', '도', '만', '에게', '한테', '께',
  '서', '부터', '까지', '보다', '처럼', '같이', '마다', '조차', '라도', '이나', '나', '든지', '거나',
  // 어미
  '다', '이다', '었다', '았다', '했다', '겠다', '네요', '어요', '아요',
  // 일반 불용어
  '및', '등', '기타'
];

/**
 * 특수문자 패턴 (제거할 문자들)
 */
const SPECIAL_CHARS = /[\|\-\(\)\[\]{}.,;:!?'"~`@#$%^&*+=<>\/\\]/g;

/**
 * 언어 경계 기반 스마트 토큰화
 * 예: "가계CSS대출" → ["가계", "CSS", "대출"]
 *     "0.2억" → ["0.2억"] (숫자+단위는 유지)
 *     "비적용" → ["비적용"]
 */
export const smartTokenize = (text: string): SmartToken[] => {
  if (!text?.trim()) return [];
  
  // 1. 특수문자 제거 및 정리
  const cleanText = text.replace(SPECIAL_CHARS, ' ').replace(/\s+/g, ' ').trim();
  
  // 2. 띄어쓰기로 1차 분할
  const words = cleanText.split(' ').filter(word => word.trim());
  
  const tokens: SmartToken[] = [];
  
  words.forEach(word => {
    // 불용어 필터링
    if (KOREAN_STOPWORDS.includes(word.toLowerCase())) return;
    
    // 3. 각 단어를 언어 경계로 세분화
    const subTokens = splitByLanguageBoundary(word);
    tokens.push(...subTokens);
  });
  
  return tokens.filter(token => token.text.length > 0);
};

/**
 * 언어 경계로 단어 분할
 * 예: "가계CSS대출" → ["가계", "CSS", "대출"]
 *     "0.2억" → ["0.2억"] (숫자+한글 단위는 유지)
 */
const splitByLanguageBoundary = (word: string): SmartToken[] => {
  if (!word) return [];
  
  const tokens: SmartToken[] = [];
  let currentToken = '';
  let currentType: SmartToken['type'] | null = null;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const charType = getCharacterType(char);
    
    // 특수 케이스: 숫자 + 한글 단위 (예: "0.2억", "1만") - 분리하지 않음
    if (currentType === 'number' && charType === 'korean') {
      const remainingText = word.slice(i);
      if (/^[억만천원]+$/.test(remainingText)) {
        // 숫자+단위 조합은 하나로 유지
        currentToken += remainingText;
        tokens.push({
          text: currentToken,
          type: 'mixed',
          original: currentToken
        });
        break;
      }
    }
    
    if (currentType === null || currentType === charType) {
      // 같은 타입이므로 계속 추가
      currentToken += char;
      currentType = charType;
    } else {
      // 타입이 바뀌었으므로 이전 토큰 저장
      if (currentToken.trim()) {
        tokens.push({
          text: currentToken.trim(),
          type: currentType,
          original: currentToken.trim()
        });
      }
      currentToken = char;
      currentType = charType;
    }
  }
  
  // 마지막 토큰 처리
  if (currentToken.trim()) {
    tokens.push({
      text: currentToken.trim(),
      type: currentType || 'mixed',
      original: currentToken.trim()
    });
  }
  
  return tokens.filter(token => token.text.length > 0);
};

/**
 * 문자 타입 판별
 */
const getCharacterType = (char: string): SmartToken['type'] => {
  if (/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(char)) return 'korean';
  if (/[a-zA-Z]/.test(char)) return 'english';
  if (/[0-9.]/.test(char)) return 'number';
  return 'symbol';
};

/**
 * 문서에서 모든 가능한 조합 매칭 찾기
 * 1개 토큰 매칭 = 1점, 2개 조합 = 2점, 3개 조합 = 3점...
 */
export const findCombinationMatches = (
  documentText: string,
  searchTokens: SmartToken[]
): CombinationMatch[] => {
  if (!documentText || searchTokens.length === 0) return [];
  
  const matches: CombinationMatch[] = [];
  const docLower = documentText.toLowerCase();
  
  // 1점: 개별 토큰 매칭
  searchTokens.forEach(token => {
    const tokenLower = token.text.toLowerCase();
    let startIndex = 0;
    
    while (true) {
      const index = docLower.indexOf(tokenLower, startIndex);
      if (index === -1) break;
      
      // 단어 경계 확인 (한국어는 더 유연하게)
      if (isValidWordBoundary(docLower, index, tokenLower)) {
        matches.push({
          tokens: [token],
          matchedText: documentText.substring(index, index + tokenLower.length),
          score: 1,
          startIndex: index,
          endIndex: index + tokenLower.length
        });
      }
      
      startIndex = index + 1;
    }
  });
  
  // 2점 이상: 토큰 조합 매칭
  for (let combSize = 2; combSize <= Math.min(4, searchTokens.length); combSize++) {
    findCombinationMatchesOfSize(documentText, searchTokens, combSize, matches);
  }
  
  // 겹치는 매칭 제거 (점수가 높은 것 우선)
  return removeDuplicateMatches(matches);
};

/**
 * 특정 크기의 조합 매칭 찾기
 */
const findCombinationMatchesOfSize = (
  documentText: string,
  searchTokens: SmartToken[],
  combSize: number,
  matches: CombinationMatch[]
) => {
  const docLower = documentText.toLowerCase();
  
  // 모든 가능한 토큰 조합 생성
  for (let i = 0; i <= searchTokens.length - combSize; i++) {
    const tokenCombination = searchTokens.slice(i, i + combSize);
    
    // 조합된 텍스트들을 다양한 방식으로 검색
    // 1) 연속된 조합: "가계 CSS 대출"
    const spaceJoined = tokenCombination.map(t => t.text).join(' ').toLowerCase();
    // 2) 붙인 조합: "가계CSS대출" 
    const directJoined = tokenCombination.map(t => t.text).join('').toLowerCase();
    
    [spaceJoined, directJoined].forEach(searchPattern => {
      if (searchPattern.length < 2) return;
      
      let startIndex = 0;
      while (true) {
        const index = docLower.indexOf(searchPattern, startIndex);
        if (index === -1) break;
        
        if (isValidWordBoundary(docLower, index, searchPattern)) {
          matches.push({
            tokens: tokenCombination,
            matchedText: documentText.substring(index, index + searchPattern.length),
            score: combSize,
            startIndex: index,
            endIndex: index + searchPattern.length
          });
        }
        
        startIndex = index + 1;
      }
    });
  }
};

/**
 * 단어 경계 유효성 검사 (한국어 친화적)
 */
const isValidWordBoundary = (text: string, index: number, pattern: string): boolean => {
  const beforeChar = index > 0 ? text[index - 1] : ' ';
  const afterChar = index + pattern.length < text.length ? text[index + pattern.length] : ' ';
  
  // 한국어는 경계 검사를 더 유연하게
  const isWordBoundary = (
    /[\s.,\-|()[\]{}~]/.test(beforeChar) ||
    /[\s.,\-|()[\]{}~]/.test(afterChar) ||
    index === 0 ||
    index + pattern.length === text.length ||
    !/[가-힣a-zA-Z0-9]/.test(beforeChar) ||
    !/[가-힣a-zA-Z0-9]/.test(afterChar)
  );
  
  return isWordBoundary;
};

/**
 * 겹치는 매칭 제거 (점수가 높은 것 우선 유지)
 */
const removeDuplicateMatches = (matches: CombinationMatch[]): CombinationMatch[] => {
  // 점수 높은 순으로 정렬
  const sortedMatches = matches.sort((a, b) => b.score - a.score);
  const finalMatches: CombinationMatch[] = [];
  
  for (const match of sortedMatches) {
    // 기존 매칭들과 겹치는지 확인
    const hasOverlap = finalMatches.some(existing => 
      (match.startIndex < existing.endIndex && match.endIndex > existing.startIndex)
    );
    
    if (!hasOverlap) {
      finalMatches.push(match);
    }
  }
  
  return finalMatches;
};

/**
 * 테스트 함수
 */
export const testSmartTokenizer = () => {
  const testText = "가계CSS대출 | 비적용 대상 및 재심사(신용대출) | - | - | 0.2 이하 | 1억 이하 | 1 초과 | - | -";
  
  console.log('=== 스마트 토큰화 테스트 ===');
  console.log('입력:', testText);
  
  const tokens = smartTokenize(testText);
  console.log('토큰화 결과:');
  tokens.forEach((token, i) => {
    console.log(`  ${i + 1}. "${token.text}" (${token.type})`);
  });
  
  const docText = "가계 대출 CSS대출 적용 자동승인 가계 CSS 대출 비적용 대상 및 재심사 신용대출 0.2 이하 1 이하 1 초과";
  const matches = findCombinationMatches(docText, tokens);
  
  console.log('\n매칭 결과:');
  matches.forEach((match, i) => {
    console.log(`  ${i + 1}. "${match.matchedText}" (${match.score}점) - 토큰: [${match.tokens.map(t => t.text).join(', ')}]`);
  });
  
  return { tokens, matches };
};