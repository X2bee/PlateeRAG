'use client';

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { HighlightRange } from '../../types/source';
import highlightStyles from './HighlightStyles.module.scss';
import { HighlightingStep, HighlightingProgressIndicator } from './HighlightingProgressIndicator';
import { 
  getHighlightingWorkerManager, 
  HighlightingProgress
} from './highlightingWorkerManager';
import { createDocumentAnalyzer, DocumentStructure, AnalysisProgressCallback } from './documentAnalyzer';
import { createSemanticMatcher, SemanticMatchResult, MatchingProgressCallback } from './semanticMatcher';
import { 
  defaultHighlightConfig, 
  mergeHighlightConfig,
  HighlightConfig,
  HighlightResult,
  HighlightLevel,
  getHighlightClassName, 
  getPriorityClassName 
} from './highlightConfig';

interface ProcessingState {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  error: string | null;
  steps: HighlightingStep[];
  results: {
    documentStructure: DocumentStructure | null;
    semanticMatches: SemanticMatchResult | null;
    appliedHighlights: HighlightResult[];
  };
}

export interface AdvancedHighlighterProps {
  pageNumber: number;
  highlightRange: HighlightRange;
  scale: number;
  pageWidth: number;
  pageHeight: number;
  textContent?: any;
  highlightOptions?: Partial<HighlightConfig>;
  onHighlightClick?: (highlight: HighlightInfo) => void;
  onProgressChange?: (progress: HighlightingProgress) => void;
  enableAsyncProcessing?: boolean;
}

export interface HighlightInfo {
  id: string;
  text: string;
  level: HighlightLevel;
  confidence: number;
  bounds: DOMRect;
  matchedBy: string;
  context?: string;
}


const AdvancedPDFHighlighter: React.FC<AdvancedHighlighterProps> = ({
  pageNumber,
  highlightRange,
  scale,
  pageWidth,
  pageHeight,
  textContent,
  highlightOptions = {},
  onHighlightClick,
  onProgressChange,
  enableAsyncProcessing = true
}) => {
  const [highlightingSteps, setHighlightingSteps] = useState<HighlightingStep[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    currentStep: '',
    progress: 0,
    error: null,
    steps: [],
    results: {
      documentStructure: null,
      semanticMatches: null,
      appliedHighlights: []
    }
  });

  const workerManagerRef = useRef(getHighlightingWorkerManager());
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize steps
  const initialSteps: HighlightingStep[] = [
    { id: 'document-analysis', name: '문서 구조 분석', description: 'PDF 페이지의 레이아웃과 구조를 분석합니다', status: 'pending' },
    { id: 'semantic-matching', name: '의미적 매칭', description: '응답 내용과 문서 내용을 의미적으로 비교합니다', status: 'pending' },
    { id: 'highlight-generation', name: '하이라이트 생성', description: '매칭 결과를 바탕으로 하이라이트를 생성합니다', status: 'pending' },
    { id: 'highlight-application', name: '하이라이트 적용', description: '생성된 하이라이트를 화면에 적용합니다', status: 'pending' }
  ];

  // Create analyzers with progress callbacks
  const documentAnalysisCallback: AnalysisProgressCallback = useCallback((step: string, progress: number, details?: any) => {
    setHighlightingSteps(prev => 
      prev.map(s => s.id === 'document-analysis' 
        ? { ...s, status: 'in_progress' as const, progress, description: step }
        : s
      )
    );
  }, []);

  const semanticMatchingCallback: MatchingProgressCallback = useCallback((step: string, progress: number, details?: any) => {
    setHighlightingSteps(prev => 
      prev.map(s => s.id === 'semantic-matching' 
        ? { ...s, status: 'in_progress' as const, progress, description: step }
        : s
      )
    );
  }, []);

  const documentAnalyzerRef = useRef(createDocumentAnalyzer(documentAnalysisCallback));
  const semanticMatcherRef = useRef(createSemanticMatcher(semanticMatchingCallback));
  const configRef = useRef(mergeHighlightConfig(defaultHighlightConfig, highlightOptions));

  // Current page should be highlighted
  const shouldHighlight = pageNumber === highlightRange.pageNumber;

  // Setup worker callbacks
  useEffect(() => {
    const workerManager = workerManagerRef.current;
    
    workerManager.setProgressCallback((progress: HighlightingProgress) => {
      setProcessingState((prev: ProcessingState) => ({
        ...prev,
        currentStep: progress.currentStep,
        progress: progress.progress
      }));
      
      onProgressChange?.(progress);
    });

    workerManager.setStepUpdateCallback((steps: HighlightingStep[]) => {
      setHighlightingSteps(steps);
    });

    return () => {
      workerManager.destroy();
    };
  }, [onProgressChange]);

  // Enhanced highlighting removal function
  const removeExistingHighlights = useCallback(() => {
    const pdfContainer = document.querySelector('.react-pdf__Page__textContent');
    if (!pdfContainer) return;

    // Remove all highlight classes
    const highlightClasses = [
      'pdfHighlight', // Legacy
      'pdfHighlightExact',
      'pdfHighlightSimilar', 
      'pdfHighlightRelated',
      'pdfHighlightContext',
      'pdfHighlightEntity',
      'pdfHighlightPhrase',
      'highlightPriorityHigh',
      'highlightPriorityMedium',
      'highlightPriorityLow'
    ];
    
    highlightClasses.forEach(className => {
      const elements = pdfContainer.querySelectorAll(`.${highlightStyles[className]}`);
      elements.forEach(element => {
        element.classList.remove(highlightStyles[className]);
        element.removeAttribute('data-confidence');
        element.removeAttribute('data-matched-by');
        element.removeAttribute('data-highlight-id');
        element.removeEventListener('click', handleHighlightClick);
      });
    });
  }, []);

  // Find PDF text layer
  const findPDFTextLayer = useCallback(() => {
    const pageSelectors = [
      `[data-page-number="${pageNumber}"] .react-pdf__Page__textContent`,
      `.react-pdf__Page:nth-child(${pageNumber}) .react-pdf__Page__textContent`,
      '.react-pdf__Page__textContent'
    ];
    
    for (const selector of pageSelectors) {
      const textLayer = document.querySelector(selector);
      if (textLayer) {
        return textLayer;
      }
    }
    
    return null;
  }, [pageNumber]);

  // Handle highlight click events
  const handleHighlightClick = useCallback((event: Event) => {
    if (!onHighlightClick) return;
    
    const target = event.target as HTMLElement;
    const highlightId = target.getAttribute('data-highlight-id');
    const confidence = parseFloat(target.getAttribute('data-confidence') || '0');
    const matchedBy = target.getAttribute('data-matched-by') || '';
    
    if (highlightId) {
      const highlightInfo: HighlightInfo = {
        id: highlightId,
        text: target.textContent || '',
        level: 'similar', // Would need to determine from classes
        confidence,
        bounds: target.getBoundingClientRect(),
        matchedBy,
        context: target.getAttribute('data-context') || undefined
      };
      
      onHighlightClick(highlightInfo);
    }
  }, [onHighlightClick]);

  // Advanced highlighting application
  const applyAdvancedHighlighting = useCallback(async () => {
    if (!shouldHighlight || !highlightRange.searchText || !textContent) {
      removeExistingHighlights();
      return;
    }

    const searchText = highlightRange.searchText.trim();
    if (!searchText) {
      removeExistingHighlights();
      return;
    }

    // Cancel any existing processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setProcessingState((prev: ProcessingState) => ({
        ...prev,
        isProcessing: true,
        error: null
      }));

      // Initialize progress
      onProgressChange?.({ 
        currentStep: 'initializing', 
        progress: 0, 
        message: '하이라이팅 분석을 시작합니다...', 
        totalSteps: 6, 
        completedSteps: 0 
      });

      // Initialize steps
      const steps = workerManagerRef.current.initializeSteps(searchText);
      setHighlightingSteps(steps);

      if (enableAsyncProcessing) {
        await performAsyncHighlighting(searchText);
      } else {
        await performSyncHighlighting(searchText);
      }

    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setProcessingState((prev: ProcessingState) => ({
          ...prev,
          error: error.message,
          isProcessing: false
        }));
      }
    }
  }, [shouldHighlight, highlightRange.searchText, textContent, enableAsyncProcessing]);

  // Async processing with progress updates
  const performAsyncHighlighting = async (searchText: string) => {
    const workerManager = workerManagerRef.current;
    
    // Step 1: Analyze document structure
    updateStep('structure-analysis', 'in_progress');
    onProgressChange?.({ 
      currentStep: 'structure-analysis', 
      progress: 10, 
      message: '문서 구조를 분석하고 있습니다...', 
      totalSteps: 6, 
      completedSteps: 0 
    });
    
    const documentStructure = await workerManager.analyzeDocumentStructure(
      textContent, 
      pageNumber
    );
    updateStep('structure-analysis', 'completed', { resultCount: documentStructure.chunks.length });

    // Step 2: Text processing (simulate)
    updateStep('text-processing', 'in_progress');
    onProgressChange?.({ 
      currentStep: 'text-processing', 
      progress: 25, 
      message: '텍스트를 전처리하고 키워드를 추출합니다...', 
      totalSteps: 6, 
      completedSteps: 1 
    });
    
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate processing
    updateStep('text-processing', 'completed');

    // Step 3: Semantic matching
    updateStep('semantic-matching', 'in_progress');
    onProgressChange?.({ 
      currentStep: 'semantic-matching', 
      progress: 50, 
      message: '의미적 유사도를 계산합니다...', 
      totalSteps: 6, 
      completedSteps: 2 
    });
    
    const semanticMatchArray = await workerManager.performSemanticMatching(
      documentStructure.chunks,
      searchText,
      10
    );
    
    // Convert array to single result object for compatibility
    const semanticMatches: SemanticMatchResult = {
      sentences: [],
      phrases: [],
      keywords: [],
      entities: [],
      overallRelevance: 0,
      processingTime: 0
    };
    
    updateStep('semantic-matching', 'completed', { resultCount: semanticMatchArray.length });

    // Step 4: Apply highlights
    onProgressChange?.({ 
      currentStep: 'fuzzy-matching', 
      progress: 80, 
      message: '하이라이트를 적용하고 있습니다...', 
      totalSteps: 6, 
      completedSteps: 3 
    });

    // Convert WorkerDocumentStructure to DocumentStructure for compatibility
    const convertedStructure: DocumentStructure = {
      sections: documentStructure.chunks.map((chunk) => ({
        id: chunk.id,
        type: chunk.sectionType as 'title' | 'subtitle' | 'paragraph' | 'footnote',
        level: 1,
        bounds: {
          x: chunk.bounds.x,
          y: chunk.bounds.y,
          width: chunk.bounds.width,
          height: chunk.bounds.height
        },
        content: chunk.text,
        importance: chunk.importance,
        children: [],
        textItems: []
      })),
      headers: [],
      tables: [],
      lists: [],
      pageLayout: {
        margins: { x: 0, y: 0, width: 0, height: 0 },
        columns: [],
        readingOrder: [],
        textDensity: 1,
        hasFootnotes: false,
        hasHeaders: false
      },
      textFlow: [],
      importance: {
        sections: new Map<string, number>(),
        textBlocks: new Map<string, number>(),
        keywords: new Map<string, number>(),
        phrases: new Map<string, number>()
      }
    };

    // Apply highlights based on results
    await applyHighlightsFromResults(convertedStructure, semanticMatches, searchText);

    // Final completion
    onProgressChange?.({ 
      currentStep: 'highlight-ranking', 
      progress: 100, 
      message: '하이라이팅 분석이 완료되었습니다!', 
      totalSteps: 6, 
      completedSteps: 6 
    });

    setProcessingState((prev: ProcessingState) => ({
      ...prev,
      isProcessing: false,
      results: {
        documentStructure: convertedStructure,
        semanticMatches,
        appliedHighlights: prev.results.appliedHighlights
      }
    }));
  };

  // Synchronous processing fallback
  const performSyncHighlighting = async (searchText: string) => {
    const documentAnalyzer = documentAnalyzerRef.current;
    const semanticMatcher = semanticMatcherRef.current;

    // Step 1: Document structure analysis
    updateStep('structure-analysis', 'in_progress');
    onProgressChange?.({ 
      currentStep: 'structure-analysis', 
      progress: 20, 
      message: '문서 구조를 분석하고 있습니다...', 
      totalSteps: 6, 
      completedSteps: 0 
    });
    
    const documentStructure = documentAnalyzer.analyzeDocumentStructure(
      { getViewport: () => ({ width: pageWidth, height: pageHeight }) },
      textContent
    );
    updateStep('structure-analysis', 'completed', { resultCount: documentStructure.sections.length });

    // Step 2: Text processing
    updateStep('text-processing', 'in_progress');
    onProgressChange?.({ 
      currentStep: 'text-processing', 
      progress: 40, 
      message: '텍스트를 전처리하고 키워드를 추출합니다...', 
      totalSteps: 6, 
      completedSteps: 1 
    });
    
    await new Promise(resolve => setTimeout(resolve, 200));
    updateStep('text-processing', 'completed');

    // Step 3: Semantic matching
    updateStep('semantic-matching', 'in_progress');
    onProgressChange?.({ 
      currentStep: 'semantic-matching', 
      progress: 70, 
      message: '의미적 유사도를 계산합니다...', 
      totalSteps: 6, 
      completedSteps: 2 
    });
    
    const documentText = documentStructure.sections.map(s => s.content).join(' ');
    const semanticMatches = await semanticMatcher.findSemanticMatches(
      searchText,
      documentText,
      documentStructure,
      10
    );
    updateStep('semantic-matching', 'completed', { resultCount: semanticMatches.sentences.length });

    // Apply highlights
    onProgressChange?.({ 
      currentStep: 'highlight-ranking', 
      progress: 90, 
      message: '하이라이트를 적용하고 있습니다...', 
      totalSteps: 6, 
      completedSteps: 3 
    });

    await applyHighlightsFromResults(documentStructure, semanticMatches, searchText);

    onProgressChange?.({ 
      currentStep: 'completed', 
      progress: 100, 
      message: '하이라이팅 분석이 완료되었습니다!', 
      totalSteps: 6, 
      completedSteps: 6 
    });

    setProcessingState((prev: ProcessingState) => ({
      ...prev,
      isProcessing: false,
      results: {
        documentStructure,
        semanticMatches,
        appliedHighlights: prev.results.appliedHighlights
      }
    }));
  };

  // Update step status
  const updateStep = (stepId: string, status: HighlightingStep['status'], extra?: { resultCount?: number; duration?: number }) => {
    setHighlightingSteps(prev => prev.map(step => {
      if (step.id === stepId) {
        const updatedStep = { ...step, status };
        if (extra?.resultCount !== undefined) {
          updatedStep.resultCount = extra.resultCount;
        }
        if (extra?.duration !== undefined) {
          updatedStep.duration = extra.duration;
        }
        return updatedStep;
      }
      return step;
    }));
  };

  // Apply highlights based on analysis results
  const applyHighlightsFromResults = async (
    _documentStructure: DocumentStructure,
    semanticMatches: SemanticMatchResult,
    searchText: string
  ) => {
    const textLayer = findPDFTextLayer();
    if (!textLayer) return;

    removeExistingHighlights();

    const textSpans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
    const config = configRef.current;
    const appliedHighlights: HighlightResult[] = [];

    // Step 4: Fuzzy matching
    updateStep('fuzzy-matching', 'in_progress');
    
    textSpans.forEach((span) => {
      const spanText = span.textContent?.trim() || '';
      if (!spanText || spanText.length < 2) return;

      let bestMatch: HighlightResult | null = null;

      // 1. Check exact matches from semantic results
      const exactSentenceMatch = semanticMatches.sentences.find(sentence => 
        sentence.content.toLowerCase().includes(spanText.toLowerCase()) ||
        spanText.toLowerCase().includes(sentence.content.toLowerCase())
      );

      if (exactSentenceMatch && exactSentenceMatch.similarity > 0.8) {
        bestMatch = {
          text: spanText,
          level: 'exact',
          confidence: exactSentenceMatch.similarity,
          element: span,
          matchedBy: `semantic-${exactSentenceMatch.matchType}`
        };
      }

      // 2. Check phrase matches
      if (!bestMatch) {
        const phraseMatch = semanticMatches.phrases.find(phrase => 
          phrase.content.toLowerCase().includes(spanText.toLowerCase()) ||
          spanText.toLowerCase().includes(phrase.content.toLowerCase())
        );

        if (phraseMatch && phraseMatch.similarity > 0.6) {
          bestMatch = {
            text: spanText,
            level: 'phrase',
            confidence: phraseMatch.similarity,
            element: span,
            matchedBy: 'semantic-phrase'
          };
        }
      }

      // 3. Check keyword matches
      if (!bestMatch) {
        const keywordMatch = semanticMatches.keywords.find(keyword => 
          spanText.toLowerCase().includes(keyword.keyword.toLowerCase()) ||
          keyword.semanticVariants.some(variant => 
            spanText.toLowerCase().includes(variant.toLowerCase())
          )
        );

        if (keywordMatch && keywordMatch.similarity > 0.5) {
          bestMatch = {
            text: spanText,
            level: 'similar',
            confidence: keywordMatch.similarity,
            element: span,
            matchedBy: 'semantic-keyword'
          };
        }
      }

      // 4. Check entity matches
      if (!bestMatch) {
        const entityMatch = semanticMatches.entities.find(entity => 
          entity.text.toLowerCase().includes(spanText.toLowerCase()) ||
          spanText.toLowerCase().includes(entity.text.toLowerCase())
        );

        if (entityMatch && entityMatch.similarity > 0.7) {
          bestMatch = {
            text: spanText,
            level: 'entity',
            confidence: entityMatch.similarity,
            element: span,
            matchedBy: `semantic-entity-${entityMatch.type}`
          };
        }
      }

      // 5. Fallback to basic fuzzy matching
      if (!bestMatch) {
        const searchWords = searchText.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const hasBasicMatch = searchWords.some(word => 
          spanText.toLowerCase().includes(word) || 
          word.includes(spanText.toLowerCase())
        );

        if (hasBasicMatch) {
          bestMatch = {
            text: spanText,
            level: 'related',
            confidence: 0.4,
            element: span,
            matchedBy: 'basic-fuzzy'
          };
        }
      }

      if (bestMatch) {
        appliedHighlights.push(bestMatch);
      }
    });

    updateStep('fuzzy-matching', 'completed', { resultCount: appliedHighlights.length });

    // Step 5: Context analysis
    updateStep('context-analysis', 'in_progress');
    await new Promise(resolve => setTimeout(resolve, 300));
    updateStep('context-analysis', 'completed');

    // Step 6: Apply highlights with ranking
    updateStep('highlight-ranking', 'in_progress');
    
    // Sort and limit highlights
    appliedHighlights
      .sort((a, b) => {
        const priorityA = config.priority[a.level];
        const priorityB = config.priority[b.level];
        if (priorityA !== priorityB) return priorityB - priorityA;
        return b.confidence - a.confidence;
      })
      .slice(0, config.visual.maxHighlights)
      .forEach((result, index) => {
        if (result.element) {
          const highlightClass = getHighlightClassName(result.level);
          const priorityClass = getPriorityClassName(config.priority[result.level]);
          const highlightId = `highlight-${pageNumber}-${index}`;
          
          // Apply CSS classes
          result.element.classList.add(highlightStyles[highlightClass]);
          result.element.classList.add(highlightStyles[priorityClass]);
          
          // Set data attributes
          result.element.setAttribute('data-highlight-id', highlightId);
          result.element.setAttribute('data-confidence', result.confidence.toFixed(2));
          result.element.setAttribute('data-matched-by', result.matchedBy);
          
          // Add click handler if needed
          if (onHighlightClick) {
            result.element.addEventListener('click', handleHighlightClick);
            result.element.style.cursor = 'pointer';
          }
        }
      });

    updateStep('highlight-ranking', 'completed', { resultCount: Math.min(appliedHighlights.length, config.visual.maxHighlights) });

    setProcessingState((prev: ProcessingState) => ({
      ...prev,
      results: {
        ...prev.results,
        appliedHighlights
      }
    }));
  };

  // Wait for DOM to be ready
  const waitForPDFDOM = useCallback((maxAttempts: number = 10, interval: number = 200): Promise<boolean> => {
    return new Promise((resolve) => {
      let attempts = 0;
      
      const checkDOM = () => {
        attempts++;
        
        const textLayer = findPDFTextLayer();
        const hasTextSpans = textLayer && textLayer.querySelectorAll('span').length > 0;
        
        if (hasTextSpans) {
          const spans = textLayer!.querySelectorAll('span');
          let hasValidContent = false;
          for (let i = 0; i < Math.min(spans.length, 5); i++) {
            const span = spans[i] as HTMLElement;
            if (span.textContent?.trim()) {
              hasValidContent = true;
              break;
            }
          }
          
          if (hasValidContent) {
            resolve(true);
            return;
          }
        }
        
        if (attempts >= maxAttempts) {
          resolve(false);
          return;
        }
        
        setTimeout(checkDOM, interval);
      };
      
      checkDOM();
    });
  }, [findPDFTextLayer]);

  // Main effect
  useEffect(() => {
    if (!shouldHighlight) {
      removeExistingHighlights();
      return;
    }

    const executeHighlighting = async () => {
      const domReady = await waitForPDFDOM();
      if (!domReady) {
        setProcessingState((prev: ProcessingState) => ({
          ...prev,
          error: 'PDF DOM not ready for highlighting'
        }));
        return;
      }

      await applyAdvancedHighlighting();
    };

    executeHighlighting();

    return () => {
      removeExistingHighlights();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [shouldHighlight, highlightRange, scale, applyAdvancedHighlighting, waitForPDFDOM, removeExistingHighlights]);

  // This component doesn't render anything to the DOM (highlights are applied via CSS classes)
  return null;
};

export default AdvancedPDFHighlighter;