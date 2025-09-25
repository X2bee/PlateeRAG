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
    status: '우수' | '일반';
    lastUpdated: string;
    version?: string;
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
