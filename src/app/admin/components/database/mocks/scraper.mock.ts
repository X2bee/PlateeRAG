import {
  ScraperConfig,
  ScraperStats,
  ScrapedDataItem,
  ScraperRunLog,
  RobotsCheckResult,
  DataLakeStats,
  ParsedData,
  ScraperStatus,
  DataSourceType,
  ParsingMethod
} from '../types/scraper.types';

/**
 * Mock 스크래퍼 설정 목록
 */
export const mockScraperConfigs: ScraperConfig[] = [
  {
    id: 'scraper-001',
    name: 'Tech News Aggregator',
    endpoint: 'https://news.ycombinator.com',
    dataSourceType: 'web',
    parsingMethod: 'html',
    interval: 60,
    maxDepth: 2,
    followLinks: true,
    respectRobotsTxt: true,
    userAgent: 'xgen bot/1.0',
    createdAt: '2025-10-01T08:00:00Z',
    updatedAt: '2025-10-13T10:30:00Z',
  },
  {
    id: 'scraper-002',
    name: 'Product API Collector',
    endpoint: 'https://api.example.com/products',
    dataSourceType: 'api',
    parsingMethod: 'json',
    interval: 30,
    respectRobotsTxt: false,
    authentication: {
      type: 'api-key',
      credentials: {
        apiKey: '***********'
      }
    },
    createdAt: '2025-09-15T14:20:00Z',
    updatedAt: '2025-10-12T16:45:00Z',
  },
  {
    id: 'scraper-003',
    name: 'Research Papers Database',
    endpoint: 'postgres://localhost:5432/papers',
    dataSourceType: 'database',
    parsingMethod: 'json',
    interval: 1440, // 24시간
    respectRobotsTxt: false,
    createdAt: '2025-08-20T11:00:00Z',
    updatedAt: '2025-10-10T09:15:00Z',
  },
  {
    id: 'scraper-004',
    name: 'Customer Email Monitor',
    endpoint: 'imap://mail.example.com',
    dataSourceType: 'email',
    parsingMethod: 'html',
    interval: 15,
    respectRobotsTxt: false,
    authentication: {
      type: 'basic',
      credentials: {
        username: 'monitor@example.com',
        password: '***********'
      }
    },
    filters: {
      includePatterns: ['support@*', 'feedback@*'],
      contentType: ['text/html', 'text/plain']
    },
    createdAt: '2025-09-01T07:30:00Z',
    updatedAt: '2025-10-13T08:00:00Z',
  },
  {
    id: 'scraper-005',
    name: 'Document Repository',
    endpoint: 'file:///data/documents',
    dataSourceType: 'document',
    parsingMethod: 'raw',
    interval: 120,
    respectRobotsTxt: false,
    filters: {
      includePatterns: ['*.pdf', '*.docx', '*.txt'],
      excludePatterns: ['*_draft*', '*_temp*']
    },
    createdAt: '2025-07-10T13:45:00Z',
    updatedAt: '2025-10-11T15:20:00Z',
  }
];

/**
 * Mock 스크래퍼 통계
 */
export const mockScraperStats: Record<string, ScraperStats> = {
  'scraper-001': {
    scraperId: 'scraper-001',
    totalRuns: 487,
    successfulRuns: 465,
    failedRuns: 22,
    totalDataCollected: 12458,
    totalDataSize: 256789123,
    lastRunAt: '2025-10-13T09:45:00Z',
    averageRunTime: 45.3
  },
  'scraper-002': {
    scraperId: 'scraper-002',
    totalRuns: 976,
    successfulRuns: 968,
    failedRuns: 8,
    totalDataCollected: 45621,
    totalDataSize: 89234567,
    lastRunAt: '2025-10-13T10:15:00Z',
    averageRunTime: 12.7
  },
  'scraper-003': {
    scraperId: 'scraper-003',
    totalRuns: 243,
    successfulRuns: 241,
    failedRuns: 2,
    totalDataCollected: 8934,
    totalDataSize: 567890123,
    lastRunAt: '2025-10-12T22:00:00Z',
    averageRunTime: 234.8
  },
  'scraper-004': {
    scraperId: 'scraper-004',
    totalRuns: 1952,
    successfulRuns: 1920,
    failedRuns: 32,
    totalDataCollected: 3456,
    totalDataSize: 23456789,
    lastRunAt: '2025-10-13T10:30:00Z',
    averageRunTime: 8.4
  },
  'scraper-005': {
    scraperId: 'scraper-005',
    totalRuns: 195,
    successfulRuns: 189,
    failedRuns: 6,
    totalDataCollected: 2341,
    totalDataSize: 1234567890,
    lastRunAt: '2025-10-13T06:00:00Z',
    averageRunTime: 156.2
  }
};

/**
 * Mock 스크래핑된 데이터
 */
export const mockScrapedData: ScrapedDataItem[] = [
  {
    id: 'data-001',
    scraperId: 'scraper-001',
    url: 'https://news.ycombinator.com/item?id=12345',
    title: 'Show HN: New AI Framework for RAG Systems',
    content: {
      headline: 'Show HN: New AI Framework for RAG Systems',
      author: 'techuser123',
      points: 342,
      comments: 78,
      text: 'We built a new framework that makes it easier to implement RAG systems...'
    },
    contentType: 'text/html',
    size: 15234,
    metadata: {
      domain: 'news.ycombinator.com',
      publishedDate: '2025-10-13T08:30:00Z'
    },
    parsingMethod: 'html',
    collectedAt: '2025-10-13T09:45:00Z',
    tags: ['technology', 'ai', 'rag']
  },
  {
    id: 'data-002',
    scraperId: 'scraper-002',
    url: 'https://api.example.com/products/prod-123',
    title: 'Product: Premium Widget Pro',
    content: {
      id: 'prod-123',
      name: 'Premium Widget Pro',
      category: 'Electronics',
      price: 299.99,
      inStock: true,
      description: 'High-quality widget with advanced features',
      specs: {
        weight: '500g',
        dimensions: '10x15x3cm',
        color: 'black'
      }
    },
    contentType: 'application/json',
    size: 2345,
    metadata: {
      apiVersion: 'v2',
      responseTime: 145
    },
    parsingMethod: 'json',
    collectedAt: '2025-10-13T10:15:00Z',
    tags: ['product', 'electronics']
  },
  {
    id: 'data-003',
    scraperId: 'scraper-003',
    title: 'Research Paper: Deep Learning in Healthcare',
    content: {
      title: 'Deep Learning in Healthcare: A Comprehensive Review',
      authors: ['Dr. Jane Smith', 'Dr. John Doe'],
      abstract: 'This paper reviews the application of deep learning techniques in healthcare...',
      keywords: ['deep learning', 'healthcare', 'medical imaging', 'diagnosis'],
      year: 2025,
      citations: 42
    },
    contentType: 'application/json',
    size: 45678,
    metadata: {
      database: 'papers_db',
      table: 'research_papers'
    },
    parsingMethod: 'json',
    collectedAt: '2025-10-12T22:00:00Z',
    tags: ['research', 'healthcare', 'ai']
  },
  {
    id: 'data-004',
    scraperId: 'scraper-004',
    title: 'Customer Support Email',
    content: {
      from: 'customer@example.com',
      subject: 'Issue with product delivery',
      body: 'Hello, I ordered product #12345 but have not received it yet...',
      receivedAt: '2025-10-13T10:15:00Z',
      attachments: []
    },
    contentType: 'text/plain',
    size: 1234,
    metadata: {
      mailbox: 'support',
      priority: 'normal',
      labels: ['customer-support', 'delivery']
    },
    parsingMethod: 'html',
    collectedAt: '2025-10-13T10:30:00Z',
    tags: ['email', 'support', 'delivery']
  },
  {
    id: 'data-005',
    scraperId: 'scraper-005',
    title: 'Technical Documentation.pdf',
    content: 'Binary content of PDF file...',
    contentType: 'application/pdf',
    size: 2345678,
    metadata: {
      fileName: 'technical_docs_v2.1.pdf',
      fileSize: 2345678,
      createdDate: '2025-10-10T14:30:00Z',
      modifiedDate: '2025-10-11T09:15:00Z',
      pages: 125
    },
    parsingMethod: 'raw',
    collectedAt: '2025-10-11T15:20:00Z',
    tags: ['document', 'technical', 'pdf']
  }
];

/**
 * Mock 스크래퍼 실행 로그
 */
export const mockScraperRunLogs: ScraperRunLog[] = [
  {
    id: 'run-001',
    scraperId: 'scraper-001',
    status: 'completed',
    startedAt: '2025-10-13T09:45:00Z',
    completedAt: '2025-10-13T09:45:45Z',
    duration: 45,
    itemsCollected: 23,
    warnings: ['Rate limit almost reached']
  },
  {
    id: 'run-002',
    scraperId: 'scraper-002',
    status: 'completed',
    startedAt: '2025-10-13T10:15:00Z',
    completedAt: '2025-10-13T10:15:13Z',
    duration: 13,
    itemsCollected: 45
  },
  {
    id: 'run-003',
    scraperId: 'scraper-001',
    status: 'error',
    startedAt: '2025-10-13T08:45:00Z',
    completedAt: '2025-10-13T08:45:15Z',
    duration: 15,
    itemsCollected: 0,
    errors: ['Connection timeout', 'Failed to fetch robots.txt']
  },
  {
    id: 'run-004',
    scraperId: 'scraper-003',
    status: 'completed',
    startedAt: '2025-10-12T22:00:00Z',
    completedAt: '2025-10-12T22:03:55Z',
    duration: 235,
    itemsCollected: 156
  },
  {
    id: 'run-005',
    scraperId: 'scraper-004',
    status: 'running',
    startedAt: '2025-10-13T10:30:00Z',
    itemsCollected: 5
  }
];

/**
 * Mock robots.txt 확인 결과
 */
export const mockRobotsCheckResults: Record<string, RobotsCheckResult> = {
  'https://news.ycombinator.com': {
    allowed: true,
    userAgent: 'xgen bot/1.0',
    crawlDelay: 1,
    message: '이 사이트는 크롤링을 허용합니다. 1초의 크롤 지연이 권장됩니다.'
  },
  'https://www.reddit.com': {
    allowed: false,
    userAgent: 'xgen bot/1.0',
    disallowedPaths: ['/api/', '/user/'],
    message: '이 사이트는 특정 경로에 대한 크롤링을 제한합니다.'
  },
  'https://api.example.com': {
    allowed: true,
    userAgent: 'xgen bot/1.0',
    message: 'API 엔드포인트는 robots.txt 제한이 없습니다.'
  },
  'https://www.github.com': {
    allowed: true,
    userAgent: 'xgen bot/1.0',
    crawlDelay: 2,
    disallowedPaths: ['/search', '/api/graphql'],
    message: '이 사이트는 대부분의 페이지에 대해 크롤링을 허용합니다. 2초의 크롤 지연이 권장됩니다.'
  },
  'https://forbidden-site.com': {
    allowed: false,
    userAgent: 'xgen bot/1.0',
    disallowedPaths: ['/'],
    message: '이 사이트는 모든 크롤링을 금지합니다.'
  }
};

/**
 * Mock 데이터 레이크 통계
 */
export const mockDataLakeStats: DataLakeStats = {
  totalItems: 72810,
  totalSize: 2179856901, // ~2.03 GB
  itemsBySourceType: {
    web: 45621,
    document: 12458,
    image: 3456,
    database: 8934,
    email: 2341,
    api: 0
  },
  itemsByParsingMethod: {
    json: 34567,
    html: 28943,
    xml: 5432,
    csv: 2341,
    raw: 1527
  },
  recentItems: 234
};

/**
 * Mock 파싱 결과
 */
export const mockParsedResults: Record<string, ParsedData> = {
  'json-success': {
    success: true,
    data: {
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ],
      total: 2
    },
    method: 'json',
    originalSize: 1234,
    parsedSize: 1156,
    parseTime: 5
  },
  'html-success': {
    success: true,
    data: {
      title: 'Example Page',
      headings: ['Introduction', 'Features', 'Conclusion'],
      paragraphs: 15,
      links: 42,
      images: 8
    },
    method: 'html',
    originalSize: 45678,
    parsedSize: 3456,
    parseTime: 23
  },
  'json-error': {
    success: false,
    error: 'Invalid JSON syntax at line 15: Unexpected token }',
    method: 'json',
    originalSize: 2345,
    parsedSize: 0,
    parseTime: 2
  },
  'html-error': {
    success: false,
    error: 'Failed to parse HTML: Malformed document structure',
    method: 'html',
    originalSize: 12345,
    parsedSize: 0,
    parseTime: 8
  }
};

/**
 * Mock 데이터 가져오기 함수들
 */
export const mockScraperAPI = {
  // 스크래퍼 목록 가져오기
  getScrapers: async (): Promise<ScraperConfig[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockScraperConfigs;
  },

  // 스크래퍼 생성
  createScraper: async (config: Omit<ScraperConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScraperConfig> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const newScraper: ScraperConfig = {
      ...config,
      id: `scraper-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return newScraper;
  },

  // 스크래퍼 업데이트
  updateScraper: async (id: string, updates: Partial<ScraperConfig>): Promise<ScraperConfig> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const scraper = mockScraperConfigs.find(s => s.id === id);
    if (!scraper) throw new Error('Scraper not found');
    return {
      ...scraper,
      ...updates,
      updatedAt: new Date().toISOString()
    };
  },

  // 스크래퍼 삭제
  deleteScraper: async (id: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  },

  // 스크래퍼 통계 가져오기
  getScraperStats: async (scraperId: string): Promise<ScraperStats> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockScraperStats[scraperId] || {
      scraperId,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      totalDataCollected: 0,
      totalDataSize: 0
    };
  },

  // robots.txt 확인
  checkRobotsTxt: async (endpoint: string): Promise<RobotsCheckResult> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockRobotsCheckResults[endpoint] || {
      allowed: true,
      userAgent: 'xgen bot/1.0',
      message: 'robots.txt를 찾을 수 없습니다. 기본적으로 허용됩니다.'
    };
  },

  // 스크래핑 실행
  runScraper: async (scraperId: string): Promise<ScraperRunLog> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return {
      id: `run-${Date.now()}`,
      scraperId,
      status: 'completed',
      startedAt: new Date(Date.now() - 2000).toISOString(),
      completedAt: new Date().toISOString(),
      duration: 2,
      itemsCollected: Math.floor(Math.random() * 50) + 1
    };
  },

  // 수집된 데이터 가져오기
  getScrapedData: async (scraperId?: string): Promise<ScrapedDataItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 400));
    if (scraperId) {
      return mockScrapedData.filter(item => item.scraperId === scraperId);
    }
    return mockScrapedData;
  },

  // 데이터 레이크 통계
  getDataLakeStats: async (): Promise<DataLakeStats> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockDataLakeStats;
  },

  // 데이터 파싱
  parseData: async (dataId: string, method: ParsingMethod): Promise<ParsedData> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const key = `${method}-${Math.random() > 0.8 ? 'error' : 'success'}`;
    return mockParsedResults[key] || mockParsedResults['json-success'];
  },

  // 실행 로그 가져오기
  getRunLogs: async (scraperId?: string): Promise<ScraperRunLog[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (scraperId) {
      return mockScraperRunLogs.filter(log => log.scraperId === scraperId);
    }
    return mockScraperRunLogs;
  }
};
