// 더미 데이터 - 실제 API 연동 시 제거될 예정
import { MCPItem, MCPCategory } from './types';

export const mockMCPCategories: MCPCategory[] = [
    { id: 'all', name: '전체', count: 2 },
    { id: 'dev-tools', name: '개발 도구', count: 2 },
    { id: 'productivity', name: '생산성 도구', count: 0 },
    { id: 'ai', name: 'AI', count: 0 },
    { id: 'data-analysis', name: '데이터 분석', count: 0 },
    { id: 'business', name: '비즈니스 서비스', count: 0 },
    { id: 'media', name: '미디어 생성', count: 0 },
    { id: 'integration', name: '통합 도구', count: 0 },
    { id: 'other', name: '기타', count: 0 },
];

export const mockMCPItems: MCPItem[] = [
    {
        id: 'mcpcentral-io-mcp-time',
        name: 'MCP Time Server',
        author: 'mcpcentral-io',
        description: 'MCP 시간 서버는 로컬 및 원격 액세스를 위한 이중 모드 지원을 갖춘 포괄적인 시간 관련 도구를 제공하는 프로토콜 서버입니다. 현재 시간 조회, 상대 시간 계산, 날짜 및 시간 변환, 시간대 관리, 달력 정보 등의 기능을 제공합니다.',
        iconUrl: undefined,
        downloads: 9,
        stars: 6,
        category: 'dev-tools',
        status: '양호',
        lastUpdated: '2025-10-13',
        version: '0.0.2',
        // MCP 세션 생성에 필요한 정보
        serverType: 'node',
        serverCommand: 'npx',
        serverArgs: ['@mcpcentral/mcp-time'],
        envVars: undefined,
        workingDir: undefined,
        // 추가 정보
        language: 'JavaScript',
        features: [
            'current_time: 지정된 형식과 시간대의 현재 날짜 및 시간 가져오기',
            'relative_time: 사람이 읽을 수 있는 상대 시간 문자열 가져오기',
            'days_in_month: 특정 월의 일수 가져오기',
            'get_timestamp: 주어진 시간의 Unix 타임스탬프 가져오기',
            'convert_time: 서로 다른 IANA 시간대 간 시간 변환',
            'get_week_year: 주어진 날짜의 주 번호 및 ISO 주 번호 가져오기'
        ],
        repository: 'https://github.com/mcpcentral-io/mcp-time',
        documentation: 'https://guide-gen.mcpcentral.io/servers/io-github-mcpcentral-io-mcp-time'
    },
    {
        id: 'aashari-mcp-server-atlassian-jira',
        name: 'Atlassian Jira MCP Server',
        author: 'aashari',
        description: 'Atlassian Jira MCP 서버는 AI 통합을 통해 Jira 프로젝트와 이슈를 관리하는 도구 세트입니다. 프로젝트 관리, 이슈 관리, 개발 인사이트, 댓글 및 작업 로그 처리, 워크플로우 탐색 등의 기능을 제공합니다.',
        iconUrl: undefined,
        downloads: 11,
        stars: 10,
        category: 'dev-tools',
        status: '양호',
        lastUpdated: '2025-10-04',
        version: '1.37.1',
        // MCP 세션 생성에 필요한 정보
        serverType: 'node',
        serverCommand: 'npx',
        serverArgs: ['-y', '@aashari/mcp-server-atlassian-jira'],
        envVars: {
            'ATLASSIAN_SITE_NAME': '<YOUR_SITE_NAME>',
            'ATLASSIAN_USER_EMAIL': '<YOUR_EMAIL>',
            'ATLASSIAN_API_TOKEN': '<YOUR_API_TOKEN>'
        },
        workingDir: undefined,
        // 추가 정보
        language: 'TypeScript',
        features: [
            'jira_ls_projects: 접근 가능한 Jira 프로젝트 목록 조회',
            'jira_get_project: 프로젝트의 상세 정보 및 메타데이터 조회',
            'jira_ls_issues: JQL을 이용한 이슈 검색 및 필터링',
            'jira_get_issue: 댓글 및 개발 정보를 포함한 이슈 상세 조회',
            'jira_ls_comments: 이슈의 댓글 목록 조회',
            'jira_add_comment: 이슈에 댓글 추가',
            'jira_ls_statuses: 워크플로우 상태 목록 조회'
        ],
        repository: 'https://github.com/aashari/mcp-server-atlassian-jira',
        documentation: 'https://github.com/aashari/mcp-server-atlassian-jira#readme'
    }
];
