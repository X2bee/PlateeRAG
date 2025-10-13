// MCP Market 타입 정의
export interface MCPItem {
    id: string;
    name: string;
    author: string;
    description: string;
    iconUrl?: string;
    downloads: number;
    stars: number;
    category: string;
    status: '우수' | '양호' | '일반';
    lastUpdated: string;
    version?: string;
    // MCP 세션 생성에 필요한 정보
    serverType?: 'python' | 'node';
    serverCommand?: string;
    serverArgs?: string[];
    envVars?: Record<string, string>;
    workingDir?: string;
    // 추가 정보
    language?: string;
    features?: string[];
    repository?: string;
    documentation?: string;
}

export interface MCPCategory {
    id: string;
    name: string;
    count: number;
}

export interface MCPSearchFilters {
    category?: string;
    searchQuery?: string;
    sortBy?: 'downloads' | 'stars' | 'updated' | 'name';
}

export interface MCPStats {
    totalDownloads: number;
    totalStars: number;
}
