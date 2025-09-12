import { devLog } from '@/app/_common/utils/logger';

export interface ChatMode {
    type: 'regular' | 'session' | 'workflow' | 'deploy';
    sessionId?: string;
    workflowId?: string;
    workflowName?: string;
    interactionId?: string;
}

export class ChatNavigationManager {
    
    // 일반 채팅으로 이동
    static navigateToRegularChat(router: any): void {
        const url = '/chat?mode=new-chat';
        devLog.log('Navigating to regular chat:', url);
        router.push(url);
    }

    // 새 세션 채팅으로 이동
    static navigateToNewSessionChat(router: any, sessionName?: string): void {
        const sessionId = `session-${Date.now()}`;
        const url = `/session-chat?session=${sessionId}`;
        
        devLog.log('Navigating to new session chat:', url);
        router.push(url);
    }

    // 기존 세션 채팅으로 이동
    static navigateToExistingSessionChat(router: any, sessionId: string): void {
        const url = `/session-chat?session=${sessionId}`;
        devLog.log('Navigating to existing session chat:', url);
        router.push(url);
    }

    // 워크플로우 채팅으로 이동
    static navigateToWorkflowChat(router: any, workflowId: string, workflowName: string): void {
        const url = `/chat?mode=new-workflow&workflowId=${workflowId}&workflowName=${encodeURIComponent(workflowName)}`;
        devLog.log('Navigating to workflow chat:', url);
        router.push(url);
    }

    // 기존 채팅으로 복귀
    static navigateToExistingChat(router: any, interactionId: string, workflowId: string, workflowName: string): void {
        const url = `/chat?mode=existing&interaction_id=${interactionId}&workflow_id=${workflowId}&workflow_name=${encodeURIComponent(workflowName)}`;
        devLog.log('Navigating to existing chat:', url);
        router.push(url);
    }

    // 현재 채팅 모드 감지
    static detectCurrentChatMode(pathname: string, searchParams: URLSearchParams): ChatMode {
        if (pathname.includes('/session-chat')) {
            return {
                type: 'session',
                sessionId: searchParams.get('session') || undefined
            };
        }

        const mode = searchParams.get('mode');
        const workflowId = searchParams.get('workflowId');
        const workflowName = searchParams.get('workflowName');
        const interactionId = searchParams.get('interaction_id');

        if (mode === 'deploy') {
            return {
                type: 'deploy',
                workflowId: workflowId || undefined,
                workflowName: workflowName || undefined,
                interactionId: interactionId || undefined
            };
        }

        if (mode === 'existing' || mode === 'new-workflow') {
            return {
                type: 'workflow',
                workflowId: workflowId || undefined,
                workflowName: workflowName || undefined,
                interactionId: interactionId || undefined
            };
        }

        return { type: 'regular' };
    }

    // 채팅 모드에 따른 제목 생성
    static getChatModeTitle(mode: ChatMode): string {
        switch (mode.type) {
            case 'session':
                return `세션 채팅 - ${mode.sessionId || 'Unknown'}`;
            case 'workflow':
                return `워크플로우 - ${mode.workflowName || 'Unknown'}`;
            case 'deploy':
                return `배포된 워크플로우 - ${mode.workflowName || 'Unknown'}`;
            default:
                return '일반 채팅';
        }
    }

    // 채팅 모드 간 데이터 마이그레이션
    static async migrateToSessionChat(
        currentMessages: any[],
        currentWorkflow: any,
        router: any
    ): Promise<string> {
        const sessionId = `migrated-${Date.now()}`;
        
        // 세션 매니저를 사용하여 새 세션 생성
        const { SessionManager } = await import('./sessionManager');
        
        const sessionData = {
            sessionId,
            sessionName: `마이그레이션된 세션 - ${new Date().toLocaleString()}`,
            messages: currentMessages,
            workflow: currentWorkflow,
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };

        SessionManager.saveSessionData(sessionData);
        
        devLog.log('Migrated chat to session:', sessionId);
        
        // 새 세션으로 이동
        this.navigateToExistingSessionChat(router, sessionId);
        
        return sessionId;
    }

    // URL에서 초기 메시지 추출
    static extractInitialMessage(searchParams: URLSearchParams): string | null {
        return searchParams.get('initial_message') || 
               searchParams.get('message') || 
               null;
    }

    // 브라우저 히스토리 관리
    static replaceCurrentUrl(router: any, newUrl: string, options?: { scroll?: boolean }): void {
        router.replace(newUrl, { scroll: options?.scroll ?? false });
    }

    // 채팅 컨텍스트 유지를 위한 상태 저장
    static saveChatContext(mode: ChatMode, additionalData?: any): void {
        const context = {
            mode,
            timestamp: Date.now(),
            ...additionalData
        };
        
        try {
            sessionStorage.setItem('chat-context', JSON.stringify(context));
        } catch (error) {
            devLog.error('Failed to save chat context:', error);
        }
    }

    // 저장된 채팅 컨텍스트 복원
    static restoreChatContext(): any | null {
        try {
            const stored = sessionStorage.getItem('chat-context');
            if (stored) {
                const context = JSON.parse(stored);
                
                // 1시간 이상 된 컨텍스트는 무시
                if (Date.now() - context.timestamp > 60 * 60 * 1000) {
                    sessionStorage.removeItem('chat-context');
                    return null;
                }
                
                return context;
            }
        } catch (error) {
            devLog.error('Failed to restore chat context:', error);
        }
        
        return null;
    }

    // 채팅 모드별 권장 작업 가져오기
    static getRecommendedActions(mode: ChatMode): Array<{
        label: string;
        action: string;
        description: string;
    }> {
        const actions: Array<{ label: string; action: string; description: string; }> = [];

        switch (mode.type) {
            case 'regular':
                actions.push(
                    { label: '세션 채팅으로 전환', action: 'switch-to-session', description: '대화를 독립적인 세션으로 관리' },
                    { label: '워크플로우 선택', action: 'select-workflow', description: '특정 워크플로우로 대화 시작' }
                );
                break;

            case 'session':
                actions.push(
                    { label: '워크플로우 변경', action: 'change-workflow', description: '다른 워크플로우로 전환' },
                    { label: '세션 관리', action: 'manage-sessions', description: '세션 목록 보기 및 관리' },
                    { label: '일반 채팅으로 전환', action: 'switch-to-regular', description: '기본 채팅 모드로 전환' }
                );
                break;

            case 'workflow':
                actions.push(
                    { label: '세션으로 저장', action: 'save-as-session', description: '현재 대화를 세션으로 저장' },
                    { label: '다른 워크플로우 선택', action: 'select-other-workflow', description: '다른 워크플로우로 전환' }
                );
                break;
        }

        return actions;
    }
}