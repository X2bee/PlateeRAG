import { useState, useCallback, useMemo } from 'react';

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
  addHistoryEntry: (actionType: HistoryActionType, description: string, details?: any) => void;
  clearHistory: () => void;
  getHistoryByType: (actionType: HistoryActionType) => HistoryEntry[];
  getRecentHistory: (count: number) => HistoryEntry[];
  historyCount: number;
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryManagement = (): UseHistoryManagementReturn => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // 히스토리 엔트리 추가 함수
  const addHistoryEntry = useCallback((
    actionType: HistoryActionType,
    description: string,
    details: any = {}
  ) => {
    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      actionType,
      description,
      details
    };

    setHistory(prev => {
      const newHistory = [newEntry, ...prev];
      // 최대 50개까지만 유지
      return newHistory.slice(0, MAX_HISTORY_SIZE);
    });
  }, []);

  // 히스토리 전체 삭제
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

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
    addHistoryEntry,
    clearHistory,
    getHistoryByType,
    getRecentHistory,
    historyCount
  };
};

// 각 액션별 편의 함수들
export const createHistoryHelpers = (addHistoryEntry: UseHistoryManagementReturn['addHistoryEntry']) => ({
  // Node 이동 기록
  recordNodeMove: (nodeId: string, fromPosition: { x: number; y: number }, toPosition: { x: number; y: number }) => {
    addHistoryEntry(
      'NODE_MOVE',
      `Node ${nodeId} moved from (${fromPosition.x.toFixed(1)}, ${fromPosition.y.toFixed(1)}) to (${toPosition.x.toFixed(1)}, ${toPosition.y.toFixed(1)})`,
      { nodeId, fromPosition, toPosition }
    );
  },

  // Node 생성 기록
  recordNodeCreate: (nodeId: string, nodeType: string, position: { x: number; y: number }) => {
    addHistoryEntry(
      'NODE_CREATE',
      `Created ${nodeType} node ${nodeId} at (${position.x.toFixed(1)}, ${position.y.toFixed(1)})`,
      { nodeId, nodeType, position }
    );
  },

  // Node 삭제 기록
  recordNodeDelete: (nodeId: string, nodeType: string) => {
    addHistoryEntry(
      'NODE_DELETE',
      `Deleted ${nodeType} node ${nodeId}`,
      { nodeId, nodeType }
    );
  },

  // Edge 생성 기록
  recordEdgeCreate: (edgeId: string, sourceId: string, targetId: string) => {
    addHistoryEntry(
      'EDGE_CREATE',
      `Created edge ${edgeId} from ${sourceId} to ${targetId}`,
      { edgeId, sourceId, targetId }
    );
  },

  // Edge 삭제 기록
  recordEdgeDelete: (edgeId: string, sourceId: string, targetId: string) => {
    addHistoryEntry(
      'EDGE_DELETE',
      `Deleted edge ${edgeId} from ${sourceId} to ${targetId}`,
      { edgeId, sourceId, targetId }
    );
  },

  // Node 업데이트 기록
  recordNodeUpdate: (nodeId: string, field: string, oldValue: any, newValue: any) => {
    addHistoryEntry(
      'NODE_UPDATE',
      `Updated node ${nodeId} ${field} from "${oldValue}" to "${newValue}"`,
      { nodeId, field, oldValue, newValue }
    );
  },

  // Edge 업데이트 기록
  recordEdgeUpdate: (edgeId: string, field: string, oldValue: any, newValue: any) => {
    addHistoryEntry(
      'EDGE_UPDATE',
      `Updated edge ${edgeId} ${field} from "${oldValue}" to "${newValue}"`,
      { edgeId, field, oldValue, newValue }
    );
  }
});
