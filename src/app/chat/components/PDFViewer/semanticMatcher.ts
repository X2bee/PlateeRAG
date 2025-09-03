// Implements TF-IDF, cosine similarity, and advanced semantic matching

import { DocumentStructure, Section } from './documentAnalyzer';

export interface SemanticMatchResult {
  sentences: MatchedSentence[];
  phrases: MatchedPhrase[];
  keywords: MatchedKeyword[];
  entities: MatchedEntity[];
  overallRelevance: number;
  processingTime: number;
}

export interface MatchedSentence {
  id: string;
  content: string;
  similarity: number;
  bounds: Rectangle;
  context: string;
  sectionId?: string;
  matchedTerms: string[];
  matchType: 'exact' | 'semantic' | 'fuzzy' | 'contextual';
}

export interface MatchedPhrase {
  id: string;
  content: string;
  similarity: number;
  bounds: Rectangle;
  context: string;
  importance: number;
  matchedQuery: string;
}

export interface MatchedKeyword {
  id: string;
  keyword: string;
  similarity: number;
  frequency: number;
  positions: TextPosition[];
  importance: number;
  semanticVariants: string[];
}

export interface MatchedEntity {
  id: string;
  text: string;
  type: 'person' | 'organization' | 'location' | 'technical' | 'concept' | 'date' | 'number';
  similarity: number;
  bounds: Rectangle;
  context: string;
  confidence: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextPosition {
  bounds: Rectangle;
  pageNumber: number;
  sectionId?: string;
  context: string;
}

interface DocumentVector {
  terms: Map<string, number>;
  magnitude: number;
  documentId: string;
}

interface QueryVector {
  terms: Map<string, number>;
  magnitude: number;
  expandedTerms: Map<string, number>;
}

interface TFIDFScores {
  tf: Map<string, number>;
  idf: Map<string, number>;
  tfidf: Map<string, number>;
}

interface SemanticContext {
  documentStructure: DocumentStructure;
  vocabulary: Set<string>;
  documentVectors: Map<string, DocumentVector>;
  termDocumentFreq: Map<string, number>;
  totalDocuments: number;
}

export interface MatchingProgressCallback {
  (step: string, progress: number, details?: any): void;
}

/**
 * Advanced semantic similarity engine
 */
export class SemanticMatcher {
  private context: SemanticContext;
  private stopWords!: Set<string>;
  private synonymDict!: Map<string, string[]>;
  private progressCallback?: MatchingProgressCallback;
  
  constructor(progressCallback?: MatchingProgressCallback) {
    this.progressCallback = progressCallback;
    this.context = {
      documentStructure: {} as DocumentStructure,
      vocabulary: new Set(),
      documentVectors: new Map(),
      termDocumentFreq: new Map(),
      totalDocuments: 0
    };
    
    this.initializeStopWords();
    this.initializeSynonymDictionary();
  }

  private initializeStopWords() {
    this.stopWords = new Set([
      // Korean stopwords
      '이', '그', '저', '의', '가', '을', '를', '에', '와', '과', '도', '만', '에서', '으로', '로', 
      '은', '는', '이다', '다', '하다', '있다', '되다', '같다', '보다', '위해', '통해', '대해',
      // English stopwords
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'
    ]);
  }

  private initializeSynonymDictionary() {
    this.synonymDict = new Map([
      // Technical terms
      ['ai', ['artificial intelligence', 'machine learning', 'deep learning', '인공지능', '머신러닝']],
      ['api', ['application programming interface', '애플리케이션 프로그래밍 인터페이스']],
      ['database', ['db', 'data store', '데이터베이스', '디비']],
      ['algorithm', ['알고리즘', 'method', '방법']],
      
      // Common business terms
      ['company', ['corporation', 'business', 'organization', '회사', '기업', '조직']],
      ['revenue', ['income', 'sales', '매출', '수익', '수입']],
      ['customer', ['client', 'user', '고객', '사용자', '클라이언트']],
      
      // Academic terms
      ['research', ['study', 'investigation', '연구', '조사']],
      ['analysis', ['examination', 'evaluation', '분석', '검토']],
      ['methodology', ['method', 'approach', '방법론', '접근법']]
    ]);
  }

  /**
   * Main semantic matching function
   */
  public async findSemanticMatches(
    responseContent: string,
    documentContent: string,
    documentStructure: DocumentStructure,
    chunkSize: number = 50
  ): Promise<SemanticMatchResult> {
    const startTime = performance.now();
    
    this.context.documentStructure = documentStructure;
    
    this.reportProgress('텍스트 전처리', 5, { 
      responseLength: responseContent.length,
      documentLength: documentContent.length 
    });
    
    // Preprocess and analyze content
    const processedQuery = this.preprocessText(responseContent);
    const processedDocument = this.preprocessText(documentContent);
    
    this.reportProgress('의미적 컨텍스트 구축', 15, { 
      structureSections: documentStructure.sections.length 
    });
    
    // Build semantic context
    await this.buildSemanticContext(processedDocument, documentStructure);
    
    this.reportProgress('쿼리 벡터 생성', 25);
    
    // Create query vector with expansion
    const queryVector = this.createQueryVector(processedQuery);
    
    this.reportProgress('의미 매칭 실행', 40);
    
    // Find semantic matches using different strategies
    const [sentences, phrases, keywords, entities] = await Promise.all([
      this.findMatchingSentences(queryVector, chunkSize),
      this.findMatchingPhrases(queryVector, chunkSize),
      this.findMatchingKeywords(queryVector),
      this.findMatchingEntities(queryVector, responseContent)
    ]);
    
    this.reportProgress('전체 관련성 계산', 90, {
      sentenceMatches: sentences.length,
      phraseMatches: phrases.length,
      keywordMatches: keywords.length,
      entityMatches: entities.length
    });
    
    // Calculate overall relevance
    const overallRelevance = this.calculateOverallRelevance(sentences, phrases, keywords, entities);
    
    const processingTime = performance.now() - startTime;
    
    this.reportProgress('의미 매칭 완료', 100, {
      totalMatches: sentences.length + phrases.length + keywords.length + entities.length,
      overallRelevance,
      processingTime: Math.round(processingTime)
    });
    
    return {
      sentences,
      phrases,
      keywords,
      entities,
      overallRelevance,
      processingTime
    };
  }

  private reportProgress(step: string, progress: number, details?: any): void {
    if (this.progressCallback) {
      this.progressCallback(step, progress, details);
    }
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w가-힣\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async buildSemanticContext(documentText: string, structure: DocumentStructure) {
    // Build vocabulary from document
    const words = documentText.split(/\s+/).filter(word => 
      word.length > 1 && !this.stopWords.has(word)
    );
    
    words.forEach(word => this.context.vocabulary.add(word));
    
    // Create document vectors for each section
    structure.sections.forEach(section => {
      const sectionText = this.preprocessText(section.content);
      const vector = this.createDocumentVector(sectionText, section.id);
      this.context.documentVectors.set(section.id, vector);
    });
    
    this.context.totalDocuments = structure.sections.length;
    
    // Calculate IDF scores
    this.calculateIDF();
  }

  private createDocumentVector(text: string, documentId: string): DocumentVector {
    const terms = new Map<string, number>();
    const words = text.split(/\s+/).filter(word => 
      word.length > 1 && !this.stopWords.has(word)
    );
    
    // Calculate term frequencies
    const totalWords = words.length;
    words.forEach(word => {
      terms.set(word, (terms.get(word) || 0) + 1);
    });
    
    // Normalize to TF scores
    terms.forEach((count, term) => {
      terms.set(term, count / totalWords);
    });
    
    // Calculate magnitude for cosine similarity
    const magnitude = Math.sqrt(
      Array.from(terms.values()).reduce((sum, tf) => sum + tf * tf, 0)
    );
    
    // Update term-document frequency
    terms.forEach((_, term) => {
      this.context.termDocumentFreq.set(
        term, 
        (this.context.termDocumentFreq.get(term) || 0) + 1
      );
    });
    
    return { terms, magnitude, documentId };
  }

  private createQueryVector(queryText: string): QueryVector {
    const terms = new Map<string, number>();
    const expandedTerms = new Map<string, number>();
    
    const words = queryText.split(/\s+/).filter(word => 
      word.length > 1 && !this.stopWords.has(word)
    );
    
    // Calculate query term frequencies
    words.forEach(word => {
      terms.set(word, (terms.get(word) || 0) + 1);
    });
    
    // Expand query with synonyms
    terms.forEach((freq, term) => {
      expandedTerms.set(term, freq);
      
      // Add synonyms with reduced weight
      const synonyms = this.synonymDict.get(term) || [];
      synonyms.forEach(synonym => {
        const synonymWeight = freq * 0.7; // Reduce synonym weight
        expandedTerms.set(synonym, 
          Math.max(expandedTerms.get(synonym) || 0, synonymWeight)
        );
      });
      
      // Add semantic variations (simplified)
      const variations = this.generateSemanticVariations(term);
      variations.forEach(variation => {
        const variationWeight = freq * 0.5;
        expandedTerms.set(variation, 
          Math.max(expandedTerms.get(variation) || 0, variationWeight)
        );
      });
    });
    
    // Normalize
    const totalTerms = Array.from(expandedTerms.values()).reduce((sum, freq) => sum + freq, 0);
    expandedTerms.forEach((freq, term) => {
      expandedTerms.set(term, freq / totalTerms);
    });
    
    // Calculate magnitude
    const magnitude = Math.sqrt(
      Array.from(expandedTerms.values()).reduce((sum, tf) => sum + tf * tf, 0)
    );
    
    return { terms, expandedTerms, magnitude };
  }

  private generateSemanticVariations(term: string): string[] {
    const variations: string[] = [];
    
    // Add plural/singular forms (simplified)
    if (term.endsWith('s') && term.length > 3) {
      variations.push(term.slice(0, -1));
    } else {
      variations.push(term + 's');
    }
    
    // Add Korean conjugations (very simplified)
    if (/[가-힣]/.test(term)) {
      if (term.endsWith('다')) {
        variations.push(term.slice(0, -1) + '기');
        variations.push(term.slice(0, -1) + '는');
      }
    }
    
    return variations;
  }

  private calculateIDF() {
    this.context.termDocumentFreq.forEach((docFreq, term) => {
      // IDF = log(total documents / documents containing term)
      const idf = Math.log(this.context.totalDocuments / docFreq);
      
      // Update document vectors with TF-IDF scores
      this.context.documentVectors.forEach(docVector => {
        if (docVector.terms.has(term)) {
          const tf = docVector.terms.get(term)!;
          const tfidf = tf * idf;
          docVector.terms.set(term, tfidf);
        }
      });
    });
    
    // Recalculate magnitudes after TF-IDF transformation
    this.context.documentVectors.forEach(docVector => {
      docVector.magnitude = Math.sqrt(
        Array.from(docVector.terms.values()).reduce((sum, tfidf) => sum + tfidf * tfidf, 0)
      );
    });
  }

  private async findMatchingSentences(queryVector: QueryVector, chunkSize: number): Promise<MatchedSentence[]> {
    const sentences: MatchedSentence[] = [];
    
    // Process sections in chunks
    const sections = this.context.documentStructure.sections;
    
    for (let i = 0; i < sections.length; i += chunkSize) {
      const chunk = sections.slice(i, i + chunkSize);
      
      await Promise.resolve(); // Allow for async processing
      
      chunk.forEach(section => {
        const sectionSentences = this.extractSentencesFromSection(section);
        
        sectionSentences.forEach(sentence => {
          const similarity = this.calculateSentenceSimilarity(sentence.content, queryVector);
          
          if (similarity > 0.3) { // Threshold for relevance
            sentences.push({
              ...sentence,
              similarity,
              matchType: this.determineMatchType(similarity),
              matchedTerms: this.findMatchedTerms(sentence.content, queryVector)
            });
          }
        });
      });
    }
    
    return sentences
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // Top 20 sentences
  }

  private extractSentencesFromSection(section: Section): Omit<MatchedSentence, 'similarity' | 'matchType' | 'matchedTerms'>[] {
    const sentences = section.content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    return sentences.map((sentence, index) => ({
      id: `${section.id}-sentence-${index}`,
      content: sentence.trim(),
      bounds: section.bounds, // Simplified - would need actual sentence bounds
      context: this.extractContext(sentence, section.content),
      sectionId: section.id
    }));
  }

  private extractContext(sentence: string, fullText: string): string {
    const sentenceIndex = fullText.indexOf(sentence);
    const contextStart = Math.max(0, sentenceIndex - 100);
    const contextEnd = Math.min(fullText.length, sentenceIndex + sentence.length + 100);
    
    return fullText.substring(contextStart, contextEnd);
  }

  private calculateSentenceSimilarity(sentence: string, queryVector: QueryVector): number {
    const sentenceVector = this.createSentenceVector(sentence);
    return this.calculateCosineSimilarity(sentenceVector.terms, queryVector.expandedTerms);
  }

  private createSentenceVector(sentence: string): { terms: Map<string, number> } {
    const terms = new Map<string, number>();
    const words = this.preprocessText(sentence).split(/\s+/).filter(word => 
      word.length > 1 && !this.stopWords.has(word)
    );
    
    words.forEach(word => {
      terms.set(word, (terms.get(word) || 0) + 1);
    });
    
    // Normalize
    const totalWords = words.length;
    terms.forEach((count, term) => {
      terms.set(term, count / totalWords);
    });
    
    return { terms };
  }

  private calculateCosineSimilarity(vec1: Map<string, number>, vec2: Map<string, number>): number {
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    const allTerms = new Set([...vec1.keys(), ...vec2.keys()]);
    
    allTerms.forEach(term => {
      const val1 = vec1.get(term) || 0;
      const val2 = vec2.get(term) || 0;
      
      dotProduct += val1 * val2;
      magnitude1 += val1 * val1;
      magnitude2 += val2 * val2;
    });
    
    const magnitude = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  private determineMatchType(similarity: number): MatchedSentence['matchType'] {
    if (similarity >= 0.9) return 'exact';
    if (similarity >= 0.7) return 'semantic';
    if (similarity >= 0.5) return 'fuzzy';
    return 'contextual';
  }

  private findMatchedTerms(text: string, queryVector: QueryVector): string[] {
    const textWords = this.preprocessText(text).split(/\s+/);
    const matchedTerms: string[] = [];
    
    queryVector.terms.forEach((_, term) => {
      if (textWords.includes(term)) {
        matchedTerms.push(term);
      }
    });
    
    return matchedTerms;
  }

  private async findMatchingPhrases(queryVector: QueryVector, chunkSize: number): Promise<MatchedPhrase[]> {
    const phrases: MatchedPhrase[] = [];
    
    // Extract phrases from query
    const queryPhrases = this.extractPhrasesFromText(
      Array.from(queryVector.terms.keys()).join(' ')
    );
    
    // Find matching phrases in document
    const sections = this.context.documentStructure.sections;
    
    for (let i = 0; i < sections.length; i += chunkSize) {
      const chunk = sections.slice(i, i + chunkSize);
      
      await Promise.resolve();
      
      chunk.forEach(section => {
        const sectionPhrases = this.extractPhrasesFromText(section.content);
        
        queryPhrases.forEach(queryPhrase => {
          sectionPhrases.forEach(sectionPhrase => {
            const similarity = this.calculatePhraseSimilarity(queryPhrase, sectionPhrase);
            
            if (similarity > 0.4) {
              phrases.push({
                id: `${section.id}-phrase-${phrases.length}`,
                content: sectionPhrase,
                similarity,
                bounds: section.bounds,
                context: this.extractContext(sectionPhrase, section.content),
                importance: section.importance,
                matchedQuery: queryPhrase
              });
            }
          });
        });
      });
    }
    
    return phrases
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 15);
  }

  private extractPhrasesFromText(text: string): string[] {
    const words = this.preprocessText(text).split(/\s+/).filter(word => 
      word.length > 1 && !this.stopWords.has(word)
    );
    
    const phrases: string[] = [];
    
    // Extract 2-4 word phrases
    for (let n = 2; n <= Math.min(4, words.length); n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(' ');
        phrases.push(phrase);
      }
    }
    
    return phrases;
  }

  private calculatePhraseSimilarity(phrase1: string, phrase2: string): number {
    // Use n-gram similarity for phrases
    return this.calculateNgramSimilarity(phrase1, phrase2, 2);
  }

  private calculateNgramSimilarity(text1: string, text2: string, n: number): number {
    const ngrams1 = this.generateNgrams(text1, n);
    const ngrams2 = this.generateNgrams(text2, n);
    
    const set1 = new Set(ngrams1);
    const set2 = new Set(ngrams2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private generateNgrams(text: string, n: number): string[] {
    if (text.length < n) return [text];
    
    const ngrams: string[] = [];
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.substring(i, i + n));
    }
    
    return ngrams;
  }

  private async findMatchingKeywords(queryVector: QueryVector): Promise<MatchedKeyword[]> {
    const keywords: MatchedKeyword[] = [];
    
    queryVector.terms.forEach((queryWeight, queryTerm) => {
      const positions: TextPosition[] = [];
      let totalFrequency = 0;
      let maxSimilarity = 0;
      const semanticVariants: string[] = [];
      
      // Find keyword in document sections
      this.context.documentStructure.sections.forEach(section => {
        const sectionText = this.preprocessText(section.content);
        const termFreq = this.countTermFrequency(sectionText, queryTerm);
        
        if (termFreq > 0) {
          positions.push({
            bounds: section.bounds,
            pageNumber: 1, // Simplified
            sectionId: section.id,
            context: this.extractKeywordContext(sectionText, queryTerm)
          });
          
          totalFrequency += termFreq;
          
          // Calculate similarity based on section importance and term frequency
          const similarity = (termFreq / sectionText.split(/\s+/).length) * section.importance;
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }
        
        // Find semantic variants
        const variants = this.findSemanticVariants(sectionText, queryTerm);
        semanticVariants.push(...variants);
      });
      
      if (totalFrequency > 0) {
        keywords.push({
          id: `keyword-${queryTerm}`,
          keyword: queryTerm,
          similarity: maxSimilarity,
          frequency: totalFrequency,
          positions,
          importance: queryWeight,
          semanticVariants: Array.from(new Set(semanticVariants))
        });
      }
    });
    
    return keywords.sort((a, b) => b.similarity - a.similarity);
  }

  private countTermFrequency(text: string, term: string): number {
    const words = text.split(/\s+/);
    return words.filter(word => word === term).length;
  }

  private extractKeywordContext(text: string, keyword: string): string {
    const keywordIndex = text.indexOf(keyword);
    if (keywordIndex === -1) return '';
    
    const contextStart = Math.max(0, keywordIndex - 50);
    const contextEnd = Math.min(text.length, keywordIndex + keyword.length + 50);
    
    return text.substring(contextStart, contextEnd);
  }

  private findSemanticVariants(text: string, term: string): string[] {
    const variants: string[] = [];
    const words = text.split(/\s+/);
    
    // Find similar words using simple similarity
    words.forEach(word => {
      if (word !== term && this.areWordsSimilar(term, word)) {
        variants.push(word);
      }
    });
    
    return variants;
  }

  private areWordsSimilar(word1: string, word2: string): boolean {
    // Simple similarity check
    const similarity = this.calculateLevenshteinSimilarity(word1, word2);
    return similarity > 0.7;
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    
    if (maxLength === 0) return 1.0;
    return 1 - (distance / maxLength);
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  private async findMatchingEntities(queryVector: QueryVector, originalQuery: string): Promise<MatchedEntity[]> {
    const entities: MatchedEntity[] = [];
    
    // Extract entities from query
    const queryEntities = this.extractEntities(originalQuery);
    
    // Find matching entities in document sections
    this.context.documentStructure.sections.forEach(section => {
      const sectionEntities = this.extractEntities(section.content);
      
      queryEntities.forEach(queryEntity => {
        sectionEntities.forEach(sectionEntity => {
          if (queryEntity.type === sectionEntity.type) {
            const similarity = this.calculateEntitySimilarity(queryEntity, sectionEntity);
            
            if (similarity > 0.5) {
              entities.push({
                id: `${section.id}-entity-${entities.length}`,
                text: sectionEntity.text,
                type: sectionEntity.type,
                similarity,
                bounds: section.bounds,
                context: this.extractContext(sectionEntity.text, section.content),
                confidence: sectionEntity.confidence
              });
            }
          }
        });
      });
    });
    
    return entities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
  }

  private extractEntities(text: string): Array<{ text: string; type: MatchedEntity['type']; confidence: number }> {
    const entities: Array<{ text: string; type: MatchedEntity['type']; confidence: number }> = [];
    
    // Technical terms
    const technicalPatterns = [
      /\b(API|REST|GraphQL|JSON|XML|HTTP|HTTPS|URL|URI|SDK|CLI|GUI|UI|UX|AI|ML|DL|NLP|LLM|GPT)\b/gi,
      /\b(React|Vue|Angular|Node\.js|Python|JavaScript|TypeScript|Java|Go|Rust|C\+\+|SQL|NoSQL)\b/gi
    ];
    
    technicalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'technical',
          confidence: 0.9
        });
      }
    });
    
    // Organizations
    const orgPatterns = [
      /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc|Corp|Ltd|LLC|Company|Corporation|University|Institute)\b/g,
      /([가-힣]+)(?:회사|기업|그룹|대학교|대학|연구소|연구원)\b/g
    ];
    
    orgPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          text: match[0],
          type: 'organization',
          confidence: 0.8
        });
      }
    });
    
    // Dates and numbers
    const datePattern = /\b\d{4}[-년]\d{1,2}[-월]\d{1,2}일?\b/g;
    let match;
    while ((match = datePattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type: 'date',
        confidence: 0.95
      });
    }
    
    return entities;
  }

  private calculateEntitySimilarity(entity1: any, entity2: any): number {
    return this.calculateLevenshteinSimilarity(entity1.text.toLowerCase(), entity2.text.toLowerCase());
  }

  private calculateOverallRelevance(
    sentences: MatchedSentence[],
    phrases: MatchedPhrase[],
    keywords: MatchedKeyword[],
    entities: MatchedEntity[]
  ): number {
    // Weighted average of different match types
    const sentenceScore = sentences.length > 0 ? 
      sentences.slice(0, 5).reduce((sum, s) => sum + s.similarity, 0) / Math.min(5, sentences.length) : 0;
    
    const phraseScore = phrases.length > 0 ? 
      phrases.slice(0, 5).reduce((sum, p) => sum + p.similarity, 0) / Math.min(5, phrases.length) : 0;
    
    const keywordScore = keywords.length > 0 ? 
      keywords.slice(0, 5).reduce((sum, k) => sum + k.similarity, 0) / Math.min(5, keywords.length) : 0;
    
    const entityScore = entities.length > 0 ? 
      entities.slice(0, 3).reduce((sum, e) => sum + e.similarity, 0) / Math.min(3, entities.length) : 0;
    
    // Weighted combination
    return (sentenceScore * 0.4 + phraseScore * 0.3 + keywordScore * 0.2 + entityScore * 0.1);
  }
}

// Factory function
export function createSemanticMatcher(semanticMatchingCallback: MatchingProgressCallback): SemanticMatcher {
  return new SemanticMatcher(semanticMatchingCallback);
}