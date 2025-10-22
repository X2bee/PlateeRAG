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
}

export interface WorkflowWebSocketHandle {
    close: (code?: number, reason?: string) => void;
    sendPing: () => void;
    getSocket: () => WebSocket;
}

const isBrowser = () => typeof window !== 'undefined';

const resolveWebSocketUrl = (mode: WorkflowMode, override?: string) => {
    if (override) return override;
    if (!isBrowser()) {
        throw new Error('WebSocket connections can only be initialised in the browser.');
    }
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://${window.location.host}${MODE_PATHS[mode]}`;
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
    autoStart = true,
    logger = defaultLogger,
}: WorkflowWebSocketOptions): WorkflowWebSocketHandle => {
    const url = resolveWebSocketUrl(mode, urlOverride);
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
                    onReady?.(message.content);
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

export interface WorkflowStreamOptions {
    mode: WorkflowMode;
    payload: WorkflowStartPayload;
    callbacks: WorkflowWebSocketCallbacks;
    urlOverride?: string;
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
    logger = defaultLogger,
}: WorkflowStreamOptions): Promise<void> => {
    return new Promise((resolve, reject) => {
        let finished = false;
        let endedByMessage = false;
        let connection: WorkflowWebSocketHandle | null = null;

        const finalizeSuccess = () => {
            if (finished) return;
            finished = true;
            connection?.close(1000, 'Workflow stream completed');
            resolve();
        };

        const finalizeError = (error: Error, raw?: any) => {
            if (finished) return;
            finished = true;
            let finalError = error;
            if (callbacks.onError) {
                try {
                    callbacks.onError(error, raw);
                } catch (callbackError) {
                    if (callbackError instanceof Error) {
                        finalError = callbackError;
                    }
                }
            }
            connection?.close(1011, finalError.message);
            reject(finalError);
        };

        try {
            connection = connectWorkflowWebSocket({
                mode,
                payload,
                urlOverride,
                logger,
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
                            finalizeError(error);
                            return;
                        }
                        finalizeSuccess();
                    },
                    onError: (error, raw) => {
                        logger.error('[workflow-ws] stream error', error);
                        finalizeError(error, raw);
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
                            finalizeError(new Error(reason));
                        }
                    },
                },
            });
        } catch (err) {
            const error = err instanceof Error ? err : new Error('Failed to open workflow WebSocket');
            finalizeError(error);
        }
    });
};
