import { useState, useCallback, useMemo, useRef } from 'react';
import { devLog } from '@/app/_common/utils/logger';
export type HistoryActionType = 'NODE_MOVE' | 'NODE_CREATE' | 'NODE_DELETE' | 'EDGE_CREATE' | 'EDGE_DELETE' | 'NODE_UPDATE' | 'EDGE_UPDATE' | 'MULTI_ACTION'; // 다중 액션 추가

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
            devLog.warn('Duplicate history entry prevented:', {
                actionType,
                description
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
        if (!canUndo) return null;

        // 최신 상태에서 첫 번째 Undo인 경우 현재 상태를 저장
        if (currentHistoryIndex === -1 && currentStateCaptureRef.current) {
            const capturedState = currentStateCaptureRef.current();
            setCurrentState(capturedState);
        }

        const newIndex = currentHistoryIndex + 1;
        const targetEntry = history[newIndex];
        setCurrentHistoryIndex(newIndex);

        // Canvas 상태 복원
        if (canvasStateRestorerRef.current && targetEntry) {
            try {
                if (targetEntry.canvasState) {
                    // 모든 액션에 대해 전체 상태 복원
                    devLog.log('UNDO: Full state restoration for', targetEntry.actionType);
                    canvasStateRestorerRef.current(targetEntry.canvasState);
                } else {
                    devLog.warn('UNDO: No canvasState available for entry:', {
                        actionType: targetEntry.actionType,
                        description: targetEntry.description
                    });
                }
            } catch (error) {
                devLog.error('UNDO: Failed to restore state:', error);
            }
        }

        return targetEntry || null;
    }, [canUndo, currentHistoryIndex, history]);

    // Redo 함수
    const redo = useCallback(() => {
        if (!canRedo) return null;

        const newIndex = currentHistoryIndex - 1;
        setCurrentHistoryIndex(newIndex);

        // Canvas 상태 복원
        try {
            if (newIndex === -1) {
                // 최신 상태로 복원 - 저장된 currentState 사용
                if (canvasStateRestorerRef.current && currentState) {
                    devLog.log('REDO: Restoring to latest state');
                    canvasStateRestorerRef.current(currentState);
                }
            } else {
                const targetEntry = history[newIndex];
                if (canvasStateRestorerRef.current && targetEntry && targetEntry.canvasState) {
                    // 모든 액션에 대해 전체 상태 복원
                    devLog.log('REDO: Full state restoration for', targetEntry.actionType);
                    canvasStateRestorerRef.current(targetEntry.canvasState);
                } else {
                    devLog.warn('REDO: No canvasState available for entry:', {
                        actionType: targetEntry?.actionType,
                        description: targetEntry?.description
                    });
                }
            }
        } catch (error) {
            devLog.error('REDO: Failed to restore state:', error);
        }

        return newIndex === -1 ? null : history[newIndex] || null;
    }, [canRedo, currentHistoryIndex, history, currentState]);

    // Jump to specific history index
    const jumpToHistoryIndex = useCallback((index: number) => {
        if (index < -1 || index >= history.length) return [];

        devLog.log('=== JUMP TO HISTORY INDEX ===', {
            targetIndex: index,
            currentIndex: currentHistoryIndex,
            historyLength: history.length
        });

        try {
            // 현재 상태를 저장 (첫 번째 히스토리 점프인 경우)
            if (currentHistoryIndex === -1 && currentStateCaptureRef.current) {
                const capturedState = currentStateCaptureRef.current();
                setCurrentState(capturedState);
                devLog.log('Current state captured for jump');
            }

            setCurrentHistoryIndex(index);

            if (index === -1) {
                // 최신 상태로 복원
                if (canvasStateRestorerRef.current && currentState) {
                    devLog.log('JUMP: Restoring to latest state');
                    canvasStateRestorerRef.current(currentState);
                } else {
                    devLog.warn('JUMP: No current state saved to restore to');
                }
            } else {
                // 특정 히스토리 포인트로 점프
                const targetEntry = history[index];
                if (!targetEntry) {
                    devLog.error('JUMP: Target entry not found at index:', index);
                    return [];
                }

                devLog.log('JUMP: Target entry found:', {
                    actionType: targetEntry.actionType,
                    description: targetEntry.description,
                    hasCanvasState: !!targetEntry.canvasState
                });

                if (canvasStateRestorerRef.current && targetEntry.canvasState) {
                    // 해당 히스토리 시점의 전체 Canvas 상태로 직접 복원
                    devLog.log('JUMP: Restoring to full canvas state from history entry');
                    canvasStateRestorerRef.current(targetEntry.canvasState);
                } else {
                    devLog.error('JUMP: Cannot restore - missing canvasState or restorer:', {
                        hasRestorer: !!canvasStateRestorerRef.current,
                        hasCanvasState: !!targetEntry.canvasState,
                        actionType: targetEntry.actionType
                    });
                }
            }

            return index === -1 ? [] : history.slice(0, index + 1);
        } catch (error) {
            devLog.error('JUMP: Failed to jump to history index:', error);
            return [];
        }
    }, [history, currentHistoryIndex, currentState]);

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

// History 전용 canvas state 생성 (view 제외)
const createHistoryCanvasState = (fullCanvasState: any) => {
    if (!fullCanvasState) return null;

    // view를 제외한 상태만 반환
    const { view, ...stateWithoutView } = fullCanvasState;
    return stateWithoutView;
};

// 각 액션별 편의 함수들
export const createHistoryHelpers = (
    addHistoryEntry: UseHistoryManagementReturn['addHistoryEntry'],
    historyManagement: UseHistoryManagementReturn,
    getCanvasState?: () => any
) => ({
    // Node 이동 기록
    recordNodeMove: (nodeId: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => {
        // NODE_MOVE는 이동 이전 상태를 저장해야 UNDO가 제대로 작동함
        // 따라서 현재 상태를 가져오되, 노드 위치를 fromPosition으로 수정한 상태를 저장
        const currentCanvasState = getCanvasState?.();
        let beforeMoveState = null;

        if (currentCanvasState && currentCanvasState.nodes) {
            // 현재 상태를 복사하고 해당 노드의 위치를 fromPosition으로 되돌림
            const nodesWithOriginalPosition = currentCanvasState.nodes.map((node: any) => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        position: { ...fromPosition }
                    };
                }
                return node;
            });

            beforeMoveState = {
                ...currentCanvasState,
                nodes: nodesWithOriginalPosition
            };

            // History에서는 view를 제외
            beforeMoveState = createHistoryCanvasState(beforeMoveState);

            devLog.log('NODE_MOVE: Storing state before move for UNDO', {
                nodeId,
                fromPosition,
                toPosition,
                hasView: 'view' in beforeMoveState
            });
        }

        addHistoryEntry(
            'NODE_MOVE',
            `Node ${nodeId} moved from (${fromPosition.x.toFixed(1)}, ${fromPosition.y.toFixed(1)}) to (${toPosition.x.toFixed(1)}, ${toPosition.y.toFixed(1)})`,
            { nodeId, fromPosition, toPosition },
            beforeMoveState // 이동 이전 상태를 저장 (view 제외)
        );
    },

    // Node 생성 기록
    recordNodeCreate: (nodeId: string, nodeType: string, position: { x: number; y: number }) => {
        const fullCanvasState = getCanvasState?.();
        const historyCanvasState = createHistoryCanvasState(fullCanvasState);
        addHistoryEntry(
            'NODE_CREATE',
            `Created ${nodeType} node ${nodeId} at (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
            { nodeId, nodeType, position },
            historyCanvasState
        );
    },

    // Node 삭제 기록
    recordNodeDelete: (nodeId: string, nodeType: string) => {
        const fullCanvasState = getCanvasState?.();
        const historyCanvasState = createHistoryCanvasState(fullCanvasState);
        addHistoryEntry(
            'NODE_DELETE',
            `Deleted ${nodeType} node ${nodeId}`,
            { nodeId, nodeType },
            historyCanvasState
        );
    },

    // Edge 생성 기록
    recordEdgeCreate: (edgeId: string, sourceId: string, targetId: string) => {
        const fullCanvasState = getCanvasState?.();
        const historyCanvasState = createHistoryCanvasState(fullCanvasState);
        addHistoryEntry(
            'EDGE_CREATE',
            `Created edge ${edgeId} from ${sourceId} to ${targetId}`,
            { edgeId, sourceId, targetId },
            historyCanvasState
        );
    },

    // Edge 삭제 기록
    recordEdgeDelete: (edgeId: string, sourceId: string, targetId: string) => {
        const fullCanvasState = getCanvasState?.();
        const historyCanvasState = createHistoryCanvasState(fullCanvasState);
        addHistoryEntry(
            'EDGE_DELETE',
            `Deleted edge ${edgeId} from ${sourceId} to ${targetId}`,
            { edgeId, sourceId, targetId },
            historyCanvasState
        );
    },

    // Node 업데이트 기록
    recordNodeUpdate: (nodeId: string, field: string, oldValue: any, newValue: any) => {
        const fullCanvasState = getCanvasState?.();
        const historyCanvasState = createHistoryCanvasState(fullCanvasState);
        addHistoryEntry(
            'NODE_UPDATE',
            `Updated node ${nodeId} ${field} from "${oldValue}" to "${newValue}"`,
            { nodeId, field, oldValue, newValue },
            historyCanvasState
        );
    },

    // Edge 업데이트 기록
    recordEdgeUpdate: (edgeId: string, field: string, oldValue: any, newValue: any) => {
        const fullCanvasState = getCanvasState?.();
        const historyCanvasState = createHistoryCanvasState(fullCanvasState);
        addHistoryEntry(
            'EDGE_UPDATE',
            `Updated edge ${edgeId} ${field} from "${oldValue}" to "${newValue}"`,
            { edgeId, field, oldValue, newValue },
            historyCanvasState
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
        const fullCanvasState = getCanvasState?.();
        const historyCanvasState = createHistoryCanvasState(fullCanvasState);
        addHistoryEntry(
            'MULTI_ACTION',
            description,
            { actions },
            historyCanvasState
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
