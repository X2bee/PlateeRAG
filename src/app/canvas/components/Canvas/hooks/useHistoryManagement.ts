import { useState, useCallback, useMemo, useRef } from 'react';

// 히스토리 액션 타입 정의
export type HistoryActionType =
    | 'NODE_MOVE'
    | 'NODE_CREATE'
    | 'NODE_DELETE'
    | 'EDGE_CREATE'
    | 'EDGE_DELETE'
    | 'NODE_UPDATE'
    | 'EDGE_UPDATE';

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
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryManagement = (): UseHistoryManagementReturn => {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1); // -1 means current state (no undo)
    const [canvasStateRestorer, setCanvasStateRestorer] = useState<((canvasState: any) => void) | null>(null);
    const currentHistoryIndexRef = useRef(-1);

    // currentHistoryIndex와 ref 동기화
    currentHistoryIndexRef.current = currentHistoryIndex;

    // 히스토리 엔트리 추가 함수
    const addHistoryEntry = useCallback((
        actionType: HistoryActionType,
        description: string,
        details: any = {},
        canvasState?: any
    ) => {
        const newEntry: HistoryEntry = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
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
            return newHistory.slice(0, MAX_HISTORY_SIZE);
        });

        // Reset to current state when new action is added
        setCurrentHistoryIndex(-1);
        console.log('📝 Reset currentHistoryIndex to -1');
    }, []); // 의존성 제거

    // 히스토리 전체 삭제
    const clearHistory = useCallback(() => {
        setHistory([]);
        setCurrentHistoryIndex(-1);
    }, []);

    // Undo/Redo 상태 계산
    const canUndo = useMemo(() => history.length > 0 && currentHistoryIndex < history.length - 1, [history.length, currentHistoryIndex]);
    const canRedo = useMemo(() => currentHistoryIndex > -1, [currentHistoryIndex]);

    // Undo 함수
    const undo = useCallback(() => {
        console.log('🔙 Undo called - canUndo:', canUndo, 'currentHistoryIndex:', currentHistoryIndex, 'history.length:', history.length);
        if (!canUndo) return null;

        const newIndex = currentHistoryIndex + 1;
        const targetEntry = history[newIndex];
        setCurrentHistoryIndex(newIndex);

        // Canvas 상태 복원
        if (canvasStateRestorer && targetEntry?.canvasState) {
            console.log('🔙 Restoring canvas state for undo:', targetEntry);
            canvasStateRestorer(targetEntry.canvasState);
        }

        console.log('🔙 Undo: Moving to index', newIndex, 'Entry:', targetEntry);
        return targetEntry || null;
    }, [canUndo, currentHistoryIndex, history, canvasStateRestorer]);

    // Redo 함수
    const redo = useCallback(() => {
        console.log('🔄 Redo called - canRedo:', canRedo, 'currentHistoryIndex:', currentHistoryIndex);
        if (!canRedo) return null;

        const newIndex = currentHistoryIndex - 1;
        setCurrentHistoryIndex(newIndex);

        // Canvas 상태 복원
        if (newIndex === -1) {
            // 현재 상태로 복원 - 별도 처리 필요할 수 있음
            console.log('🔄 Redo: Back to current state');
        } else {
            const targetEntry = history[newIndex];
            if (canvasStateRestorer && targetEntry?.canvasState) {
                console.log('🔄 Restoring canvas state for redo:', targetEntry);
                canvasStateRestorer(targetEntry.canvasState);
            }
        }

        console.log('🔄 Redo: Moving to index', newIndex, newIndex === -1 ? 'Current state' : 'Entry: ' + JSON.stringify(history[newIndex]));
        return newIndex === -1 ? null : history[newIndex] || null;
    }, [canRedo, currentHistoryIndex, history, canvasStateRestorer]);

    // Jump to specific history index
    const jumpToHistoryIndex = useCallback((index: number) => {
        if (index < -1 || index >= history.length) return [];

        setCurrentHistoryIndex(index);

        // Canvas 상태 복원
        if (index === -1) {
            console.log('🎯 Jump to current state');
        } else {
            const targetEntry = history[index];
            if (canvasStateRestorer && targetEntry?.canvasState) {
                console.log('🎯 Restoring canvas state for jump to index', index, ':', targetEntry);
                canvasStateRestorer(targetEntry.canvasState);
            }
        }

        return index === -1 ? [] : history.slice(0, index + 1);
    }, [history, canvasStateRestorer]);

    // 특정 액션 타입의 히스토리만 필터링
    const getHistoryByType = useCallback((actionType: HistoryActionType) => {
        return history.filter(entry => entry.actionType === actionType);
    }, [history]);

    // 최근 N개의 히스토리 반환
    const getRecentHistory = useCallback((count: number) => {
        return history.slice(0, count);
    }, [history]);

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
            setCanvasStateRestorer(() => restorer);
        }
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
        const canvasState = getCanvasState?.();
        addHistoryEntry(
            'NODE_MOVE',
            `Node ${nodeId} moved from (${fromPosition.x.toFixed(1)}, ${fromPosition.y.toFixed(1)}) to (${toPosition.x.toFixed(1)}, ${toPosition.y.toFixed(1)})`,
            { nodeId, fromPosition, toPosition },
            canvasState
        );
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

    // Undo/Redo 기능
    undo: historyManagement.undo,
    redo: historyManagement.redo,
    canUndo: historyManagement.canUndo,
    canRedo: historyManagement.canRedo,
    jumpToHistoryIndex: historyManagement.jumpToHistoryIndex
});
