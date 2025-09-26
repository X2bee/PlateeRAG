// 더미 데이터 - 실제 API 연동 시 제거될 예정
import { MCPItem, MCPCategory } from './types';

export const mockMCPCategories: MCPCategory[] = [
    { id: 'all', name: '전체', count: 662 },
    { id: 'dev-tools', name: '개발 도구', count: 7657 },
    { id: 'productivity', name: '생산성 도구', count: 1382 },
    { id: 'ai', name: 'AI', count: 290 },
    { id: 'data-analysis', name: '데이터 분석', count: 662 },
    { id: 'business', name: '비즈니스 서비스', count: 817 },
    { id: 'media', name: '미디어 생성', count: 626 },
    { id: 'integration', name: '통합 도구', count: 476 },
    { id: 'other', name: '기타', count: 64 },
];

export const mockMCPItems: MCPItem[] = [
    {
        id: '1',
        name: 'Tavily MCP',
        author: 'tavily-ai',
        description: 'Tavily를 활용한 고급 웹 검색 MCP 서버로, 검색, 추출, 웹페이지 스크래핑 기능을 제공합니다. 이외 추출 기능을 갖추고 있습니다.',
        iconUrl: undefined,
        downloads: 1041,
        stars: 434,
        category: 'ai',
        status: '우수',
        lastUpdated: '2025-09-24',
        version: '4'
    },
    {
        id: '2',
        name: 'Playwright MCP',
        author: 'Microsoft Corporation',
        description: 'Playwright를 사용하는 구조화된 접근적 스크립트 및 웹 페이지 데이터를 통해 웹 사이트를 검색할 수 있는 MCP 서버입니다. 바로 모달 창에도 구조화된 접근성 스크립트를 웹사이트로 배치할 수 있습니다.',
        iconUrl: undefined,
        downloads: 2366,
        stars: 11971,
        category: 'dev-tools',
        status: '우수',
        lastUpdated: '2025-09-21',
        version: '21'
    },
    {
        id: '3',
        name: 'BlenderMCP - Blender Model Context Protocol',
        author: 'ahujasid',
        description: 'BlenderMCP는 Blender와 Claude AI를 Model Context Protocol (MCP)로 통합하는 서버입니다. Blender를 직접 제어하고 상호작용할 수 있도록 합니다.',
        iconUrl: undefined,
        downloads: 564,
        stars: 11579,
        category: 'media',
        status: '우수',
        lastUpdated: '2025-09-15',
        version: '17'
    },
    {
        id: '4',
        name: 'Firecrawl MCP Server',
        author: 'mendableau',
        description: 'Firecrawl 웹 스크래핑 도구을 위한 MCP 서버입니다. 실시간으로 및 자체 호스팅 인스턴스를 모두 지원하며, 웹 스크래핑, 페이지 처리, 구조화된 데이터 추출 나LLM대화 위한 도구를 제공합니다.',
        iconUrl: undefined,
        downloads: 1041,
        stars: 434,
        category: 'integration',
        status: '우수',
        lastUpdated: '2025-09-24',
        version: '6'
    },
    {
        id: '5',
        name: 'Context7 MCP - 최신 코드 이해',
        author: 'apsrch',
        description: 'Context7용 MCP 서버, 라이브러리의 최신 버전과 로깅 코드 예제를 바로 제공하며, Node.js >= v18.0.0 필요타이인 필요합니다.',
        iconUrl: undefined,
        downloads: 1041,
        stars: 434,
        category: 'dev-tools',
        status: '우수',
        lastUpdated: '2025-09-21',
        version: '2'
    },
    {
        id: '6',
        name: 'Postgres MCP Pro',
        author: 'crystaldba',
        description: 'Postgres MCP Pro는 PostgreSQL 데이터베이스를 위한 인덱스 튜닝, 실행 계획 (Explain Plans), 상태 검증 (Health Checks), 고급된 SQL 실행을 제공하는 오픈 소스 도구입니다.',
        iconUrl: undefined,
        downloads: 564,
        stars: 11579,
        category: 'data-analysis',
        status: '우수',
        lastUpdated: '2025-09-15',
        version: '9'
    }
];
