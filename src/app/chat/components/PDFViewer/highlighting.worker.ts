// Web Worker for PDF Highlighting Performance Optimization
// This worker handles intensive highlighting computations off the main thread

interface HighlightingMessage {
  type: 'ANALYZE_DOCUMENT' | 'SEMANTIC_MATCH' | 'STRUCTURE_ANALYSIS' | 'PROGRESS_UPDATE';
  payload: any;
  taskId: string;
}

interface DocumentChunk {
  id: string;
  text: string;
  bounds: DOMRect;
  pageNumber: number;
  sectionType: 'title' | 'paragraph' | 'table' | 'list' | 'footnote';
  importance: number;
}

interface SemanticMatchResult {
  chunkId: string;
  similarity: number;
  matchType: 'exact' | 'semantic' | 'fuzzy' | 'contextual';
  confidence: number;
  matchedTerms: string[];
}

interface DocumentStructure {
  chunks: DocumentChunk[];
  sections: Section[];
  tables: TableInfo[];
  lists: ListInfo[];
  headers: HeaderInfo[];
  totalProcessingTime: number;
}

interface Section {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'footnote';
  level: number;
  text: string;
  bounds: DOMRect;
  pageNumber: number;
  children: Section[];
  importance: number;
}

interface TableInfo {
  id: string;
  bounds: DOMRect;
  pageNumber: number;
  rows: number;
  columns: number;
  cells: string[][];
  importance: number;
}

interface ListInfo {
  id: string;
  type: 'ordered' | 'unordered';
  bounds: DOMRect;
  pageNumber: number;
  items: string[];
  importance: number;
}

interface HeaderInfo {
  id: string;
  level: number;
  text: string;
  bounds: DOMRect;
  pageNumber: number;
  importance: number;
}

// TF-IDF 계산을 위한 유틸리티
class TFIDFCalculator {
  private documents: string[] = [];
  private vocabulary: Set<string> = new Set();
  private idfCache: Map<string, number> = new Map();

  constructor(documents: string[]) {
    this.documents = documents;
    this.buildVocabulary();
    this.calculateIDF();
  }

  private buildVocabulary() {
    this.documents.forEach(doc => {
      const words = this.tokenize(doc);
      words.forEach(word => this.vocabulary.add(word));
    });
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  private calculateIDF() {
    for (const term of this.vocabulary) {
      const documentsWithTerm = this.documents.filter(doc => 
        this.tokenize(doc).includes(term)
      ).length;
      
      const idf = Math.log(this.documents.length / (documentsWithTerm || 1));
      this.idfCache.set(term, idf);
    }
  }

  public calculateTFIDF(document: string, queryTerms: string[]): number {
    const docWords = this.tokenize(document);
    const termFreqs = new Map<string, number>();
    
    // Calculate TF
    docWords.forEach(word => {
      termFreqs.set(word, (termFreqs.get(word) || 0) + 1);
    });

    let tfidfScore = 0;
    queryTerms.forEach(term => {
      const tf = termFreqs.get(term.toLowerCase()) || 0;
      const idf = this.idfCache.get(term.toLowerCase()) || 0;
      tfidfScore += (tf / docWords.length) * idf;
    });

    return tfidfScore;
  }
}

// Cosine similarity calculation
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// N-gram based similarity
function ngramSimilarity(text1: string, text2: string, n: number = 2): number {
  const ngrams1 = generateNgrams(text1, n);
  const ngrams2 = generateNgrams(text2, n);
  
  const set1 = new Set(ngrams1);
  const set2 = new Set(ngrams2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

function generateNgrams(text: string, n: number): string[] {
  const normalized = text.toLowerCase().replace(/[^\w가-힣\s]/g, '');
  if (normalized.length < n) return [normalized];
  
  const ngrams: string[] = [];
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.push(normalized.substring(i, i + n));
  }
  return ngrams;
}

// Document structure analysis
function analyzeDocumentStructure(textContent: any, pageNumber: number): DocumentStructure {
  const startTime = performance.now();
  
  const chunks: DocumentChunk[] = [];
  const sections: Section[] = [];
  const tables: TableInfo[] = [];
  const lists: ListInfo[] = [];
  const headers: HeaderInfo[] = [];

  // Process text items from PDF.js textContent
  if (textContent && textContent.items) {
    textContent.items.forEach((item: any, index: number) => {
      const text = item.str?.trim();
      if (!text || text.length < 2) return;

      // Determine section type based on font size, position, and content
      const sectionType = determineSectionType(item, textContent.items, index);
      const importance = calculateImportance(item, sectionType, text);

      // Create chunk
      const chunk: DocumentChunk = {
        id: `chunk-${pageNumber}-${index}`,
        text,
        bounds: item.transform ? transformToBounds(item.transform) : new DOMRect(),
        pageNumber,
        sectionType,
        importance
      };

      chunks.push(chunk);

      // Create section if it's a header
      if (sectionType === 'title') {
        const header: HeaderInfo = {
          id: `header-${pageNumber}-${index}`,
          level: determineHeaderLevel(item),
          text,
          bounds: chunk.bounds,
          pageNumber,
          importance
        };
        headers.push(header);
      }
    });
  }

  const endTime = performance.now();
  
  return {
    chunks,
    sections,
    tables,
    lists,
    headers,
    totalProcessingTime: endTime - startTime
  };
}

function determineSectionType(item: any, allItems: any[], index: number): 'title' | 'paragraph' | 'table' | 'list' | 'footnote' {
  const text = item.str?.trim() || '';
  const fontSize = item.height || 12;
  const avgFontSize = allItems.reduce((sum: number, itm: any) => sum + (itm.height || 12), 0) / allItems.length;
  
  // Title detection
  if (fontSize > avgFontSize * 1.2 && text.length < 100) {
    return 'title';
  }
  
  // List detection
  if (/^[\d\w]*[\.\)\-]\s+/.test(text) || /^[•◦▪▫]\s+/.test(text)) {
    return 'list';
  }
  
  // Footnote detection
  if (fontSize < avgFontSize * 0.9 && item.transform && item.transform[5] < 100) {
    return 'footnote';
  }
  
  return 'paragraph';
}

function determineHeaderLevel(item: any): number {
  const fontSize = item.height || 12;
  if (fontSize > 18) return 1;
  if (fontSize > 16) return 2;
  if (fontSize > 14) return 3;
  return 4;
}

function calculateImportance(item: any, sectionType: string, text: string): number {
  let importance = 0;
  
  // Base importance by section type
  switch (sectionType) {
    case 'title': importance = 1.0; break;
    case 'paragraph': importance = 0.6; break;
    case 'list': importance = 0.7; break;
    case 'table': importance = 0.8; break;
    case 'footnote': importance = 0.3; break;
  }
  
  // Adjust by text length
  const lengthFactor = Math.min(text.length / 200, 1.0) * 0.2;
  importance += lengthFactor;
  
  // Adjust by font size
  const fontSize = item.height || 12;
  if (fontSize > 14) importance += 0.1;
  
  return Math.min(importance, 1.0);
}

function transformToBounds(transform: number[]): DOMRect {
  // PDF.js transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
  return new DOMRect(
    transform[4] || 0,  // x
    transform[5] || 0,  // y
    transform[0] || 100, // width (approximate)
    transform[3] || 12   // height (approximate)
  );
}

// Semantic matching with chunking
function performSemanticMatching(
  chunks: DocumentChunk[],
  searchText: string,
  chunkSize: number = 10
): SemanticMatchResult[] {
  const results: SemanticMatchResult[] = [];
  const searchTerms = searchText.toLowerCase().split(/\s+/).filter(term => term.length > 1);
  
  // Create TF-IDF calculator
  const documents = chunks.map(chunk => chunk.text);
  const tfidf = new TFIDFCalculator(documents);
  
  // Process chunks in batches
  for (let i = 0; i < chunks.length; i += chunkSize) {
    const batchChunks = chunks.slice(i, i + chunkSize);
    
    batchChunks.forEach(chunk => {
      // Calculate different similarity metrics
      const exactMatch = calculateExactMatch(chunk.text, searchText);
      const semanticScore = tfidf.calculateTFIDF(chunk.text, searchTerms);
      const ngramScore = ngramSimilarity(chunk.text, searchText, 2);
      const fuzzyScore = calculateFuzzyMatch(chunk.text, searchText);
      
      // Determine best match type and confidence
      let matchType: 'exact' | 'semantic' | 'fuzzy' | 'contextual' = 'contextual';
      let confidence = 0;
      
      if (exactMatch > 0.9) {
        matchType = 'exact';
        confidence = exactMatch;
      } else if (semanticScore > 0.3) {
        matchType = 'semantic';
        confidence = semanticScore;
      } else if (fuzzyScore > 0.7) {
        matchType = 'fuzzy';
        confidence = fuzzyScore;
      } else if (ngramScore > 0.4) {
        matchType = 'contextual';
        confidence = ngramScore;
      }
      
      // Apply importance weighting
      confidence *= chunk.importance;
      
      if (confidence > 0.2) { // Minimum threshold
        results.push({
          chunkId: chunk.id,
          similarity: confidence,
          matchType,
          confidence,
          matchedTerms: findMatchedTerms(chunk.text, searchTerms)
        });
      }
    });
    
    // Report progress
    postMessage({
      type: 'PROGRESS_UPDATE',
      payload: {
        progress: ((i + chunkSize) / chunks.length) * 100,
        message: `Processing chunks ${i + 1}-${Math.min(i + chunkSize, chunks.length)} of ${chunks.length}`
      }
    });
  }
  
  return results.sort((a, b) => b.confidence - a.confidence);
}

function calculateExactMatch(text: string, searchText: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedSearch = searchText.toLowerCase();
  
  if (normalizedText.includes(normalizedSearch)) {
    return searchText.length / text.length;
  }
  
  return 0;
}

function calculateFuzzyMatch(text: string, searchText: string): number {
  // Simple Levenshtein-based fuzzy matching
  const words1 = text.toLowerCase().split(/\s+/);
  const words2 = searchText.toLowerCase().split(/\s+/);
  
  let maxSimilarity = 0;
  
  words2.forEach(searchWord => {
    words1.forEach(textWord => {
      const similarity = 1 - (levenshteinDistance(textWord, searchWord) / Math.max(textWord.length, searchWord.length));
      maxSimilarity = Math.max(maxSimilarity, similarity);
    });
  });
  
  return maxSimilarity;
}

function levenshteinDistance(str1: string, str2: string): number {
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

function findMatchedTerms(text: string, searchTerms: string[]): string[] {
  const textWords = text.toLowerCase().split(/\s+/);
  const matchedTerms: string[] = [];
  
  searchTerms.forEach(term => {
    if (textWords.some(word => word.includes(term) || term.includes(word))) {
      matchedTerms.push(term);
    }
  });
  
  return matchedTerms;
}

// Main message handler
self.addEventListener('message', (event: MessageEvent<HighlightingMessage>) => {
  const { type, payload, taskId } = event.data;
  
  try {
    switch (type) {
      case 'ANALYZE_DOCUMENT':
        { postMessage({
          type: 'PROGRESS_UPDATE',
          payload: { progress: 10, message: '문서 구조 분석 중...' }
        });
        
        const structure = analyzeDocumentStructure(payload.textContent, payload.pageNumber);
        
        postMessage({
          type: 'STRUCTURE_ANALYSIS',
          payload: { structure, taskId },
          taskId
        });
        break; }
      
      case 'SEMANTIC_MATCH':
        { postMessage({
          type: 'PROGRESS_UPDATE',
          payload: { progress: 50, message: '의미적 매칭 수행 중...' }
        });
        
        const matches = performSemanticMatching(
          payload.chunks,
          payload.searchText,
          payload.chunkSize || 10
        );
        
        postMessage({
          type: 'SEMANTIC_MATCH',
          payload: { matches, taskId },
          taskId
        });
        break; }
      
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    postMessage({
      type: 'ERROR',
      payload: { error: error instanceof Error ? error.message : 'Unknown error', taskId },
      taskId
    });
  }
});

export {};