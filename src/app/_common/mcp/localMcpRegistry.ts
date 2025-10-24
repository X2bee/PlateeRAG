import { McpServerDescriptor, LocalMcpCallFn, LocalMcpProxyOptions, defaultCallLocalMcp } from './localMcpBridge';

export interface RegisteredLocalMcpServer extends McpServerDescriptor {
    endpoint: string;
    headers?: Record<string, string>;
}

const STORAGE_KEY = 'plateerag.mcpServers.v1';

const FALLBACK_SERVERS: RegisteredLocalMcpServer[] = [
    {
        name: 'local-python',
        description: 'Local Python MCP via bridge',
        meta: { version: '0.1.0' },
        endpoint: 'http://127.0.0.1:4637/mcp',
    },
];

const supportsStorage = () => typeof window !== 'undefined' && !!window.localStorage;

const sanitizeHeaders = (headers?: Record<string, unknown>): Record<string, string> | undefined => {
    if (!headers || typeof headers !== 'object') return undefined;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (typeof key !== 'string') continue;
        if (value === undefined || value === null) continue;
        result[key] = String(value);
    }
    return Object.keys(result).length > 0 ? result : undefined;
};

const sanitizeServer = (server: any): RegisteredLocalMcpServer | null => {
    if (!server || typeof server !== 'object') return null;
    if (typeof server.name !== 'string') return null;
    if (typeof server.endpoint !== 'string') return null;

    const descriptor: RegisteredLocalMcpServer = {
        name: server.name,
        endpoint: server.endpoint,
        description: typeof server.description === 'string' ? server.description : undefined,
        meta: typeof server.meta === 'object' && server.meta !== null ? server.meta : undefined,
        headers: sanitizeHeaders(server.headers),
    };

    return descriptor;
};

export const loadRegisteredLocalMcpServers = (): RegisteredLocalMcpServer[] => {
    if (!supportsStorage()) {
        return [...FALLBACK_SERVERS];
    }

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return [...FALLBACK_SERVERS];
        }
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [...FALLBACK_SERVERS];
        }

        const sanitized: RegisteredLocalMcpServer[] = [];
        for (const server of parsed) {
            const clean = sanitizeServer(server);
            if (clean) {
                sanitized.push(clean);
            }
        }

        return sanitized.length > 0 ? sanitized : [...FALLBACK_SERVERS];
    } catch (error) {
        console.error('[mcp-registry] Failed to load servers from storage', error);
        return [...FALLBACK_SERVERS];
    }
};

export const saveRegisteredLocalMcpServers = (servers: RegisteredLocalMcpServer[]) => {
    if (!supportsStorage()) return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(servers));
    } catch (error) {
        console.error('[mcp-registry] Failed to save servers to storage', error);
    }
};

export const registerLocalMcpServer = (server: RegisteredLocalMcpServer) => {
    const servers = loadRegisteredLocalMcpServers();
    const filtered = servers.filter((existing) => existing.name !== server.name);
    filtered.push(server);
    saveRegisteredLocalMcpServers(filtered);
    return filtered;
};

export const removeLocalMcpServer = (serverName: string) => {
    const servers = loadRegisteredLocalMcpServers();
    const filtered = servers.filter((existing) => existing.name !== serverName);
    saveRegisteredLocalMcpServers(filtered);
    return filtered;
};

export const getAdvertisableLocalMcpServers = (): McpServerDescriptor[] => {
    return loadRegisteredLocalMcpServers().map(({ name, description, meta }) => ({
        name,
        description,
        meta,
    }));
};

const createCallerFromRegistry = (servers: RegisteredLocalMcpServer[]): LocalMcpCallFn => {
    const lookup = new Map<string, RegisteredLocalMcpServer>();
    for (const server of servers) {
        lookup.set(server.name, server);
    }

    return (serverName: string, payload, signal, options?: LocalMcpProxyOptions) => {
        const serverConfig = lookup.get(serverName) ?? servers[0];
        if (!serverConfig) {
            throw new Error(`No configured MCP server available for ${serverName}`);
        }
        const mergedOptions: LocalMcpProxyOptions = {
            endpoint: options?.endpoint ?? serverConfig.endpoint,
            headers: options?.headers ?? serverConfig.headers,
        };
        return defaultCallLocalMcp(serverName, payload, signal, mergedOptions);
    };
};

export const getLocalMcpBridgeConfig = (): {
    servers: RegisteredLocalMcpServer[];
    callLocalMcp: LocalMcpCallFn;
} => {
    const servers = loadRegisteredLocalMcpServers();
    return {
        servers,
        callLocalMcp: createCallerFromRegistry(servers),
    };
};
