export interface McpServerDescriptor {
    name: string;
    description?: string;
    meta?: Record<string, unknown>;
}

export interface McpCapabilitiesPayload {
    servers: McpServerDescriptor[];
    platform: string;
    support: string[];
}

export interface McpRequestPayload {
    method: string;
    tool?: string;
    arguments?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface McpRequestMessage {
    type: 'mcp_request';
    content: {
        request_id: string;
        session_id: string;
        connection_id: string;
        server?: string;
        payload: McpRequestPayload;
    };
}

export interface McpCancelMessage {
    type: 'mcp_cancel' | 'cancel';
    payload?: {
        request_id?: string;
    };
    content?: {
        request_id?: string;
    };
}

export interface LocalMcpProxyOptions {
    endpoint?: string;
    headers?: Record<string, string>;
}

export type LocalMcpCallFn = (
    server: string,
    payload: McpRequestPayload,
    signal?: AbortSignal,
    options?: LocalMcpProxyOptions,
) => Promise<any>;

export interface LocalMcpBridgeOptions {
    socket: WebSocket;
    servers?: McpServerDescriptor[];
    support?: string[];
    platform?: string;
    callLocalMcp?: LocalMcpCallFn;
    logger?: {
        log: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
    };
}

const DEFAULT_SERVERS: McpServerDescriptor[] = [
    {
        name: 'local-python',
        description: 'Local Python MCP via bridge',
        meta: { version: '0.1.0' },
    },
];

const DEFAULT_SUPPORT: string[] = ['tools/list', 'tools/call'];

const detectPlatform = (): string => {
    if (typeof process !== 'undefined' && typeof process.platform === 'string') {
        return process.platform;
    }
    if (typeof navigator !== 'undefined') {
        const uaDataPlatform = (navigator as any).userAgentData?.platform;
        if (uaDataPlatform && typeof uaDataPlatform === 'string') {
            return uaDataPlatform;
        }
        if (navigator.platform) {
            return navigator.platform;
        }
    }
    return 'web';
};

const defaultLogger = {
    log: (...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log('[mcp-bridge]', ...args);
        }
    },
    warn: (...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[mcp-bridge]', ...args);
        }
    },
    error: (...args: any[]) => console.error('[mcp-bridge]', ...args),
};

const LOCAL_PROXY_ENDPOINT = '/api/mcp/local';

export const defaultCallLocalMcp: LocalMcpCallFn = async (server, payload, signal, options) => {
    const body = JSON.stringify({
        server,
        payload,
        options,
    });

    const response = await fetch(LOCAL_PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body,
        signal,
        credentials: 'include',
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        const errorDetail = errorText || `Local MCP invocation failed (status ${response.status})`;
        throw new Error(errorDetail);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return response.text();
};

interface PendingRequest {
    abortController?: AbortController;
}

export class LocalMcpBridge {
    private readonly socket: WebSocket;
    private readonly servers: McpServerDescriptor[];
    private readonly support: string[];
    private readonly platform: string;
    private readonly callLocalMcp: LocalMcpCallFn;
    private readonly logger: typeof defaultLogger;
    private readonly pendingRequests = new Map<string, PendingRequest>();
    private advertised = false;
    private closed = false;

    constructor({
        socket,
        servers = DEFAULT_SERVERS,
        support = DEFAULT_SUPPORT,
        platform = detectPlatform(),
        callLocalMcp = defaultCallLocalMcp,
        logger = defaultLogger,
    }: LocalMcpBridgeOptions) {
        this.socket = socket;
        this.servers = servers;
        this.support = support;
        this.platform = platform;
        this.callLocalMcp = callLocalMcp;
        this.logger = logger;
    }

    advertiseCapabilities() {
        if (this.advertised) return;
        if (this.socket.readyState !== WebSocket.OPEN) {
            this.logger.warn('Attempted to advertise MCP capabilities before socket open');
            return;
        }
        const payload: McpCapabilitiesPayload = {
            servers: this.servers,
            platform: this.platform,
            support: this.support,
        };
        try {
            this.socket.send(JSON.stringify({
                type: 'mcp_capabilities',
                payload,
            }));
            this.advertised = true;
            this.logger.log('Advertised MCP capabilities', payload);
        } catch (error) {
            this.logger.error('Failed to send MCP capabilities', error);
        }
    }

    handleReady() {
        this.advertiseCapabilities();
    }

    handleServerMessage(message: any): boolean {
        if (!message || typeof message !== 'object') return false;

        switch (message.type) {
            case 'mcp_capabilities_ack': {
                this.logger.log('MCP capabilities acknowledged by server', message.payload);
                return true;
            }
            case 'mcp_request':
                this.handleMcpRequest(message as McpRequestMessage);
                return true;
            case 'mcp_cancel':
            case 'cancel':
                return this.handleCancel(message as McpCancelMessage);
            default:
                return false;
        }
    }

    teardown(reason?: string) {
        const shouldNotify = !this.closed && reason && this.socket.readyState === WebSocket.OPEN;
        this.closed = true;

        for (const [requestId, pending] of this.pendingRequests.entries()) {
            if (pending.abortController && !pending.abortController.signal.aborted) {
                pending.abortController.abort();
            }
            this.pendingRequests.delete(requestId);
        }

        if (shouldNotify) {
            try {
                this.socket.send(JSON.stringify({
                    type: 'mcp_bridge_closed',
                    payload: { reason },
                }));
            } catch (error) {
                this.logger.warn('Failed to notify server about MCP bridge closure', error);
            }
        }
    }

    private handleMcpRequest(message: McpRequestMessage) {
        const requestId = message.content?.request_id;
        const payload = message.content?.payload;
        const server = message.content?.server ?? this.servers[0]?.name ?? 'local-python';

        if (!requestId || !payload) {
            this.logger.warn('Received malformed MCP request', message);
            return;
        }

        const abortController = typeof AbortController !== 'undefined' ? new AbortController() : undefined;
        this.pendingRequests.set(requestId, { abortController });

        this.logger.log('Handling MCP request', { requestId, server, payload });

        this.callLocalMcp(server, payload, abortController?.signal)
            .then((result) => {
                this.sendResponse(requestId, result);
            })
            .catch((error) => {
                if (abortController?.signal?.aborted) {
                    this.logger.log('MCP request aborted', requestId);
                    this.sendError(requestId, 'Local MCP request aborted');
                    return;
                }
                const messageText = error instanceof Error ? error.message : String(error);
                this.logger.error('Local MCP request failed', error);
                this.sendError(requestId, messageText || 'Local MCP invocation failed');
            })
            .finally(() => {
                this.pendingRequests.delete(requestId);
            });
    }

    private handleCancel(message: McpCancelMessage): boolean {
        const requestId = message.payload?.request_id ?? message.content?.request_id;
        if (!requestId) {
            this.logger.warn('Received MCP cancel without request_id', message);
            return true;
        }

        const pending = this.pendingRequests.get(requestId);
        if (!pending) {
            this.logger.warn('No pending MCP request for cancel', requestId);
            return true;
        }

        if (pending.abortController && !pending.abortController.signal.aborted) {
            pending.abortController.abort();
        }
        this.pendingRequests.delete(requestId);
        this.logger.log('Cancelled MCP request', requestId);
        return true;
    }

    private sendResponse(requestId: string, result: any) {
        if (this.socket.readyState !== WebSocket.OPEN) {
            this.logger.warn('Cannot send MCP response, socket closed', requestId);
            return;
        }

        try {
            this.socket.send(JSON.stringify({
                type: 'mcp_response',
                payload: {
                    request_id: requestId,
                    success: true,
                    result,
                },
            }));
        } catch (error) {
            this.logger.error('Failed to send MCP response', error);
        }
    }

    private sendError(requestId: string, errorMessage: string) {
        if (this.socket.readyState !== WebSocket.OPEN) {
            this.logger.warn('Cannot send MCP error, socket closed', requestId);
            return;
        }

        try {
            this.socket.send(JSON.stringify({
                type: 'mcp_error',
                payload: {
                    request_id: requestId,
                    error: errorMessage || 'Local MCP invocation failed',
                },
            }));
        } catch (error) {
            this.logger.error('Failed to send MCP error response', error);
        }
    }
}
