import { API_BASE_URL } from '@/app/config';
import { getAuthCookie } from '@/app/_common/utils/cookieUtils';
import { devLog } from '@/app/_common/utils/logger';

type WorkflowMode = 'execute' | 'deploy';

const MODE_PATHS: Record<WorkflowMode, string> = {
    execute: '/api/workflow/execute/ws',
    deploy: '/api/workflow/deploy/ws',
};

export interface WorkflowStartPayload {
    workflow_name: string;
    workflow_id: string;
    input_data: string;
    interaction_id: string;
    user_id?: number | string | null;
    selected_collections?: Array<string> | null;
    additional_params?: Record<string, Record<string, any>> | null;
}

export interface WorkflowWebSocketCallbacks {
    onReady?: (content: any) => void;
    onStart?: (content: any) => void;
    onData?: (content: string, raw?: any) => void;
    onEnd?: (content?: any) => void;
    onError?: (error: Error, raw?: any) => void;
    onPong?: (content?: any) => void;
    onClose?: (event: CloseEvent) => void;
}

export interface WorkflowWebSocketOptions {
    mode: WorkflowMode;
    payload: WorkflowStartPayload;
    callbacks?: WorkflowWebSocketCallbacks;
    /**
     * Optional override URL. When omitted, the client will infer a URL based on window.location.
     */
    urlOverride?: string;
    /**
     * Existing session identifier to resume.
     */
    sessionId?: string;
    /**
     * Automatically send the start payload once the socket is open. Defaults to true.
     */
    autoStart?: boolean;
    /**
     * Optionally inject a custom logger (default: console in production).
     */
    logger?: {
        log: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
    };
    /**
     * Invoked when the server confirms or assigns a session identifier.
     */
    onSessionEstablished?: (sessionId: string, content: any) => void;
}

export interface WorkflowWebSocketHandle {
    close: (code?: number, reason?: string) => void;
    sendPing: () => void;
    getSocket: () => WebSocket;
}

const isBrowser = () => typeof window !== 'undefined';

const resolveWebSocketUrl = (mode: WorkflowMode, override?: string, sessionId?: string | null) => {
    if (override) return override;

    if (!isBrowser()) {
        throw new Error('WebSocket connections can only be initialised in the browser.');
    }

    const accessToken = getAuthCookie('access_token');
    const userId = getAuthCookie('user_id');

    const applyAuthParams = (url: URL) => {
        if (accessToken) {
            url.searchParams.set('token', accessToken);
        }
        if (userId) {
            url.searchParams.set('user_id', String(userId));
        }
        if (sessionId) {
            url.searchParams.set('session_id', sessionId);
        }
    };

    const baseTarget = API_BASE_URL || `${window.location.origin}`;

    try {
        const url = new URL(MODE_PATHS[mode], baseTarget.endsWith('/') ? baseTarget : `${baseTarget}/`);
        url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        applyAuthParams(url);
        return url.toString();
    } catch (error) {
        devLog.error('[workflow-ws] Failed to construct WebSocket URL from API_BASE_URL', error);
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const fallbackUrl = new URL(`${protocol}://${window.location.host}${MODE_PATHS[mode]}`);
        applyAuthParams(fallbackUrl);
        return fallbackUrl.toString();
    }
};

const defaultLogger = {
    log: (...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(...args);
        }
    },
    warn: (...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(...args);
        }
    },
    error: (...args: any[]) => console.error(...args),
};

export const connectWorkflowWebSocket = ({
    mode,
    payload,
    callbacks = {},
    urlOverride,
    sessionId,
    autoStart = true,
    logger = defaultLogger,
    onSessionEstablished,
}: WorkflowWebSocketOptions): WorkflowWebSocketHandle => {
    const url = resolveWebSocketUrl(mode, urlOverride, sessionId);
    const socket = new WebSocket(url);

    let closedByClient = false;

    const {
        onReady,
        onStart,
        onData,
        onEnd,
        onError,
        onPong,
        onClose,
    } = callbacks;

    const teardown = () => {
        socket.removeEventListener('open', handleOpen);
        socket.removeEventListener('message', handleMessage);
        socket.removeEventListener('error', handleError);
        socket.removeEventListener('close', handleClose);
    };

    const handleOpen = () => {
        logger.log(`[workflow-ws] (${mode}) socket opened`);
        if (autoStart) {
            try {
                socket.send(JSON.stringify({
                    type: 'start',
                    payload,
                }));
            } catch (err) {
                logger.error('[workflow-ws] failed to send start payload', err);
            }
        }
    };

    const handleMessage = (event: MessageEvent) => {
        try {
            const message = JSON.parse(event.data);
            switch (message.type) {
                case 'ready':
                    {
                        const sessionInfo = message.content;
                        const derivedSessionId =
                            sessionInfo?.session_id ??
                            sessionInfo?.sessionId ??
                            message.session_id ??
                            message.sessionId;
                        if (derivedSessionId) {
                            try {
                                onSessionEstablished?.(derivedSessionId, sessionInfo);
                            } catch (err) {
                                logger.error('[workflow-ws] onSessionEstablished callback failed', err);
                            }
                        }
                        onReady?.(sessionInfo);
                    }
                    break;
                case 'start':
                    onStart?.(message.content);
                    break;
                case 'data':
                    onData?.(message.content, message);
                    break;
                case 'end':
                    onEnd?.(message.content);
                    break;
                case 'error': {
                    const error = new Error(message.detail || 'Unknown workflow stream error');
                    onError?.(error, message);
                    break;
                }
                case 'pong':
                    onPong?.(message.content);
                    break;
                default:
                    logger.warn('[workflow-ws] received unknown message type', message);
            }
        } catch (err) {
            logger.error('[workflow-ws] failed to parse message', err, event.data);
            onError?.(err instanceof Error ? err : new Error('Invalid message format'), event.data);
        }
    };

    const handleError = (event: Event) => {
        logger.error('[workflow-ws] socket error', event);
        onError?.(new Error('Workflow WebSocket connection failed'));
    };

    const handleClose = (event: CloseEvent) => {
        logger.log(`[workflow-ws] socket closed (code: ${event.code}, reason: ${event.reason || 'n/a'})`);
        teardown();
        onClose?.(event);
        if (!closedByClient && event.code !== 1000) {
            onError?.(new Error(event.reason || 'Unexpected WebSocket closure'));
        }
    };

    socket.addEventListener('open', handleOpen);
    socket.addEventListener('message', handleMessage);
    socket.addEventListener('error', handleError);
    socket.addEventListener('close', handleClose);

    const close = (code?: number, reason?: string) => {
        if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
            return;
        }
        closedByClient = true;
        socket.close(code, reason);
    };

    const sendPing = () => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
        }
    };

    const getSocket = () => socket;

    return {
        close,
        sendPing,
        getSocket,
    };
};

export interface WorkflowStreamHandle {
    promise: Promise<void>;
    cancel: (reason?: string) => void;
    getSocket: () => WebSocket | null;
}

export interface WorkflowStreamOptions {
    mode: WorkflowMode;
    payload: WorkflowStartPayload;
    callbacks: WorkflowWebSocketCallbacks;
    urlOverride?: string;
    sessionId?: string | null;
    onSessionEstablished?: (sessionId: string, content: any) => void;
    logger?: {
        log: (...args: any[]) => void;
        warn: (...args: any[]) => void;
        error: (...args: any[]) => void;
    };
}

export const runWorkflowStream = ({
    mode,
    payload,
    callbacks,
    urlOverride,
    sessionId,
    onSessionEstablished,
    logger = defaultLogger,
}: WorkflowStreamOptions): WorkflowStreamHandle => {
    let connection: WorkflowWebSocketHandle | null = null;
    let finished = false;
    let endedByMessage = false;
    let cancelRequested = false;
    let finalizeError:
        | ((error: Error, raw?: any, closeCode?: number) => void)
        | null = null;

    const promise = new Promise<void>((resolve, reject) => {
        const finalizeSuccess = () => {
            if (finished) return;
            finished = true;
            connection?.close(1000, 'Workflow stream completed');
            resolve();
        };

        finalizeError = (error: Error, raw?: any, closeCode: number = 1011) => {
            if (finished) return;
            finished = true;

            let processedError = error;
            if (!cancelRequested && callbacks.onError) {
                try {
                    callbacks.onError(error, raw);
                } catch (callbackError) {
                    if (callbackError instanceof Error) {
                        processedError = callbackError;
                    }
                }
            }

            const reason =
                processedError?.message && processedError.message.length > 0
                    ? processedError.message
                    : 'Workflow stream terminated';
            connection?.close(closeCode, reason);
            reject(processedError);
        };

        try {
            connection = connectWorkflowWebSocket({
                mode,
                payload,
                urlOverride,
                sessionId: sessionId ?? undefined,
                logger,
                onSessionEstablished,
                callbacks: {
                    ...callbacks,
                    onEnd: (content) => {
                        endedByMessage = true;
                        try {
                            callbacks.onEnd?.(content);
                        } catch (callbackError) {
                            const error =
                                callbackError instanceof Error
                                    ? callbackError
                                    : new Error('Workflow onEnd callback failed');
                            finalizeError?.(error);
                            return;
                        }
                        finalizeSuccess();
                    },
                    onError: (error, raw) => {
                        logger.error('[workflow-ws] stream error', error);
                        const errInstance =
                            error instanceof Error ? error : new Error(String(error));
                        finalizeError?.(errInstance, raw);
                    },
                    onClose: (event) => {
                        callbacks.onClose?.(event);
                        if (finished) return;
                        if (endedByMessage || event.code === 1000) {
                            finalizeSuccess();
                        } else {
                            const reason =
                                event.reason ||
                                `Workflow WebSocket closed unexpectedly (code ${event.code})`;
                            finalizeError?.(new Error(reason));
                        }
                    },
                },
            });
        } catch (err) {
            const error =
                err instanceof Error ? err : new Error('Failed to open workflow WebSocket');
            finalizeError?.(error);
        }
    });

    const cancel = (reason?: string) => {
        if (finished) return;
        cancelRequested = true;
        const socket = connection?.getSocket();
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                socket.send(JSON.stringify({
                    type: 'cancel',
                    reason: reason || 'Client cancelled streaming',
                    payload: {
                        workflow_id: payload.workflow_id,
                        workflow_name: payload.workflow_name,
                        interaction_id: payload.interaction_id,
                        session_id: sessionId ?? undefined,
                    },
                }));
            } catch (sendError) {
                logger.warn('[workflow-ws] failed to send cancel message', sendError);
            }
        }
        const abortError = new Error(reason || 'Streaming cancelled by user');
        (abortError as any).name = 'AbortError';
        finalizeError?.(abortError, undefined, 4000);
    };

    return {
        promise,
        cancel,
        getSocket: () => connection?.getSocket() ?? null,
    };
};
