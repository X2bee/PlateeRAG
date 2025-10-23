import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HttpServer } from 'http';
import type { Socket } from 'net';
import WebSocket from 'ws';
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';

export const config = {
    api: {
        bodyParser: false,
    },
};

const SUPPORTED_PATHS = new Set([
    '/api/workflow/execute/ws',
    '/api/workflow/deploy/ws',
]);

type SocketServerWithProxy = HttpServer & {
    workflowWsProxy?: {
        server: WebSocket.Server;
    };
};

const parseCookies = (cookieHeader?: string) => {
    const cookies: Record<string, string> = {};
    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach((cookie) => {
        const [name, ...rest] = cookie.split('=');
        if (!name) return;
        cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
    });

    return cookies;
};

const resolveBackendWebSocketUrl = (path: string, search: string) => {
    const base = API_BASE_URL || 'http://localhost';
    try {
        const url = new URL(base);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        url.pathname = path;
        url.search = search;
        return url.toString();
    } catch (error) {
        devLog.error('Failed to resolve backend WebSocket URL, falling back', error);
        const protocol = base.startsWith('https') ? 'wss' : 'ws';
        const trimmed = base.replace(/^https?:\/\//, '');
        return `${protocol}://${trimmed}${path}${search}`;
    }
};

const toReasonString = (reason?: string | Buffer) => {
    if (!reason) return '';
    if (typeof reason === 'string') return reason;
    return reason.toString();
};

const bridgeSockets = (
    clientSocket: WebSocket,
    backendSocket: WebSocket,
) => {
    const safeClose = (socket: WebSocket, code: number, reason: string) => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
            socket.close(code, reason);
        }
    };

    clientSocket.on('message', (data) => {
        if (backendSocket.readyState === WebSocket.OPEN) {
            backendSocket.send(data);
        } else if (backendSocket.readyState === WebSocket.CONNECTING) {
            backendSocket.once('open', () => backendSocket.send(data));
        }
    });

    backendSocket.on('message', (data) => {
        if (clientSocket.readyState === WebSocket.OPEN) {
            clientSocket.send(data);
        }
    });

    clientSocket.on('close', (code, reason) => {
        safeClose(backendSocket, code ?? 1000, toReasonString(reason));
    });

    backendSocket.on('close', (code, reason) => {
        safeClose(clientSocket, code ?? 1000, toReasonString(reason));
    });

    clientSocket.on('error', (error) => {
        devLog.error('Client WebSocket error', error);
        safeClose(backendSocket, 1011, 'Client WebSocket error');
    });

    backendSocket.on('error', (error) => {
        devLog.error('Backend WebSocket error', error);
        safeClose(clientSocket, 1011, 'Backend WebSocket error');
    });
};

const establishProxy = (
    clientSocket: WebSocket,
    backendUrl: string,
    headers: Record<string, string>,
) => {
    const backendSocket = new WebSocket(backendUrl, { headers });

    backendSocket.on('open', () => {
        devLog.log(`Connected to backend WebSocket ${backendUrl}`);
    });

    backendSocket.on('error', (error) => {
        devLog.error('Failed to connect to backend WebSocket', error);
        if (clientSocket.readyState === WebSocket.OPEN || clientSocket.readyState === WebSocket.CONNECTING) {
            clientSocket.close(1011, 'Backend WebSocket connection failed');
        }
    });

    bridgeSockets(clientSocket, backendSocket);
};

const ensureProxyServer = (server: SocketServerWithProxy) => {
    if (server.workflowWsProxy) {
        return server.workflowWsProxy.server;
    }

    const proxyServer = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (request: any, socket: Socket, head: Buffer) => {
        try {
            const requestUrl = new URL(request.url ?? '', 'http://localhost');
            const pathname = requestUrl.pathname;

            if (!pathname || !SUPPORTED_PATHS.has(pathname)) {
                return;
            }

            const cookies = parseCookies(request.headers.cookie);
            const queryToken = requestUrl.searchParams.get('token') ?? undefined;
            const queryUserId = requestUrl.searchParams.get('user_id') ?? undefined;
            const token = queryToken || cookies['access_token'];

            if (!token) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            const backendUrl = resolveBackendWebSocketUrl(pathname, requestUrl.search);
            const headers: Record<string, string> = {
                Authorization: `Bearer ${token}`,
            };

            const userIdHeader = queryUserId || cookies['user_id'];
            if (userIdHeader) {
                headers['X-User-ID'] = userIdHeader;
            }

            let sanitizedTarget = backendUrl;
            try {
                const safeUrl = new URL(backendUrl);
                if (safeUrl.searchParams.has('token')) {
                    safeUrl.searchParams.set('token', '[redacted]');
                }
                sanitizedTarget = safeUrl.toString();
            } catch (sanitizeError) {
                devLog.warn('Failed to sanitize backend WebSocket URL for logging', sanitizeError);
            }
            devLog.log(`Proxying WebSocket to ${sanitizedTarget}`);

            proxyServer.handleUpgrade(request, socket, head, (clientSocket) => {
                establishProxy(clientSocket, backendUrl, headers);
            });
        } catch (error) {
            devLog.error('WebSocket proxy upgrade failed', error);
            socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
            socket.destroy();
        }
    });

    server.workflowWsProxy = { server: proxyServer };
    return proxyServer;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const socketServer = res.socket?.server as SocketServerWithProxy | undefined;

    if (!socketServer) {
        res.status(500).json({ error: 'Socket server unavailable' });
        return;
    }

    ensureProxyServer(socketServer);

    // For HTTP requests hitting this route (non-upgrade), respond with 200.
    if (req.headers.upgrade !== 'websocket') {
        res.status(200).json({ status: 'ok' });
        return;
    }

    // If an upgrade request slips through, it will be handled by the upgrade listener.
    res.status(426).end();
}
