import type { NextApiRequest, NextApiResponse } from 'next';
import { devLog } from '@/app/_common/utils/logger';

type LocalServerConfig = {
    endpoint: string;
    headers?: Record<string, string>;
};

const DEFAULT_LOCAL_SERVERS: Record<string, LocalServerConfig> = {
    'local-python': {
        endpoint: process.env.LOCAL_PYTHON_MCP_URL || 'http://127.0.0.1:4637/mcp',
    },
};

const normalizeHeaders = (headers?: Record<string, unknown>) => {
    if (!headers || typeof headers !== 'object') return undefined;
    const normalized: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
        if (typeof key !== 'string') return;
        if (value === undefined || value === null) return;
        normalized[key] = String(value);
    });
    return Object.keys(normalized).length > 0 ? normalized : undefined;
};

const respondWithError = (res: NextApiResponse, status: number, message: string) => {
    res.status(status).json({
        success: false,
        error: message,
    });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        respondWithError(res, 405, 'Method Not Allowed');
        return;
    }

    const { server = 'local-python', payload, options } = req.body ?? {};
    const serverName = typeof server === 'string' ? server : 'local-python';

    if (!payload || typeof payload !== 'object') {
        respondWithError(res, 400, 'Invalid MCP payload');
        return;
    }

    const requestedEndpoint = typeof options?.endpoint === 'string' ? options.endpoint : undefined;
    const requestedHeaders = normalizeHeaders(options?.headers);

    const serverConfig = DEFAULT_LOCAL_SERVERS[serverName];
    const endpoint = requestedEndpoint || serverConfig?.endpoint;

    if (!endpoint) {
        respondWithError(res, 400, `No endpoint available for MCP server: ${serverName}`);
        return;
    }

    const baseHeaders = serverConfig?.headers ?? {};
    const mergedHeaders = {
        'Content-Type': 'application/json',
        ...baseHeaders,
        ...(requestedHeaders ?? {}),
    };

    const abortController = new AbortController();
    const { signal } = abortController;

    const cleanupAbortListener = () => {
        req.socket?.removeListener('close', handleSocketClose);
    };

    const handleSocketClose = () => {
        if (!signal.aborted) {
            abortController.abort();
        }
    };

    req.socket?.once('close', handleSocketClose);

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: mergedHeaders,
            body: JSON.stringify(payload),
            signal,
        });

        const contentType = response.headers.get('content-type') ?? 'application/json';
        const buffer = Buffer.from(await response.arrayBuffer());

        res.status(response.status);
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
    } catch (error) {
        if ((error as any)?.name === 'AbortError') {
            devLog.warn('Local MCP proxy aborted due to client disconnect');
            return;
        }

        devLog.error('Local MCP proxy error', error);
        respondWithError(res, 502, (error as Error)?.message || 'Failed to reach local MCP server');
    } finally {
        cleanupAbortListener();
    }
}
