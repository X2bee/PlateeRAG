import { useState, useCallback, useMemo, useRef } from 'react';

// 히스토리 액션 타입 정의
export type HistoryActionType =
    | 'NODE_MOVE'
    | 'NODE_CREATE'
    | 'NODE_DELETE'
    | 'EDGE_CREATE'
    | 'EDGE_DELETE'
    | 'NODE_UPDATE'
    | 'EDGE_UPDATE'
    | 'MULTI_ACTION';

// 히스토리 엔트리 타입 정의
export interface HistoryEntry {
    id: string;
    timestamp: Date;
    actionType: HistoryActionType;
    description: string;
    canvasState?: any; // Canvas의 전체 상태를 저장
    details: {
        nodeId?: string;
        edgeId?: string;
        fromPosition?: { x: number; y: number };
        toPosition?: { x: number; y: number };
        nodeType?: string;
        sourceId?: string;
        targetId?: string;
        actions?: Array<{
            actionType: HistoryActionType;
            nodeId?: string;
            edgeId?: string;
            nodeType?: string;
            sourceId?: string;
            targetId?: string;
            position?: { x: number; y: number };
        }>;
        [key: string]: any;
    };
}

// 히스토리 관리 훅의 반환 타입
export interface UseHistoryManagementReturn {
    history: HistoryEntry[];
    currentHistoryIndex: number;
    addHistoryEntry: (actionType: HistoryActionType, description: string, details?: any, canvasState?: any) => void;
    clearHistory: () => void;
    getHistoryByType: (actionType: HistoryActionType) => HistoryEntry[];
    getRecentHistory: (count: number) => HistoryEntry[];
    historyCount: number;
    canUndo: boolean;
    canRedo: boolean;
    undo: () => HistoryEntry | null;
    redo: () => HistoryEntry | null;
    jumpToHistoryIndex: (index: number) => HistoryEntry[];
    setCanvasStateRestorer: (restorer: (canvasState: any) => void) => void;
    setCurrentStateCapture: (captureFunction: () => any) => void;
}

const MAX_HISTORY_SIZE = 50;
const DUPLICATE_PREVENTION_WINDOW_MS = 100; // 0.1초로 늘림 (0.05초 → 0.1초)

// 더 정교한 중복 검사를 위한 헬퍼 함수
const isIdenticalAction = (entry1: HistoryEntry, entry2: Partial<HistoryEntry>): boolean => {
    // 액션 타입이 다르면 다른 액션
    if (entry1.actionType !== entry2.actionType) return false;

    // 설명이 다르면 다른 액션
    if (entry1.description !== entry2.description) return false;

    // NODE_UPDATE 액션의 경우 더 세밀한 비교
    if (entry1.actionType === 'NODE_UPDATE' && entry2.details) {
        const details1 = entry1.details;
        const details2 = entry2.details;

        return details1.nodeId === details2.nodeId &&
               details1.field === details2.field &&
               details1.oldValue === details2.oldValue &&
               details1.newValue === details2.newValue;
    }

    // 기타 액션들은 JSON 비교
    return JSON.stringify(entry1.details) === JSON.stringify(entry2.details);
};

export const useHistoryManagement = (): UseHistoryManagementReturn => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1); // -1 means current state (no undo)
    const [currentState, setCurrentState] = useState<any>(null); // 최신 상태를 저장하는 상태
    const currentHistoryIndexRef = useRef(-1);
    const historyRef = useRef<HistoryEntry[]>([]); // history를 ref로도 관리
    const currentStateCaptureRef = useRef<(() => any) | null>(null); // 현재 상태 캡처 함수
    const canvasStateRestorerRef = useRef<((canvasState: any) => void) | null>(null); // Canvas 상태 복원 함수

    // refs 동기화
    currentHistoryIndexRef.current = currentHistoryIndex;
    historyRef.current = history;

    // 히스토리 엔트리 추가 함수
    const addHistoryEntry = useCallback((
        actionType: HistoryActionType,
        description: string,
        details: any = {},
        canvasState?: any
    ) => {
        const currentTime = Date.now();

        // 새로운 엔트리 정보
        const newEntryInfo = {
            actionType,
            description,
            details
        };

        // 강화된 중복 방지: 최근 여러 엔트리와 비교 (최대 5개) - ref 사용
        const currentHistory = historyRef.current;
        const recentEntries = currentHistory.slice(0, Math.min(5, currentHistory.length));
        const isDuplicate = recentEntries.some(recentEntry => {
            const timeDiff = currentTime - recentEntry.timestamp.getTime();
            return timeDiff < DUPLICATE_PREVENTION_WINDOW_MS &&
                   isIdenticalAction(recentEntry, newEntryInfo);
        });

        if (isDuplicate) {
            console.log('🚫 Duplicate history entry prevented:', {
                actionType,
                description,
                recentEntriesCount: recentEntries.length,
                checkWindow: DUPLICATE_PREVENTION_WINDOW_MS + 'ms'
            });
            return;
        }

        const newEntry: HistoryEntry = {
            id: `${currentTime}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(currentTime),
            actionType,
            description,
            details,
            canvasState
        };

        console.log('📝 Adding history entry:', { actionType, description, currentHistoryIndex: currentHistoryIndexRef.current, hasCanvasState: !!canvasState });

        setHistory(prev => {
            // If we're in the middle of history and add a new entry, truncate future entries
            const currentIndex = currentHistoryIndexRef.current;
            let currentHistory;
            if (currentIndex === -1) {
                // 현재 상태에서 새 작업 - 전체 히스토리 유지
                currentHistory = prev;
            } else {
                // Undo 상태에서 새 작업 - currentHistoryIndex부터 끝까지의 항목들을 유지 (미래 항목들 제거)
                currentHistory = prev.slice(currentIndex + 1);
            }
            const newHistory = [newEntry, ...currentHistory];
            console.log('📝 currentHistoryIndex:', currentIndex, 'Previous history length:', prev.length, 'Current history length after truncation:', currentHistory.length, 'New history length:', newHistory.length);
            // 최대 50개까지만 유지
            const finalHistory = newHistory.slice(0, MAX_HISTORY_SIZE);

            // ref도 함께 업데이트
            historyRef.current = finalHistory;

            return finalHistory;
        });

        // Reset to current state when new action is added
        setCurrentHistoryIndex(-1);

        // 새로운 액션 추가 시 저장된 현재 상태 초기화
        setCurrentState(null);

        console.log('📝 Reset currentHistoryIndex to -1');
    }, []); // history 의존성 제거 - ref 사용으로 불필요

    // 히스토리 전체 삭제
    const clearHistory = useCallback(() => {
        setHistory([]);
        historyRef.current = []; // ref도 업데이트
        setCurrentHistoryIndex(-1);
        setCurrentState(null); // 저장된 현재 상태도 초기화
    }, []);

    // Undo/Redo 상태 계산
    const canUndo = useMemo(() => history.length > 0 && currentHistoryIndex < history.length - 1, [history.length, currentHistoryIndex]);
    const canRedo = useMemo(() => currentHistoryIndex > -1, [currentHistoryIndex]);

    // Undo 함수
    const undo = useCallback(() => {
        console.log('🔙 Undo called - canUndo:', canUndo, 'currentHistoryIndex:', currentHistoryIndex, 'history.length:', history.length);
        if (!canUndo) return null;

        // 최신 상태에서 첫 번째 Undo인 경우 현재 상태를 저장
        if (currentHistoryIndex === -1 && currentStateCaptureRef.current) {
            const capturedState = currentStateCaptureRef.current();
            setCurrentState(capturedState);
            console.log('💾 Saving current state before first undo');
        }

        const newIndex = currentHistoryIndex + 1;
        const targetEntry = history[newIndex];
        setCurrentHistoryIndex(newIndex);

        // Canvas 상태 복원
        if (canvasStateRestorerRef.current && targetEntry) {
            console.log('🔙 Restoring canvas state for undo:', targetEntry);

            // NODE_MOVE 액션의 경우 특별 처리
            if (targetEntry.actionType === 'NODE_MOVE' && targetEntry.details) {
                const { nodeId, fromPosition } = targetEntry.details;
                console.log('🔙 NODE_MOVE undo - restoring node position:', { nodeId, fromPosition });

                // 노드의 위치만 되돌리는 특별한 복원 로직
                canvasStateRestorerRef.current({
                    actionType: 'NODE_MOVE',
                    nodeId,
                    position: fromPosition
                });
            } else if (targetEntry.canvasState) {
                // 일반적인 전체 상태 복원
                canvasStateRestorerRef.current(targetEntry.canvasState);
            }
        }

        console.log('🔙 Undo: Moving to index', newIndex, 'Entry:', targetEntry);
        return targetEntry || null;
    }, [canUndo, currentHistoryIndex, history]);

    // Redo 함수
    const redo = useCallback(() => {
        console.log('🔄 Redo called - canRedo:', canRedo, 'currentHistoryIndex:', currentHistoryIndex);
        if (!canRedo) return null;

        const newIndex = currentHistoryIndex - 1;
        setCurrentHistoryIndex(newIndex);

        // Canvas 상태 복원
        if (newIndex === -1) {
            // 최신 상태로 복원 - 저장된 currentState 사용
            if (canvasStateRestorerRef.current && currentState) {
                console.log('🔄 Restoring saved current state for redo to latest');
                canvasStateRestorerRef.current(currentState);
            } else {
                console.log('🔄 Redo: Back to current state (no saved state available)');
            }
        } else {
            const targetEntry = history[newIndex];
            if (canvasStateRestorerRef.current && targetEntry) {
                console.log('🔄 Restoring canvas state for redo:', targetEntry);

                // NODE_MOVE 액션의 경우 특별 처리 - toPosition으로 복원
                if (targetEntry.actionType === 'NODE_MOVE' && targetEntry.details) {
                    const { nodeId, toPosition } = targetEntry.details;
                    console.log('🔄 NODE_MOVE redo - restoring node position:', { nodeId, toPosition });

                    // 노드를 이동된 위치로 복원
                    canvasStateRestorerRef.current({
                        actionType: 'NODE_MOVE',
                        nodeId,
                        position: toPosition
                    });
                } else if (targetEntry.canvasState) {
                    // 일반적인 전체 상태 복원
                    canvasStateRestorerRef.current(targetEntry.canvasState);
                }
            }
        }

        console.log('🔄 Redo: Moving to index', newIndex, newIndex === -1 ? 'Current state' : 'Entry: ' + JSON.stringify(history[newIndex]));
        return newIndex === -1 ? null : history[newIndex] || null;
    }, [canRedo, currentHistoryIndex, history, currentState]);

    // Jump to specific history index
    const jumpToHistoryIndex = useCallback((index: number) => {
        if (index < -1 || index >= history.length) return [];

        setCurrentHistoryIndex(index);

        // Canvas 상태 복원
        if (index === -1) {
            // 최신 상태로 복원 - 저장된 currentState 사용
            if (canvasStateRestorerRef.current && currentState) {
                console.log('🎯 Restoring saved current state for jump to latest');
                canvasStateRestorerRef.current(currentState);
            } else {
                console.log('🎯 Jump to current state (no saved state available)');
            }
        } else {
            const targetEntry = history[index];
            if (canvasStateRestorerRef.current && targetEntry) {
                console.log('🎯 Restoring canvas state for jump to index', index, ':', targetEntry);

                // NODE_MOVE 액션의 경우 특별 처리
                if (targetEntry.actionType === 'NODE_MOVE' && targetEntry.details) {
                    const { nodeId, fromPosition } = targetEntry.details;
                    console.log('🎯 NODE_MOVE jump - restoring node position:', { nodeId, fromPosition });

                    // 노드의 이전 위치로 복원 (Undo와 동일)
                    canvasStateRestorerRef.current({
                        actionType: 'NODE_MOVE',
                        nodeId,
                        position: fromPosition
                    });
                } else if (targetEntry.canvasState) {
                    // 일반적인 전체 상태 복원
                    canvasStateRestorerRef.current(targetEntry.canvasState);
                }
            }
        }

        return index === -1 ? [] : history.slice(0, index + 1);
    }, [history, currentState]);

    // 특정 액션 타입의 히스토리만 필터링
    const getHistoryByType = useCallback((actionType: HistoryActionType) => {
        return history.filter(entry => entry.actionType === actionType);
    }, [history]);

    // 최근 N개의 히스토리 반환
    const getRecentHistory = useCallback((count: number) => {
        return history.slice(0, count);
    }, [history]);

    // 현재 상태 캡처 함수 설정
    const setCurrentStateCapture = useCallback((captureFunction: () => any) => {
        currentStateCaptureRef.current = captureFunction;
        console.log('� Current state capture function set');
    }, []);

    // 히스토리 카운트
    const historyCount = useMemo(() => history.length, [history]);

    return {
        history,
        currentHistoryIndex,
        addHistoryEntry,
        clearHistory,
        getHistoryByType,
        getRecentHistory,
        historyCount,
        canUndo,
        canRedo,
        undo,
        redo,
        jumpToHistoryIndex,
        setCanvasStateRestorer: (restorer: (canvasState: any) => void) => {
            canvasStateRestorerRef.current = restorer;
        },
        setCurrentStateCapture
    };
};

// 각 액션별 편의 함수들
export const createHistoryHelpers = (
    addHistoryEntry: UseHistoryManagementReturn['addHistoryEntry'],
    historyManagement: UseHistoryManagementReturn,
    getCanvasState?: () => any
) => ({
    // Node 이동 기록
    recordNodeMove: (nodeId: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => {
        console.log('📝 recordNodeMove called:', { nodeId, fromPosition, toPosition });
        // NODE_MOVE의 경우 canvasState를 저장하지 않음 - fromPosition/toPosition 정보만 사용
        addHistoryEntry(
            'NODE_MOVE',
            `Node ${nodeId} moved from (${fromPosition.x.toFixed(1)}, ${fromPosition.y.toFixed(1)}) to (${toPosition.x.toFixed(1)}, ${toPosition.y.toFixed(1)})`,
            { nodeId, fromPosition, toPosition }
            // canvasState 파라미터 제거 - NODE_MOVE는 position 정보만 필요
        );
        console.log('📝 recordNodeMove completed');
    },

    // Node 생성 기록
    recordNodeCreate: (nodeId: string, nodeType: string, position: { x: number; y: number }) => {
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'NODE_CREATE',
            `Created ${nodeType} node ${nodeId} at (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
            { nodeId, nodeType, position },
            canvasState
        );
    },

    // Node 삭제 기록
    recordNodeDelete: (nodeId: string, nodeType: string) => {
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'NODE_DELETE',
            `Deleted ${nodeType} node ${nodeId}`,
            { nodeId, nodeType },
            canvasState
        );
    },

    // Edge 생성 기록
    recordEdgeCreate: (edgeId: string, sourceId: string, targetId: string) => {
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'EDGE_CREATE',
            `Created edge ${edgeId} from ${sourceId} to ${targetId}`,
            { edgeId, sourceId, targetId },
            canvasState
        );
    },

    // Edge 삭제 기록
    recordEdgeDelete: (edgeId: string, sourceId: string, targetId: string) => {
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'EDGE_DELETE',
            `Deleted edge ${edgeId} from ${sourceId} to ${targetId}`,
            { edgeId, sourceId, targetId },
            canvasState
        );
    },

    // Node 업데이트 기록
    recordNodeUpdate: (nodeId: string, field: string, oldValue: any, newValue: any) => {
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'NODE_UPDATE',
            `Updated node ${nodeId} ${field} from "${oldValue}" to "${newValue}"`,
            { nodeId, field, oldValue, newValue },
            canvasState
        );
    },

    // Edge 업데이트 기록
    recordEdgeUpdate: (edgeId: string, field: string, oldValue: any, newValue: any) => {
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'EDGE_UPDATE',
            `Updated edge ${edgeId} ${field} from "${oldValue}" to "${newValue}"`,
            { edgeId, field, oldValue, newValue },
            canvasState
        );
    },

    // 다중 액션 기록 (PredictedNode 생성 시 Node 생성 + Edge 연결)
    recordMultiAction: (description: string, actions: Array<{
        actionType: HistoryActionType;
        nodeId?: string;
        edgeId?: string;
        nodeType?: string;
        sourceId?: string;
        targetId?: string;
        position?: { x: number; y: number };
    }>) => {
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'MULTI_ACTION',
            description,
            { actions },
            canvasState
        );
    },

    // Undo/Redo 기능
    undo: historyManagement.undo,
    redo: historyManagement.redo,
    canUndo: historyManagement.canUndo,
    canRedo: historyManagement.canRedo,
    jumpToHistoryIndex: historyManagement.jumpToHistoryIndex,

    // 상태 캡처 및 복원 함수
    setCurrentStateCapture: historyManagement.setCurrentStateCapture,
    setCanvasStateRestorer: historyManagement.setCanvasStateRestorer
});
