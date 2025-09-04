import { EXCLUDED_WORDS, removeTagsAndContent } from './highlightConstants';

export interface ProcessedText {
  keyTerms: string[];
  phrases: string[];
  entities: NamedEntity[];
  importance: number;
}

export interface NamedEntity {
  text: string;
  type: 'person' | 'organization' | 'location' | 'technical' | 'concept';
  confidence: number;
}

export interface TextProcessingOptions {
  enablePhraseExtraction: boolean;
  enableEntityRecognition: boolean;
  minTermLength: number;
  maxTermLength: number;
  phraseMinWords: number;
  phraseMaxWords: number;
}

/**
 * 향상된 불용어 필터링 (문맥 고려)
 */
export const contextAwareStopwordFilter = (words: string[], context: string): string[] => {
  const contextLower = context.toLowerCase();
  
  return words.filter(word => {
    const wordLower = word.toLowerCase();
    
    // 기본 불용어 체크
    if (EXCLUDED_WORDS.includes(wordLower)) {
      // 하지만 기술적 맥락에서 중요할 수 있는 단어들은 예외 처리
      const technicalExceptions = ['data', 'system', 'model', 'api', 'service', 'component'];
      if (technicalExceptions.includes(wordLower) && 
          (contextLower.includes('technical') || contextLower.includes('system') || contextLower.includes('api'))) {
        return true;
      }
      return false;
    }
    
    // 길이 기반 필터링
    if (word.length < 2 || word.length > 50) return false;
    
    // 숫자만으로 구성된 단어 제외 (단, 중요한 숫자는 예외)
    if (/^\d+$/.test(word)) {
      // 페이지 번호, 연도 등은 유지
      const num = parseInt(word);
      if (num > 1900 && num < 2030) return true; // 연도
      if (contextLower.includes('page') || contextLower.includes('페이지')) return true;
      return false;
    }
    
    // 특수문자만으로 구성된 단어 제외
    if (/^[^\w\uAC00-\uD7AF\u3130-\u318F]+$/.test(word)) return false;
    
    return true;
  });
};

/**
 * 구문(phrase) 추출 함수
 */
export const extractPhrases = (text: string, minWords: number = 2, maxWords: number = 5): string[] => {
  const cleanedText = removeTagsAndContent(text);
  const words = cleanedText.split(/[\s,.\-!?;:()[\]{}""''«»„"‚']+/)
    .filter(word => word.length > 0);
  
  const phrases: string[] = [];
  
  // n-gram 구문 생성
  for (let n = minWords; n <= Math.min(maxWords, words.length); n++) {
    for (let i = 0; i <= words.length - n; i++) {
      const phrase = words.slice(i, i + n).join(' ');
      
      // 구문 유효성 검사
      if (isPhraseValid(phrase)) {
        phrases.push(phrase);
      }
    }
  }
  
  return Array.from(new Set(phrases)); // 중복 제거
};

/**
 * 구문 유효성 검사
 */
const isPhraseValid = (phrase: string): boolean => {
  const words = phrase.split(' ');
  
  // 모든 단어가 불용어인 구문 제외
  if (words.every(word => EXCLUDED_WORDS.includes(word.toLowerCase()))) {
    return false;
  }
  
  // 의미있는 단어가 하나 이상 포함되어야 함
  const meaningfulWords = words.filter(word => 
    word.length > 2 && !EXCLUDED_WORDS.includes(word.toLowerCase())
  );
  
  return meaningfulWords.length >= 1;
};

/**
 * 기본 개체명 인식 (간단한 패턴 기반)
 */
export const basicNamedEntityRecognition = (text: string): NamedEntity[] => {
  const entities: NamedEntity[] = [];
  const cleanedText = removeTagsAndContent(text);
  
  // 한국어 조직명 패턴
  const organizationPatterns = [
    /([가-힣]+)(?:회사|기업|그룹|코퍼레이션|주식회사|유한회사)/g,
    /([가-힣]+)(?:대학교|대학|학교|연구소|연구원|센터)/g,
    /([가-힣]+)(?:부|과|팀|실|국|청|원|소)/g
  ];
  
  organizationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      entities.push({
        text: match[0],
        type: 'organization',
        confidence: 0.8
      });
    }
  });
  
  // 영어 조직명 패턴
  const englishOrgPatterns = [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|Corp|Ltd|LLC|Company|Corporation|University|Institute|Center)\b/g,
    /\b(?:Google|Microsoft|Apple|Amazon|Meta|Tesla|OpenAI|Anthropic)\b/g
  ];
  
  englishOrgPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      entities.push({
        text: match[0],
        type: 'organization',
        confidence: 0.9
      });
    }
  });
  
  // 기술 용어 패턴
  const technicalPatterns = [
    /\b(?:API|REST|GraphQL|JSON|XML|HTTP|HTTPS|URL|URI|SDK|CLI|GUI|UI|UX|AI|ML|DL|NLP|LLM|GPT|BERT)\b/g,
    /\b(?:React|Vue|Angular|Node\.js|Python|JavaScript|TypeScript|Java|Go|Rust|C\+\+|SQL|NoSQL|MongoDB|PostgreSQL|MySQL)\b/g,
    /\b(?:Docker|Kubernetes|AWS|Azure|GCP|Lambda|Serverless|Microservice|Database|Cache|Redis|Elasticsearch)\b/g
  ];
  
  technicalPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(cleanedText)) !== null) {
      entities.push({
        text: match[0],
        type: 'technical',
        confidence: 0.95
      });
    }
  });
  
  // 중복 제거 및 정렬
  const uniqueEntities = entities.reduce((acc, entity) => {
    const existing = acc.find(e => e.text.toLowerCase() === entity.text.toLowerCase());
    if (!existing || existing.confidence < entity.confidence) {
      return [...acc.filter(e => e.text.toLowerCase() !== entity.text.toLowerCase()), entity];
    }
    return acc;
  }, [] as NamedEntity[]);
  
  return uniqueEntities.sort((a, b) => b.confidence - a.confidence);
};

/**
 * 텍스트 중요도 계산
 */
export const calculateTextImportance = (text: string, context: string = ''): number => {
  const cleanedText = removeTagsAndContent(text);
  let importance = 0;
  
  // 길이 기반 점수
  const lengthScore = Math.min(cleanedText.length / 100, 1.0) * 0.3;
  
  // 개체명 포함 점수
  const entities = basicNamedEntityRecognition(cleanedText);
  const entityScore = Math.min(entities.length / 5, 1.0) * 0.4;
  
  // 기술 용어 밀도 점수
  const technicalTerms = entities.filter(e => e.type === 'technical').length;
  const technicalScore = Math.min(technicalTerms / 3, 1.0) * 0.3;
  
  importance = lengthScore + entityScore + technicalScore;
  
  return Math.min(importance, 1.0);
};

/**
 * 향상된 텍스트 처리 메인 함수
 */
export const processTextForHighlighting = (
  text: string, 
  context: string = '',
  options: Partial<TextProcessingOptions> = {}
): ProcessedText => {
  const defaultOptions: TextProcessingOptions = {
    enablePhraseExtraction: true,
    enableEntityRecognition: true,
    minTermLength: 2,
    maxTermLength: 50,
    phraseMinWords: 2,
    phraseMaxWords: 5
  };
  
  const finalOptions = { ...defaultOptions, ...options };
  const cleanedText = removeTagsAndContent(text);
  
  // 단어 추출 및 필터링
  const rawWords = cleanedText.split(/[\s,.\-!?;:()[\]{}""''«»„"‚']+/)
    .filter(word => 
      word.length >= finalOptions.minTermLength && 
      word.length <= finalOptions.maxTermLength
    );
  
  const keyTerms = contextAwareStopwordFilter(rawWords, context);
  
  // 구문 추출
  const phrases = finalOptions.enablePhraseExtraction 
    ? extractPhrases(cleanedText, finalOptions.phraseMinWords, finalOptions.phraseMaxWords)
    : [];
  
  // 개체명 인식
  const entities = finalOptions.enableEntityRecognition 
    ? basicNamedEntityRecognition(cleanedText)
    : [];
  
  // 중요도 계산
  const importance = calculateTextImportance(cleanedText, context);
  
  return {
    keyTerms,
    phrases,
    entities,
    importance
  };
};