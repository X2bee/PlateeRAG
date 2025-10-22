import type { NextApiRequest, NextApiResponse } from 'next';
import WebSocket from 'ws';
import { devLog } from '@/app/_common/utils/logger';
import { API_BASE_URL } from '@/app/config';

export const config = {
    api: {
        bodyParser: false,
    },
};

const SUPPORTED_SUFFIXES = new Set(['execute/ws', 'deploy/ws']);

const proxyServer = new WebSocket.Server({ noServer: true });

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.headers.upgrade !== 'websocket') {
        res.status(400).json({ error: 'Expected WebSocket upgrade request' });
        return;
    }

    const segments = Array.isArray(req.query.ws)
        ? req.query.ws
        : typeof req.query.ws === 'string'
            ? [req.query.ws]
            : [];

    const suffix = segments.join('/');

    if (!SUPPORTED_SUFFIXES.has(suffix)) {
        res.status(404).json({ error: 'Unsupported WebSocket route' });
        return;
    }

    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['access_token'];

    if (!token) {
        res.status(401).json({ error: 'Missing access token cookie' });
        return;
    }

    const userId = cookies['user_id'];
    const requestUrl = new URL(req.url ?? '', 'http://localhost');
    const targetPath = `/api/workflow/${suffix}`;
    const backendUrl = resolveBackendWebSocketUrl(targetPath, requestUrl.search);

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
    };

    if (userId) {
        headers['X-User-ID'] = userId;
    }

    devLog.log(`Proxying WebSocket to ${backendUrl}`);

    proxyServer.handleUpgrade(req, req.socket as any, Buffer.alloc(0), (clientSocket) => {
        establishProxy(clientSocket, backendUrl, headers);
    });
}
