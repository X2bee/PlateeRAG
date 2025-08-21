import { devLog } from './logger';

export interface SSEMessage {
    type: 'tester_start' | 'group_start' | 'test_result' | 'progress' | 'tester_complete' | 'error' | 'eval_start' | 'eval_result' | 'eval_error' | 'eval_complete';
    batch_id?: string;
    total_count?: number;
    batch_size?: number;
    workflow_name?: string;
    group_number?: number;
    group_size?: number;
    progress?: number;
    result?: any;
    completed_count?: number;
    elapsed_time?: number;
    success_count?: number;
    error_count?: number;
    total_execution_time?: number;
    message?: string;
    error?: string;
    test_id?: number;
    llm_eval_score?: number;
}

export interface SSEConnectionOptions {
    workflowId: string;
    onMessage: (data: SSEMessage) => void;
    onEnd: () => void;
    onError: (error: Error) => void;
}

class SSEManager {
    private connections: Map<string, AbortController> = new Map();
    private connectionStates: Map<string, 'connecting' | 'connected' | 'disconnected' | 'error'> = new Map();

    public isConnected(workflowId: string): boolean {
        return this.connectionStates.get(workflowId) === 'connected';
    }

    public getConnectionState(workflowId: string): string {
        return this.connectionStates.get(workflowId) || 'disconnected';
    }

    public createConnection(workflowId: string, options: SSEConnectionOptions): AbortController {
        // 기존 연결이 있다면 정리
        this.closeConnection(workflowId);

        const abortController = new AbortController();
        this.connections.set(workflowId, abortController);
        this.connectionStates.set(workflowId, 'connecting');

        devLog.log(`SSE 연결 생성: ${workflowId}`);

        // 연결 상태 모니터링
        const checkConnection = () => {
            if (abortController.signal.aborted) {
                this.connectionStates.set(workflowId, 'disconnected');
                this.connections.delete(workflowId);
            }
        };

        // 주기적으로 연결 상태 확인
        const connectionCheck = setInterval(checkConnection, 1000);

        abortController.signal.addEventListener('abort', () => {
            clearInterval(connectionCheck);
            this.connectionStates.set(workflowId, 'disconnected');
            this.connections.delete(workflowId);
            devLog.log(`SSE 연결 해제: ${workflowId}`);
        });

        return abortController;
    }

    public closeConnection(workflowId: string): void {
        const controller = this.connections.get(workflowId);
        if (controller) {
            controller.abort();
            this.connections.delete(workflowId);
            this.connectionStates.set(workflowId, 'disconnected');
            devLog.log(`SSE 연결 강제 해제: ${workflowId}`);
        }
    }

    public closeAllConnections(): void {
        devLog.log(`모든 SSE 연결 해제 시작: ${this.connections.size}개 연결`);

        this.connections.forEach((controller, workflowId) => {
            controller.abort();
            this.connectionStates.set(workflowId, 'disconnected');
        });

        this.connections.clear();
        devLog.log('모든 SSE 연결 해제 완료');
    }

    public getActiveConnections(): string[] {
        return Array.from(this.connections.keys());
    }

    public hasActiveConnections(): boolean {
        return this.connections.size > 0;
    }

    // 페이지 언로드 시 정리
    public setupCleanup(): void {
        if (typeof window !== 'undefined') {
            const cleanup = () => {
                devLog.log('페이지 언로드: SSE 연결 정리');
                this.closeAllConnections();
            };

            window.addEventListener('beforeunload', cleanup);
            window.addEventListener('unload', cleanup);

            // Visibility API를 사용하여 탭이 숨겨질 때도 정리
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    devLog.log('탭 숨김: SSE 연결 일시 정리');
                    // 필요에 따라 연결을 유지하거나 정리할 수 있음
                }
            });
        }
    }
}

// 싱글톤 인스턴스
export const sseManager = new SSEManager();

// 브라우저 환경에서만 정리 설정
if (typeof window !== 'undefined') {
    sseManager.setupCleanup();
}

export default sseManager;
