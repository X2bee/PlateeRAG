import { devLog } from '@/app/_common/utils/logger';

export interface SessionData {
    sessionId: string;
    sessionName?: string;
    messages: any[];
    workflow?: any;
    createdAt: string;
    lastActiveAt: string;
    interactionId?: string;
}

export interface SessionListItem {
    sessionId: string;
    sessionName: string;
    messageCount: number;
    lastActiveAt: string;
    createdAt: string;
    lastMessage?: string;
}

export class SessionManager {
    private static STORAGE_PREFIX = 'session-';
    private static SESSION_LIST_KEY = 'session-list';

    // 모든 세션 목록 가져오기
    static getAllSessions(): SessionListItem[] {
        try {
            const sessionList = localStorage.getItem(this.SESSION_LIST_KEY);
            if (sessionList) {
                return JSON.parse(sessionList);
            }
            return [];
        } catch (error) {
            devLog.error('Failed to load session list:', error);
            return [];
        }
    }

    // 세션 목록 업데이트
    private static updateSessionList(sessions: SessionListItem[]): void {
        try {
            localStorage.setItem(this.SESSION_LIST_KEY, JSON.stringify(sessions));
        } catch (error) {
            devLog.error('Failed to update session list:', error);
        }
    }

    // 세션 데이터 가져오기
    static getSessionData(sessionId: string): SessionData | null {
        try {
            const data = localStorage.getItem(`${this.STORAGE_PREFIX}${sessionId}`);
            if (data) {
                return JSON.parse(data);
            }
            return null;
        } catch (error) {
            devLog.error('Failed to load session data:', error);
            return null;
        }
    }

    // 세션 데이터 저장
    static saveSessionData(sessionData: SessionData): void {
        try {
            localStorage.setItem(`${this.STORAGE_PREFIX}${sessionData.sessionId}`, JSON.stringify(sessionData));
            
            // 세션 목록 업데이트
            this.updateSessionInList(sessionData);
        } catch (error) {
            devLog.error('Failed to save session data:', error);
        }
    }

    // 세션 목록에서 세션 정보 업데이트
    private static updateSessionInList(sessionData: SessionData): void {
        const sessions = this.getAllSessions();
        const existingIndex = sessions.findIndex(s => s.sessionId === sessionData.sessionId);
        
        const lastMessage = sessionData.messages.length > 0 
            ? sessionData.messages[sessionData.messages.length - 1]?.output_data?.substring(0, 100) + '...'
            : '';

        const sessionItem: SessionListItem = {
            sessionId: sessionData.sessionId,
            sessionName: sessionData.sessionName || `세션 ${sessionData.sessionId}`,
            messageCount: sessionData.messages.length,
            lastActiveAt: sessionData.lastActiveAt,
            createdAt: sessionData.createdAt,
            lastMessage
        };

        if (existingIndex >= 0) {
            sessions[existingIndex] = sessionItem;
        } else {
            sessions.push(sessionItem);
        }

        // 마지막 활동 시간 기준으로 정렬
        sessions.sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());

        this.updateSessionList(sessions);
    }

    // 새로운 세션 생성
    static createNewSession(sessionId?: string): SessionData {
        const id = sessionId || `session-${Date.now()}`;
        const sessionData: SessionData = {
            sessionId: id,
            sessionName: `새 세션 ${new Date().toLocaleString()}`,
            messages: [],
            workflow: {
                id: "default_mode",
                name: "일반 채팅",
                description: "기본 대화 모드",
                author: "system",
                nodeCount: 0,
                status: 'active' as const,
            },
            createdAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
        };

        this.saveSessionData(sessionData);
        return sessionData;
    }

    // 세션 삭제
    static deleteSession(sessionId: string): boolean {
        try {
            localStorage.removeItem(`${this.STORAGE_PREFIX}${sessionId}`);
            
            // 세션 목록에서도 제거
            const sessions = this.getAllSessions().filter(s => s.sessionId !== sessionId);
            this.updateSessionList(sessions);
            
            devLog.log('Session deleted:', sessionId);
            return true;
        } catch (error) {
            devLog.error('Failed to delete session:', error);
            return false;
        }
    }

    // 세션 이름 변경
    static renameSession(sessionId: string, newName: string): boolean {
        try {
            const sessionData = this.getSessionData(sessionId);
            if (!sessionData) return false;

            sessionData.sessionName = newName;
            this.saveSessionData(sessionData);
            
            devLog.log('Session renamed:', sessionId, newName);
            return true;
        } catch (error) {
            devLog.error('Failed to rename session:', error);
            return false;
        }
    }

    // 세션 복사
    static duplicateSession(sessionId: string): SessionData | null {
        try {
            const originalSession = this.getSessionData(sessionId);
            if (!originalSession) return null;

            const newSessionId = `${sessionId}-copy-${Date.now()}`;
            const duplicatedSession: SessionData = {
                ...originalSession,
                sessionId: newSessionId,
                sessionName: `${originalSession.sessionName || sessionId} (복사본)`,
                createdAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
            };

            this.saveSessionData(duplicatedSession);
            return duplicatedSession;
        } catch (error) {
            devLog.error('Failed to duplicate session:', error);
            return null;
        }
    }

    // 모든 세션 삭제 (초기화)
    static clearAllSessions(): boolean {
        try {
            const sessions = this.getAllSessions();
            for (const session of sessions) {
                localStorage.removeItem(`${this.STORAGE_PREFIX}${session.sessionId}`);
            }
            localStorage.removeItem(this.SESSION_LIST_KEY);
            
            devLog.log('All sessions cleared');
            return true;
        } catch (error) {
            devLog.error('Failed to clear all sessions:', error);
            return false;
        }
    }

    // 세션 내보내기 (JSON 형태)
    static exportSession(sessionId: string): string | null {
        try {
            const sessionData = this.getSessionData(sessionId);
            if (!sessionData) return null;

            return JSON.stringify(sessionData, null, 2);
        } catch (error) {
            devLog.error('Failed to export session:', error);
            return null;
        }
    }

    // 세션 가져오기 (JSON에서)
    static importSession(jsonData: string): boolean {
        try {
            const sessionData: SessionData = JSON.parse(jsonData);
            
            // 기본 유효성 검사
            if (!sessionData.sessionId || !sessionData.createdAt) {
                throw new Error('Invalid session data format');
            }

            // 동일한 ID가 있으면 새로운 ID 생성
            if (this.getSessionData(sessionData.sessionId)) {
                sessionData.sessionId = `imported-${Date.now()}`;
                sessionData.sessionName = `${sessionData.sessionName || 'Imported Session'} (가져온 세션)`;
            }

            this.saveSessionData(sessionData);
            return true;
        } catch (error) {
            devLog.error('Failed to import session:', error);
            return false;
        }
    }
}