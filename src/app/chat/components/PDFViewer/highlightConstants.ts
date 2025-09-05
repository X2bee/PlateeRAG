// 하이라이팅에서 제외할 문자들 (불용어, 일반적인 단어, 특수문자 등)
export const EXCLUDED_WORDS = [
  // 한국어 조사/어미
  '은', '는', '이', '가', '을', '를', '에', '에서', '으로', '로', '와', '과', '의', '도', '만', '에게', '한테', '께',
  '서', '부터', '까지', '보다', '처럼', '같이', '마다', '조차', '라도', '이나', '나', '든지', '거나',
  '다', '이다', '었다', '았다', '했다', '겠다', '네요', '어요', '아요',
  
  // 한국어 일반 단어
  '것', '수', '때', '곳', '점', '면', '경우', '그', '이', '저', '그것', '이것', '저것', '여기', '거기', '저기',
  '누구', '무엇', '어디', '언제', '어떻게', '왜', '얼마', '몇', '어느', '어떤',
  '하다', '되다', '있다', '없다', '보다', '오다', '가다', '주다', '받다', '말하다', '생각하다',
  '위', '아래', '앞', '뒤', '옆', '안', '밖', '속', '밑', '사이', '근처', '주변',
  '그리고', '또는', '하지만', '그러나', '따라서', '그래서', '또한', '즉', '예를 들어',
  
  // 영어 불용어
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'can', 'may', 'might', 'must',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'this', 'that', 'these', 'those', 'here', 'there', 'when', 'where', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose',
  'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'one', 'two', 'first', 'second',
  
  // 특수문자 및 기타
  'nbsp', 'amp', 'lt', 'gt', 'quot', 'apos', // HTML 엔티티
  '·', ':', ';', '(', ')', '[', ']', '{', '}', '<', '>', '@', '#', '$', '%', '^', '&', '`', '-',
  
  // 추가적인 일반적인 단어들
  '입니다', '합니다', '습니다', '됩니다', '있습니다', '없습니다',
  '수', '개', '번', '차', '회', '건', '명', '분', '초', '시간', '일', '월', '년',
  '관련', '해당', '다음', '이전', '현재', '기존', '새로운', '추가', '변경', '삭제',
  '사용', '이용', '활용', '적용', '실시', '진행', '완료', '시작', '종료',
  // 금융 문서에서 자주 나오는 일반적인 단어들 ('이상', '이하', '초과', '미만'은 중요하므로 제거)
  '포함', '제외', '기준', '등급', '비고', '구분', '분류',
];

/**
 * 중요 키워드 패턴 정의
 * 문서 유형별로 중요한 키워드들을 관리
 */
export interface ImportantKeywordConfig {
  // 신용등급 관련
  creditRatings: RegExp;
  // 금액 관련
  amounts: RegExp;
  // 대출 유형
  loanTypes: RegExp;
  // 복합 키워드 (여러 단어 조합)
  compositeTerms: RegExp;
  // 사용자 정의 키워드
  customKeywords: string[];
}

export const defaultImportantKeywords: ImportantKeywordConfig = {
  // 신용등급: AAA, AA+, BB-, CCC 등
  creditRatings: /^(AAA|AA\+|AA-?|A\+|A-?|BBB\+|BBB-?|BB\+|BB-?|CCC\+?|CC\+?|C|D)$/i,
  
  // 금액: 25억, 100만원, 50만, 2,400만원, 7,500만원 등 (쉼표 포함/미포함 모두 지원)
  amounts: /^(\d{1,3}(?:[,.]?\d{3})*(?:억|만|천)?원?)$/i,
  
  // 대출 유형: 신용대출, 담보대출, 주택담보대출 등
  loanTypes: /^(신용대출|담보대출|주택담보대출|전세자금대출|가계대출|기업대출|CSS대출)$/i,
  
  // 복합 키워드: 재심사, 비적용, 대상, 제외 등의 조합
  compositeTerms: /^(가계CSS대출|비적용|재심사|대상|여신제외|할인어음|특수이해관계인|금액포함)$/i,
  
  // 사용자 정의 키워드 (동적으로 추가 가능)
  customKeywords: []
};

/**
 * 키워드가 중요한지 판단하는 함수
 */
export const isImportantKeyword = (
  keyword: string, 
  config: ImportantKeywordConfig = defaultImportantKeywords
): boolean => {
  // 빈 문자열이나 null 체크
  if (!keyword || !keyword.trim()) return false;
  
  const normalizedKeyword = keyword.trim();
  
  // 각 패턴에 대해 검사
  return (
    config.creditRatings.test(normalizedKeyword) ||
    config.amounts.test(normalizedKeyword) ||
    config.loanTypes.test(normalizedKeyword) ||
    config.compositeTerms.test(normalizedKeyword) ||
    config.customKeywords.includes(normalizedKeyword.toLowerCase())
  );
};

/**
 * 사용자 정의 키워드 추가 함수
 */
export const addCustomKeywords = (
  keywords: string[], 
  config: ImportantKeywordConfig = defaultImportantKeywords
): ImportantKeywordConfig => {
  return {
    ...config,
    customKeywords: [...new Set([...config.customKeywords, ...keywords.map(k => k.toLowerCase())])]
  };
};

/**
 * 텍스트에서 특정 태그와 그 내용을 제거하는 함수
 * @param text - 원본 텍스트
 * @returns 태그가 제거된 텍스트
 */
export const removeTagsAndContent = (text: string): string => {
  if (!text) return '';
  
  // <think>...</think> 태그와 내용 제거
  let cleanedText = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
  
  // <tooluselog>...</tooluselog> 태그와 내용 제거
  cleanedText = cleanedText.replace(/<tooluselog>[\s\S]*?<\/tooluselog>/gi, '');
  
  // <tooloutputlog>...</tooloutputlog> 태그와 내용도 제거 (추가적인 필터링)
  cleanedText = cleanedText.replace(/<tooloutputlog>[\s\S]*?<\/tooloutputlog>/gi, '');
  
  // 기타 XML/HTML 태그 제거 (선택적)
  cleanedText = cleanedText.replace(/<[^>]*>/g, '');
  
  // 연속된 공백 정리
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
  
  return cleanedText;
};

/**
 * 하이라이팅 대상 단어를 필터링하는 함수
 * @param text - 필터링할 텍스트
 * @returns 필터링된 단어 배열
 */
export const filterHighlightWords = (
  text: string, 
  customConfig?: ImportantKeywordConfig
): string[] => {
  // 먼저 태그와 내용을 제거
  const cleanedText = removeTagsAndContent(text);
  
  const words = cleanedText
    .split(/[\s,.\-!?;:()[\]{}""''«»„"‚'|~]+/) // 다양한 구두점과 따옴표 포함
    .filter(word => {
      // 빈 문자열 제외
      if (!word.trim()) return false;
      
      // 중요한 키워드들은 길이에 관계없이 포함
      if (isImportantKeyword(word, customConfig)) return true;
      
      // 일반적인 길이 필터 (2글자 이상)
      if (word.length < 2) return false;
      
      // 불용어 제외 (하지만 중요 키워드는 이미 위에서 포함됨)
      if (EXCLUDED_WORDS.includes(word.toLowerCase())) return false;
      
      // 순수 숫자만으로 구성된 경우 제외 (단, 금액 단위가 있으면 포함)
      if (/^\d+$/.test(word) && !/억|만|원/.test(word)) return false;
      
      // 특수문자만으로 구성된 단어 제외
      if (/^[^\w\uAC00-\uD7AF\u3130-\u318F]+$/.test(word)) return false;
      
      return true;
    });
    
  return words;
};

/**
 * 두 텍스트 간의 매칭을 확인하는 함수
 * @param searchWord - 검색할 단어
 * @param targetText - 대상 텍스트
 * @returns 매칭 여부
 */
export const isTextMatch = (searchWord: string, targetText: string): boolean => {
  const cleanTargetText = targetText.replace(/[.,!?;:()[\]{}""''«»„"‚']/g, '');
  return targetText.includes(searchWord) || 
         searchWord.includes(cleanTargetText) || 
         cleanTargetText.includes(searchWord);
};