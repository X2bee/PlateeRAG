// Analyzes PDF document structure to improve highlighting accuracy

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentStructure {
  sections: Section[];
  tables: TableInfo[];
  lists: ListInfo[];
  headers: HeaderInfo[];
  pageLayout: PageLayout;
  textFlow: TextFlow[];
  importance: ImportanceMap;
}

export interface Section {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'footnote';
  level: number;
  bounds: Rectangle;
  content: string;
  importance: number;
  children: Section[];
  parent?: Section;
  textItems: PDFTextItem[];
}

export interface TableInfo {
  id: string;
  bounds: Rectangle;
  rows: number;
  columns: number;
  cells: TableCell[][];
  importance: number;
  caption?: string;
  headers?: string[];
}

export interface TableCell {
  content: string;
  bounds: Rectangle;
  rowSpan: number;
  colSpan: number;
  isHeader: boolean;
}

export interface ListInfo {
  id: string;
  type: 'ordered' | 'unordered' | 'definition';
  bounds: Rectangle;
  items: ListItem[];
  importance: number;
  level: number;
  marker: string;
}

export interface ListItem {
  id: string;
  content: string;
  bounds: Rectangle;
  level: number;
  marker: string;
  subItems: ListItem[];
}

export interface HeaderInfo {
  id: string;
  level: number; // 1-6
  text: string;
  bounds: Rectangle;
  importance: number;
  sectionId: string;
  fontSize: number;
  fontWeight: string;
}

export interface PageLayout {
  margins: Rectangle;
  columns: ColumnInfo[];
  readingOrder: ReadingOrder[];
  textDensity: number;
  hasFootnotes: boolean;
  hasHeaders: boolean;
}

export interface ColumnInfo {
  id: string;
  bounds: Rectangle;
  textItems: PDFTextItem[];
}

export interface ReadingOrder {
  id: string;
  bounds: Rectangle;
  sequence: number;
  type: 'text' | 'image' | 'table' | 'figure';
}

export interface TextFlow {
  id: string;
  startBounds: Rectangle;
  endBounds: Rectangle;
  direction: 'horizontal' | 'vertical';
  alignment: 'left' | 'center' | 'right' | 'justify';
  textItems: PDFTextItem[];
}

export interface ImportanceMap {
  sections: Map<string, number>;
  textBlocks: Map<string, number>;
  keywords: Map<string, number>;
  phrases: Map<string, number>;
}

interface PDFTextItem {
  id: string;
  str: string;
  bounds: Rectangle;
  fontSize: number;
  fontName: string;
  color: string;
  transform: number[];
  hasEOL: boolean;
  width: number;
  height: number;
}

interface LayoutAnalysisResult {
  textBlocks: TextBlock[];
  visualElements: VisualElement[];
  readingOrder: ReadingOrder[];
}

interface TextBlock {
  id: string;
  bounds: Rectangle;
  items: PDFTextItem[];
  blockType: 'paragraph' | 'heading' | 'list' | 'table' | 'caption' | 'footnote';
  alignment: 'left' | 'center' | 'right' | 'justify';
  indentation: number;
  lineSpacing: number;
}

interface VisualElement {
  id: string;
  type: 'image' | 'figure' | 'chart' | 'table' | 'line' | 'box';
  bounds: Rectangle;
  importance: number;
}

export interface AnalysisProgressCallback {
  (step: string, progress: number, details?: any): void;
}

/**
 * Main document analyzer class
 */
export class DocumentAnalyzer {
  private pageWidth: number = 0;
  private pageHeight: number = 0;
  private averageFontSize: number = 12;
  private averageLineHeight: number = 14;
  private progressCallback?: AnalysisProgressCallback;
  
  constructor(progressCallback?: AnalysisProgressCallback) {
    this.progressCallback = progressCallback;
  }

  /**
   * Analyze complete document structure
   */
  public analyzeDocumentStructure(pdfPage: any, textContent: any): DocumentStructure {
    if (!textContent || !textContent.items) {
      return this.createEmptyStructure();
    }

    this.reportProgress('페이지 정보 추출', 5, { itemCount: textContent.items.length });
    
    // Extract basic page information
    this.extractPageDimensions(pdfPage);
    const textItems = this.convertTextItems(textContent.items);
    
    this.reportProgress('폰트 메트릭 계산', 10);
    // Calculate average font metrics
    this.calculateAverageMetrics(textItems);
    
    this.reportProgress('레이아웃 분석 시작', 20);
    // Perform layout analysis
    const layoutResult = this.performLayoutAnalysis(textItems);
    
    this.reportProgress('섹션 식별', 40, { blockCount: layoutResult.textBlocks.length });
    // Identify sections and hierarchy
    const sections = this.identifySections(layoutResult.textBlocks);
    
    this.reportProgress('테이블 탐지', 55, { sectionCount: sections.length });
    // Detect tables
    const tables = this.detectTables(textItems);
    
    this.reportProgress('목록 탐지', 70, { tableCount: tables.length });
    // Detect lists
    const lists = this.detectLists(layoutResult.textBlocks);
    
    this.reportProgress('헤더 식별', 80, { listCount: lists.length });
    // Identify headers
    const headers = this.identifyHeaders(textItems, sections);
    
    this.reportProgress('페이지 레이아웃 분석', 90, { headerCount: headers.length });
    // Analyze page layout
    const pageLayout = this.analyzePageLayout(textItems, layoutResult);
    
    // Determine text flow
    const textFlow = this.analyzeTextFlow(textItems);
    
    this.reportProgress('중요도 점수 계산', 95);
    // Calculate importance scores
    const importance = this.calculateImportanceScores(sections, tables, lists, headers);

    this.reportProgress('문서 분석 완료', 100, {
      sections: sections.length,
      tables: tables.length,
      lists: lists.length,
      headers: headers.length,
      textFlows: textFlow.length
    });

    return {
      sections,
      tables,
      lists,
      headers,
      pageLayout,
      textFlow,
      importance
    };
  }

  private reportProgress(step: string, progress: number, details?: any): void {
    if (this.progressCallback) {
      this.progressCallback(step, progress, details);
    }
  }

  private createEmptyStructure(): DocumentStructure {
    return {
      sections: [],
      tables: [],
      lists: [],
      headers: [],
      pageLayout: {
        margins: { x: 0, y: 0, width: 0, height: 0 },
        columns: [],
        readingOrder: [],
        textDensity: 0,
        hasFootnotes: false,
        hasHeaders: false
      },
      textFlow: [],
      importance: {
        sections: new Map(),
        textBlocks: new Map(),
        keywords: new Map(),
        phrases: new Map()
      }
    };
  }

  private extractPageDimensions(pdfPage: any) {
    if (pdfPage && pdfPage.getViewport) {
      const viewport = pdfPage.getViewport({ scale: 1.0 });
      this.pageWidth = viewport.width;
      this.pageHeight = viewport.height;
    }
  }

  private convertTextItems(items: any[]): PDFTextItem[] {
    return items.map((item, index) => ({
      id: `item-${index}`,
      str: item.str || '',
      bounds: this.transformToBounds(item.transform, item.width, item.height),
      fontSize: item.height || 12,
      fontName: item.fontName || 'default',
      color: item.color || '#000000',
      transform: item.transform || [1, 0, 0, 1, 0, 0],
      hasEOL: item.hasEOL || false,
      width: item.width || 0,
      height: item.height || 12
    }));
  }

  private transformToBounds(transform: number[], width: number, height: number): Rectangle {
    return {
      x: transform[4] || 0,
      y: transform[5] || 0,
      width: width || 0,
      height: height || 12
    };
  }

  private calculateAverageMetrics(textItems: PDFTextItem[]) {
    if (textItems.length === 0) return;
    
    const fontSizes = textItems.map(item => item.fontSize);
    this.averageFontSize = fontSizes.reduce((sum, size) => sum + size, 0) / fontSizes.length;
    this.averageLineHeight = this.averageFontSize * 1.2;
  }

  private performLayoutAnalysis(textItems: PDFTextItem[]): LayoutAnalysisResult {
    // Group text items into blocks based on proximity and alignment
    const textBlocks = this.groupIntoTextBlocks(textItems);
    
    // Detect visual elements (simplified - would need actual PDF parsing)
    const visualElements: VisualElement[] = [];
    
    // Determine reading order
    const readingOrder = this.determineReadingOrder(textBlocks);

    return {
      textBlocks,
      visualElements,
      readingOrder
    };
  }

  private groupIntoTextBlocks(textItems: PDFTextItem[]): TextBlock[] {
    const blocks: TextBlock[] = [];
    let blockId = 0;

    // Sort items by y-coordinate (top to bottom)
    const sortedItems = [...textItems].sort((a, b) => b.bounds.y - a.bounds.y);
    
    let currentBlock: PDFTextItem[] = [];
    let currentY = -1;
    let currentX = -1;
    
    for (const item of sortedItems) {
      const itemY = item.bounds.y;
      const itemX = item.bounds.x;
      
      // Check if this item belongs to the current block
      if (currentY === -1 || Math.abs(itemY - currentY) <= this.averageLineHeight * 0.5) {
        currentBlock.push(item);
        currentY = itemY;
        if (currentX === -1) currentX = itemX;
      } else {
        // Finish current block and start new one
        if (currentBlock.length > 0) {
          blocks.push(this.createTextBlock(blockId++, currentBlock));
        }
        currentBlock = [item];
        currentY = itemY;
        currentX = itemX;
      }
    }
    
    // Don't forget the last block
    if (currentBlock.length > 0) {
      blocks.push(this.createTextBlock(blockId++, currentBlock));
    }

    return blocks;
  }

  private createTextBlock(id: number, items: PDFTextItem[]): TextBlock {
    // Calculate bounding rectangle for all items
    const minX = Math.min(...items.map(item => item.bounds.x));
    const minY = Math.min(...items.map(item => item.bounds.y));
    const maxX = Math.max(...items.map(item => item.bounds.x + item.bounds.width));
    const maxY = Math.max(...items.map(item => item.bounds.y + item.bounds.height));
    
    const bounds: Rectangle = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };

    // Determine block type
    const blockType = this.determineBlockType(items);
    
    // Determine alignment
    const alignment = this.determineAlignment(items);
    
    // Calculate indentation
    const indentation = minX;
    
    // Calculate line spacing (simplified)
    const lineSpacing = items.length > 1 ? 
      (maxY - minY) / items.length : this.averageLineHeight;

    return {
      id: `block-${id}`,
      bounds,
      items,
      blockType,
      alignment,
      indentation,
      lineSpacing
    };
  }

  private determineBlockType(items: PDFTextItem[]): TextBlock['blockType'] {
    const text = items.map(item => item.str).join(' ').trim();
    const avgFontSize = items.reduce((sum, item) => sum + item.fontSize, 0) / items.length;
    
    // Header detection
    if (avgFontSize > this.averageFontSize * 1.3 && text.length < 100) {
      return 'heading';
    }
    
    // List detection
    if (/^[\d\w]*[.):-]\s+/.test(text) || /^[•◦▪▫✓]\s+/.test(text)) {
      return 'list';
    }
    
    // Table detection (basic)
    if (items.some(item => /^\s*\|\s*/.test(item.str))) {
      return 'table';
    }
    
    // Footnote detection (small font, at bottom of page)
    if (avgFontSize < this.averageFontSize * 0.9 && items[0].bounds.y < this.pageHeight * 0.2) {
      return 'footnote';
    }
    
    // Caption detection
    if (/^(그림|표|figure|table)\s*\d+/i.test(text)) {
      return 'caption';
    }

    return 'paragraph';
  }

  private determineAlignment(items: PDFTextItem[]): TextBlock['alignment'] {
    if (items.length === 0) return 'left';
    
    const leftMargin = Math.min(...items.map(item => item.bounds.x));
    const rightMargin = Math.max(...items.map(item => item.bounds.x + item.bounds.width));
    const centerPosition = (leftMargin + rightMargin) / 2;
    const pageCenter = this.pageWidth / 2;
    
    // Check if text is centered
    if (Math.abs(centerPosition - pageCenter) < this.pageWidth * 0.1) {
      return 'center';
    }
    
    // Check if text is right-aligned (uncommon but possible)  
    if (rightMargin > this.pageWidth * 0.8 && leftMargin > this.pageWidth * 0.5) {
      return 'right';
    }
    
    return 'left';
  }

  private determineReadingOrder(textBlocks: TextBlock[]): ReadingOrder[] {
    return textBlocks.map((block, index) => ({
      id: block.id,
      bounds: block.bounds,
      sequence: index,
      type: 'text' as const
    }));
  }

  private identifySections(textBlocks: TextBlock[]): Section[] {
    const sections: Section[] = [];
    let sectionId = 0;
    let currentLevel = 0;
    let parentSection: Section | undefined;

    for (const block of textBlocks) {
      if (block.blockType === 'heading') {
        const headerLevel = this.determineHeaderLevel(block);
        
        const section: Section = {
          id: `section-${sectionId++}`,
          type: headerLevel === 1 ? 'title' : 'subtitle',
          level: headerLevel,
          bounds: block.bounds,
          content: block.items.map(item => item.str).join(' ').trim(),
          importance: this.calculateSectionImportance(block),
          children: [],
          textItems: block.items
        };

        // Handle section hierarchy
        if (headerLevel <= currentLevel && parentSection) {
          // Close current section level
          parentSection = this.findParentSection(sections, headerLevel);
        }
        
        if (parentSection && headerLevel > parentSection.level) {
          section.parent = parentSection;
          parentSection.children.push(section);
        } else {
          sections.push(section);
          parentSection = section;
        }
        
        currentLevel = headerLevel;
      } else if (block.blockType === 'paragraph' && parentSection) {
        // Add paragraph to current section
        parentSection.content += ' ' + block.items.map(item => item.str).join(' ').trim();
        parentSection.textItems.push(...block.items);
      }
    }

    return sections;
  }

  private determineHeaderLevel(block: TextBlock): number {
    const avgFontSize = block.items.reduce((sum, item) => sum + item.fontSize, 0) / block.items.length;
    const fontRatio = avgFontSize / this.averageFontSize;
    
    if (fontRatio >= 1.8) return 1;
    if (fontRatio >= 1.5) return 2;
    if (fontRatio >= 1.3) return 3;
    if (fontRatio >= 1.1) return 4;
    return 5;
  }

  private findParentSection(sections: Section[], targetLevel: number): Section | undefined {
    // Find the most recent section with a level less than targetLevel
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].level < targetLevel) {
        return sections[i];
      }
    }
    return undefined;
  }

  private calculateSectionImportance(block: TextBlock): number {
    let importance = 0.5; // Base importance
    
    // Font size factor
    const avgFontSize = block.items.reduce((sum, item) => sum + item.fontSize, 0) / block.items.length;
    const fontFactor = (avgFontSize / this.averageFontSize - 1) * 0.5;
    importance += Math.min(fontFactor, 0.3);
    
    // Position factor (headers at top are more important)
    const positionFactor = (this.pageHeight - block.bounds.y) / this.pageHeight * 0.2;
    importance += positionFactor;
    
    return Math.min(importance, 1.0);
  }

  private detectTables(textItems: PDFTextItem[]): TableInfo[] {
    // Simple table detection based on text alignment patterns
    const tables: TableInfo[] = [];
    
    // Group items that might be in tables
    const potentialTableItems = textItems.filter(item => {
      const text = item.str.trim();
      return text.includes('|') || /^\s*\d+\s*$/.test(text) || /^\s*[A-Za-z가-힣]+\s*$/.test(text);
    });

    if (potentialTableItems.length < 4) return tables; // Need at least 4 cells for a 2x2 table
    
    // This is a simplified implementation
    // In a real implementation, you would analyze grid patterns
    
    return tables;
  }

  private detectLists(textBlocks: TextBlock[]): ListInfo[] {
    const lists: ListInfo[] = [];
    let listId = 0;

    for (const block of textBlocks) {
      if (block.blockType === 'list') {
        const listType = this.determineListType(block);
        const items = this.extractListItems(block);
        
        lists.push({
          id: `list-${listId++}`,
          type: listType,
          bounds: block.bounds,
          items,
          importance: 0.7,
          level: 1,
          marker: this.extractListMarker(block)
        });
      }
    }

    return lists;
  }

  private determineListType(block: TextBlock): ListInfo['type'] {
    const text = block.items.map(item => item.str).join(' ');
    
    if (/^\d+[.)]\s+/.test(text)) {
      return 'ordered';
    } else if (/^[•◦▪▫]\s+/.test(text)) {
      return 'unordered';
    }
    
    return 'unordered';
  }

  private extractListItems(block: TextBlock): ListItem[] {
    const text = block.items.map(item => item.str).join(' ');
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line, index) => ({
      id: `item-${index}`,
      content: line.replace(/^[\d\w]*[.):-•◦▪▫]\s*/, '').trim(),
      bounds: block.bounds, // Simplified
      level: 1,
      marker: this.extractItemMarker(line),
      subItems: []
    }));
  }

  private extractListMarker(block: TextBlock): string {
    const text = block.items[0]?.str || '';
    const match = text.match(/^([\d\w]*[.):-•◦▪▫])\s*/);
    return match ? match[1] : '•';
  }

  private extractItemMarker(line: string): string {
    const match = line.match(/^([\d\w]*[.):-•◦▪▫])\s*/);
    return match ? match[1] : '•';
  }

  private identifyHeaders(textItems: PDFTextItem[], sections: Section[]): HeaderInfo[] {
    const headers: HeaderInfo[] = [];
    let headerId = 0;

    for (const section of sections) {
      if (section.type === 'title' || section.type === 'subtitle') {
        const avgFontSize = section.textItems.reduce((sum, item) => sum + item.fontSize, 0) / section.textItems.length;
        
        headers.push({
          id: `header-${headerId++}`,
          level: section.level,
          text: section.content,
          bounds: section.bounds,
          importance: section.importance,
          sectionId: section.id,
          fontSize: avgFontSize,
          fontWeight: avgFontSize > this.averageFontSize * 1.2 ? 'bold' : 'normal'
        });
      }
    }

    return headers;
  }

  private analyzePageLayout(textItems: PDFTextItem[], layoutResult: LayoutAnalysisResult): PageLayout {
    // Calculate margins
    const margins = this.calculateMargins(textItems);
    
    // Detect columns
    const columns = this.detectColumns(textItems);
    
    // Calculate text density
    const textDensity = this.calculateTextDensity(textItems);
    
    // Check for footnotes and headers
    const hasFootnotes = textItems.some(item => item.bounds.y < this.pageHeight * 0.2);
    const hasHeaders = textItems.some(item => item.bounds.y > this.pageHeight * 0.9);

    return {
      margins,
      columns,
      readingOrder: layoutResult.readingOrder,
      textDensity,
      hasFootnotes,
      hasHeaders
    };
  }

  private calculateMargins(textItems: PDFTextItem[]): Rectangle {
    if (textItems.length === 0) {
      return { x: 0, y: 0, width: this.pageWidth, height: this.pageHeight };
    }

    const minX = Math.min(...textItems.map(item => item.bounds.x));
    const minY = Math.min(...textItems.map(item => item.bounds.y));
    const maxX = Math.max(...textItems.map(item => item.bounds.x + item.bounds.width));
    const maxY = Math.max(...textItems.map(item => item.bounds.y + item.bounds.height));

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  private detectColumns(textItems: PDFTextItem[]): ColumnInfo[] {
    // Simple column detection based on x-coordinate clustering
    const columns: ColumnInfo[] = [];
    
    if (textItems.length === 0) return columns;

    // Simple single column for now
    columns.push({
      id: 'column-0',
      bounds: this.calculateMargins(textItems),
      textItems
    });

    return columns;
  }

  private calculateTextDensity(textItems: PDFTextItem[]): number {
    if (textItems.length === 0 || this.pageWidth === 0 || this.pageHeight === 0) return 0;
    
    const totalTextArea = textItems.reduce((sum, item) => 
      sum + (item.bounds.width * item.bounds.height), 0
    );
    
    const pageArea = this.pageWidth * this.pageHeight;
    return totalTextArea / pageArea;
  }

  private analyzeTextFlow(textItems: PDFTextItem[]): TextFlow[] {
    const flows: TextFlow[] = [];
    
    // Group consecutive text items into flows
    const sortedItems = [...textItems].sort((a, b) => {
      if (Math.abs(a.bounds.y - b.bounds.y) < 5) {
        return a.bounds.x - b.bounds.x;
      }
      return b.bounds.y - a.bounds.y;
    });

    let currentFlow: PDFTextItem[] = [];
    let flowId = 0;

    for (const item of sortedItems) {
      if (currentFlow.length === 0) {
        currentFlow.push(item);
      } else {
        const lastItem = currentFlow[currentFlow.length - 1];
        const distance = Math.sqrt(
          Math.pow(item.bounds.x - (lastItem.bounds.x + lastItem.bounds.width), 2) +
          Math.pow(item.bounds.y - lastItem.bounds.y, 2)
        );
        
        if (distance < this.averageFontSize * 2) {
          currentFlow.push(item);
        } else {
          if (currentFlow.length > 0) {
            flows.push(this.createTextFlow(flowId++, currentFlow));
          }
          currentFlow = [item];
        }
      }
    }

    if (currentFlow.length > 0) {
      flows.push(this.createTextFlow(flowId++, currentFlow));
    }

    return flows;
  }

  private createTextFlow(id: number, items: PDFTextItem[]): TextFlow {
    const startItem = items[0];
    const endItem = items[items.length - 1];
    
    return {
      id: `flow-${id}`,
      startBounds: startItem.bounds,
      endBounds: endItem.bounds,
      direction: 'horizontal', // Simplified
      alignment: 'left', // Simplified
      textItems: items
    };
  }

  private calculateImportanceScores(
    sections: Section[],
    tables: TableInfo[],
    lists: ListInfo[],
    headers: HeaderInfo[]
  ): ImportanceMap {
    const sectionMap = new Map<string, number>();
    const textBlockMap = new Map<string, number>();
    const keywordMap = new Map<string, number>();
    const phraseMap = new Map<string, number>();

    // Calculate section importance
    sections.forEach(section => {
      sectionMap.set(section.id, section.importance);
    });

    // Extract and weight keywords from all content including headers
    const allText = sections.map(s => s.content).join(' ') + 
                    tables.map(t => t.caption || '').join(' ') + 
                    lists.map(l => l.items.map(i => i.content).join(' ')).join(' ') +
                    headers.map(h => h.text).join(' '); // Include header text
    
    this.extractKeywords(allText, keywordMap);
    this.extractPhrases(allText, phraseMap);

    return {
      sections: sectionMap,
      textBlocks: textBlockMap,
      keywords: keywordMap,
      phrases: phraseMap
    };
  }

  private extractKeywords(text: string, keywordMap: Map<string, number>) {
    const words = text.toLowerCase()
      .replace(/[^\w가-힣\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);

    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // Calculate TF scores
    wordCount.forEach((count, word) => {
      const tf = count / words.length;
      keywordMap.set(word, tf);
    });
  }

  private extractPhrases(text: string, phraseMap: Map<string, number>) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach(sentence => {
      const words = sentence.trim().toLowerCase()
        .replace(/[^\w가-힣\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1);
      
      // Extract 2-4 word phrases
      for (let n = 2; n <= Math.min(4, words.length); n++) {
        for (let i = 0; i <= words.length - n; i++) {
          const phrase = words.slice(i, i + n).join(' ');
          phraseMap.set(phrase, (phraseMap.get(phrase) || 0) + 1 / sentences.length);
        }
      }
    });
  }
}

// Utility function to create analyzer instance
export function createDocumentAnalyzer(documentAnalysisCallback: AnalysisProgressCallback): DocumentAnalyzer {
  return new DocumentAnalyzer(documentAnalysisCallback);
}