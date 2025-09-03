// Worker Manager for Highlighting Operations
// Handles Web Worker lifecycle and communication

import { HighlightingStep } from './HighlightingProgressIndicator';

interface WorkerTask {
  id: string;
  type: 'ANALYZE_DOCUMENT' | 'SEMANTIC_MATCH' | 'STRUCTURE_ANALYSIS';
  payload: any;
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout?: NodeJS.Timeout;
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

export interface HighlightingProgress {
  currentStep: string;
  progress: number;
  message: string;
  totalSteps: number;
  completedSteps: number;
}

export type ProgressCallback = (progress: HighlightingProgress) => void;
export type StepUpdateCallback = (steps: HighlightingStep[]) => void;

class HighlightingWorkerManager {
  private pendingTasks = new Map<string, WorkerTask>();
  private isInitialized = false;
  private taskCounter = 0;
  private currentSteps: HighlightingStep[] = [];
  
  // Callbacks
  private progressCallback: ProgressCallback | null = null;
  private stepUpdateCallback: StepUpdateCallback | null = null;

  constructor() {
    this.initializeWorker();
  }

  private async initializeWorker() {
    // Skip worker initialization - use sync processing for better compatibility
    this.isInitialized = true;
  }



  private handleProgressUpdate(progressData: { progress: number; message: string }) {
    if (this.progressCallback) {
      this.progressCallback({
        currentStep: this.getCurrentStepId(),
        progress: progressData.progress,
        message: progressData.message,
        totalSteps: this.currentSteps.length,
        completedSteps: this.currentSteps.filter(s => s.status === 'completed').length
      });
    }
    
    // Update current step progress
    this.updateCurrentStepProgress(progressData.progress);
  }


  private getCurrentStepId(): string {
    const currentStep = this.currentSteps.find(s => s.status === 'in_progress');
    return currentStep?.id || '';
  }

  private updateCurrentStepProgress(progress: number) {
    const currentStepIndex = this.currentSteps.findIndex(s => s.status === 'in_progress');
    if (currentStepIndex >= 0) {
      this.currentSteps[currentStepIndex].progress = progress;
      this.notifyStepUpdate();
    }
  }

  private markStepCompleted(taskId: string) {
    const stepIndex = this.currentSteps.findIndex(s => s.id === taskId);
    if (stepIndex >= 0) {
      this.currentSteps[stepIndex].status = 'completed';
      this.currentSteps[stepIndex].progress = 100;
      this.currentSteps[stepIndex].duration = Date.now() - (this.currentSteps[stepIndex] as any).startTime;
      
      // Start next step
      const nextStepIndex = this.currentSteps.findIndex(s => s.status === 'pending');
      if (nextStepIndex >= 0) {
        this.currentSteps[nextStepIndex].status = 'in_progress';
        (this.currentSteps[nextStepIndex] as any).startTime = Date.now();
      }
      
      this.notifyStepUpdate();
    }
  }

  private markStepError(taskId: string) {
    const stepIndex = this.currentSteps.findIndex(s => s.id === taskId);
    if (stepIndex >= 0) {
      this.currentSteps[stepIndex].status = 'error';
      this.notifyStepUpdate();
    }
  }

  private notifyStepUpdate() {
    if (this.stepUpdateCallback) {
      this.stepUpdateCallback([...this.currentSteps]);
    }
  }

  public setProgressCallback(callback: ProgressCallback) {
    this.progressCallback = callback;
  }

  public setStepUpdateCallback(callback: StepUpdateCallback) {
    this.stepUpdateCallback = callback;
  }


  private createTask<T>(
    type: WorkerTask['type'],
    payload: any
  ): Promise<T> {
    // Use synchronous processing instead of Web Worker
    return new Promise<T>((resolve, reject) => {
      setTimeout(async () => {
        try {
          let result: any;
          
          switch (type) {
            case 'ANALYZE_DOCUMENT':
              // Import and use document analyzer directly
              { const { createDocumentAnalyzer } = await import('./documentAnalyzer');
              const analyzer = createDocumentAnalyzer();
              const structure = analyzer.analyzeDocumentStructure(
                { getViewport: () => ({ width: 800, height: 600 }) },
                payload.textContent
              );
              result = { structure };
              break; }
              
            case 'SEMANTIC_MATCH':
              // Use simple matching algorithm
              { const matches = this.performSimpleSemanticMatching(
                payload.chunks || [],
                payload.searchText,
                payload.chunkSize || 10
              );
              result = { matches };
              break; }
              
            default:
              throw new Error(`Unknown task type: ${type}`);
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, 10); // Small delay to prevent blocking
    });
  }

  private performSimpleSemanticMatching(
    chunks: DocumentChunk[],
    searchText: string,
    chunkSize: number
  ): SemanticMatchResult[] {
    const searchWords = searchText.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const results: SemanticMatchResult[] = [];

    chunks.forEach((chunk, index) => {
      const chunkText = chunk.text.toLowerCase();
      let score = 0;
      const matchedTerms: string[] = [];

      // Simple word matching
      searchWords.forEach(word => {
        if (chunkText.includes(word)) {
          score += 1;
          matchedTerms.push(word);
        }
      });

      if (score > 0) {
        const confidence = Math.min(score / searchWords.length, 1.0) * chunk.importance;
        results.push({
          chunkId: chunk.id,
          similarity: confidence,
          matchType: confidence > 0.8 ? 'exact' : confidence > 0.5 ? 'semantic' : 'fuzzy',
          confidence,
          matchedTerms
        });
      }

      // Update progress
      if (index % chunkSize === 0) {
        const progress = (index / chunks.length) * 100;
        this.handleProgressUpdate({ progress, message: `Processing chunk ${index + 1}/${chunks.length}` });
      }
    });

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  public async analyzeDocumentStructure(
    textContent: any,
    pageNumber: number
  ): Promise<DocumentStructure> {
    return this.createTask<{ structure: DocumentStructure }>('ANALYZE_DOCUMENT', {
      textContent,
      pageNumber
    }).then(result => result.structure);
  }

  public async performSemanticMatching(
    chunks: DocumentChunk[],
    searchText: string,
    chunkSize: number = 10
  ): Promise<SemanticMatchResult[]> {
    return this.createTask<{ matches: SemanticMatchResult[] }>('SEMANTIC_MATCH', {
      chunks,
      searchText,
      chunkSize
    }).then(result => result.matches);
  }

  public initializeSteps(_searchText: string): HighlightingStep[] {
    this.currentSteps = [
      {
        id: 'structure-analysis',
        name: '문서 구조 분석',
        description: 'PDF 문서의 제목, 단락, 표, 목록 등을 분석합니다',
        status: 'in_progress',
        progress: 0
      },
      {
        id: 'text-processing',
        name: '텍스트 전처리',
        description: '검색 텍스트를 분석하고 키워드를 추출합니다',
        status: 'pending',
        progress: 0
      },
      {
        id: 'semantic-matching',
        name: '의미적 매칭',
        description: 'TF-IDF와 코사인 유사도를 사용하여 관련 텍스트를 찾습니다',
        status: 'pending',
        progress: 0
      },
      {
        id: 'fuzzy-matching',
        name: '퍼지 매칭',
        description: '유사한 단어와 구문을 찾습니다',
        status: 'pending',
        progress: 0
      },
      {
        id: 'context-analysis',
        name: '문맥 분석',
        description: '주변 텍스트의 맥락을 고려하여 관련성을 평가합니다',
        status: 'pending',
        progress: 0
      },
      {
        id: 'highlight-ranking',
        name: '하이라이트 순위 결정',
        description: '신뢰도와 중요도에 따라 하이라이트 순위를 결정합니다',
        status: 'pending',
        progress: 0
      }
    ];

    // Mark first step as started
    (this.currentSteps[0] as any).startTime = Date.now();
    
    this.notifyStepUpdate();
    return [...this.currentSteps];
  }

  public cancelCurrentOperation() {
    // Cancel all pending tasks
    this.pendingTasks.forEach(task => {
      if (task.timeout) {
        clearTimeout(task.timeout);
      }
      task.reject(new Error('Operation cancelled'));
    });
    this.pendingTasks.clear();

    // Reset steps
    this.currentSteps = [];
    this.notifyStepUpdate();
  }

  public destroy() {
    this.cancelCurrentOperation();
    this.isInitialized = false;
  }
}

// Singleton instance
let workerManager: HighlightingWorkerManager | null = null;

export function getHighlightingWorkerManager(): HighlightingWorkerManager {
  if (!workerManager) {
    workerManager = new HighlightingWorkerManager();
  }
  return workerManager;
}

export function destroyHighlightingWorkerManager() {
  if (workerManager) {
    workerManager.destroy();
    workerManager = null;
  }
}

export type { DocumentChunk, SemanticMatchResult, DocumentStructure, Section, TableInfo, ListInfo, HeaderInfo };