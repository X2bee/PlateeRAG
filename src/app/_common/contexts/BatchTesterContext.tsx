'use client'
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { devLog } from '@/app/_common/utils/logger';

export interface TestData {
    id: number;
    input: string;
    expectedOutput?: string;
    actualOutput?: string | null;
    status?: 'pending' | 'running' | 'success' | 'error';
    executionTime?: number;
    error?: string | null;
    llm_eval_score?: number;
}

export interface BatchTestState {
    testData: TestData[];
    uploadedFile: File | null;
    uploadedFileName?: string;
    isRunning: boolean;
    progress: number;
    completedCount: number;
    batchSize: number;
    batchId?: string;
    streamResults: any[];
    lastActivityTimestamp?: number;
    // LLM 평가 관련 상태
    llmEvalEnabled: boolean;
    llmEvalType: 'vLLM' | 'OpenAI';
    llmEvalModel: string;
    // LLM 평가 진행 상태
    isEvalRunning: boolean;
    evalProgress: number;
    evalCompletedCount: number;
    evalTotalCount: number;
}

interface BatchTesterContextType {
    getWorkflowState: (workflowId: string) => BatchTestState;
    updateWorkflowState: (workflowId: string, updates: Partial<BatchTestState>) => void;
    updateWorkflowStateFunc: (workflowId: string, updater: (prev: BatchTestState) => Partial<BatchTestState>) => void;
    updateWorkflowTestData: (workflowId: string, updater: (prev: TestData[]) => TestData[]) => void;
    clearWorkflowState: (workflowId: string) => void;
    setCurrentWorkflow: (workflowId: string | null) => void;
    currentWorkflowId: string | null;
    isWorkflowRunning: (workflowId: string) => boolean;
    getRunningWorkflows: () => string[];
}

const defaultBatchTestState: BatchTestState = {
    testData: [],
    uploadedFile: null,
    uploadedFileName: undefined,
    isRunning: false,
    progress: 0,
    completedCount: 0,
    batchSize: 3,
    batchId: undefined,
    streamResults: [],
    lastActivityTimestamp: undefined,
    // LLM 평가 관련 기본값
    llmEvalEnabled: false,
    llmEvalType: 'OpenAI',
    llmEvalModel: 'gpt-5-mini',
    // LLM 평가 진행 상태 기본값
    isEvalRunning: false,
    evalProgress: 0,
    evalCompletedCount: 0,
    evalTotalCount: 0
};

type BatchTesterAction =
    | { type: 'SET_WORKFLOW_STATE'; workflowId: string; state: Partial<BatchTestState> }
    | { type: 'UPDATE_WORKFLOW_STATE_FUNC'; workflowId: string; updater: (prev: BatchTestState) => Partial<BatchTestState> }
    | { type: 'UPDATE_WORKFLOW_TESTDATA'; workflowId: string; updater: (prev: TestData[]) => TestData[] }
    | { type: 'CLEAR_WORKFLOW_STATE'; workflowId: string }
    | { type: 'SET_CURRENT_WORKFLOW'; workflowId: string | null }
    | { type: 'LOAD_PERSISTED_STATE'; states: Record<string, BatchTestState> };interface BatchTesterState {
    workflowStates: Record<string, BatchTestState>;
    currentWorkflowId: string | null;
}

const BatchTesterContext = createContext<BatchTesterContextType | undefined>(undefined);

function batchTesterReducer(state: BatchTesterState, action: BatchTesterAction): BatchTesterState {
    switch (action.type) {
        case 'SET_WORKFLOW_STATE':
            { const currentWorkflowState = state.workflowStates[action.workflowId] || defaultBatchTestState;
            const updatedState = {
                ...currentWorkflowState,
                ...action.state,
                lastActivityTimestamp: Date.now()
            };

            // 불변성을 보장하면서 업데이트
            const newWorkflowStates = {
                ...state.workflowStates,
                [action.workflowId]: updatedState
            };

            return {
                ...state,
                workflowStates: newWorkflowStates
            }; }

        case 'UPDATE_WORKFLOW_STATE_FUNC':
            { const currentWorkflowState = state.workflowStates[action.workflowId] || defaultBatchTestState;
            const updates = action.updater(currentWorkflowState);
            const updatedState = {
                ...currentWorkflowState,
                ...updates,
                lastActivityTimestamp: Date.now()
            };

            return {
                ...state,
                workflowStates: {
                    ...state.workflowStates,
                    [action.workflowId]: updatedState
                }
            }; }

        case 'UPDATE_WORKFLOW_TESTDATA':
            { const baseWorkflowState = state.workflowStates[action.workflowId] || defaultBatchTestState;
            const updatedTestData = action.updater(baseWorkflowState.testData);

            return {
                ...state,
                workflowStates: {
                    ...state.workflowStates,
                    [action.workflowId]: {
                        ...baseWorkflowState,
                        testData: updatedTestData,
                        lastActivityTimestamp: Date.now()
                    }
                }
            }; }

        case 'CLEAR_WORKFLOW_STATE':
            { const { [action.workflowId]: removed, ...remainingStates } = state.workflowStates;
            return {
                ...state,
                workflowStates: remainingStates
            }; }

        case 'SET_CURRENT_WORKFLOW':
            return {
                ...state,
                currentWorkflowId: action.workflowId
            };

        case 'LOAD_PERSISTED_STATE':
            return {
                ...state,
                workflowStates: action.states
            };

        default:
            return state;
    }
}

const STORAGE_KEY = 'batchTesterStates';
const MAX_INACTIVE_TIME = 24 * 60 * 60 * 1000; // 24시간

export const BatchTesterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(batchTesterReducer, {
        workflowStates: {},
        currentWorkflowId: null
    });

    // localStorage에서 상태 로드
    useEffect(() => {
        try {
            const persistedStates = localStorage.getItem(STORAGE_KEY);
            if (persistedStates) {
                const parsedStates: Record<string, BatchTestState> = JSON.parse(persistedStates);

                // 오래된 상태 정리 (24시간 이상 비활성)
                const now = Date.now();
                const validStates: Record<string, BatchTestState> = {};

                Object.entries(parsedStates).forEach(([workflowId, workflowState]) => {
                    const lastActivity = workflowState.lastActivityTimestamp || 0;
                    if (now - lastActivity < MAX_INACTIVE_TIME) {
                        const wasRunning = workflowState.isRunning;

                        // testData 상태 정리: 실행 중이었던 경우 상태를 적절히 복원
                        let restoredTestData = workflowState.testData || [];
                        if (wasRunning && restoredTestData.length > 0) {
                            // 실행 중이었던 항목들의 상태를 확인하고 복원
                            restoredTestData = restoredTestData.map((item, index) => {
                                if (item.status === 'running') {
                                    // 실행 중이었던 항목은 pending으로 되돌림
                                    return {
                                        ...item,
                                        status: 'pending' as const,
                                        actualOutput: null,
                                        error: null,
                                        executionTime: undefined
                                    };
                                }
                                return item;
                            });
                        }

                        // File 객체는 복원할 수 없으므로 파일명만 저장
                        validStates[workflowId] = {
                            ...workflowState,
                            testData: restoredTestData,
                            uploadedFile: null, // File 객체는 복원 불가
                            isRunning: false, // 페이지 새로고침 시 실행 상태 초기화
                            progress: wasRunning ? 0 : workflowState.progress, // 실행 중이었다면 진행률 초기화
                            completedCount: wasRunning ? 0 : workflowState.completedCount, // 완료 개수도 초기화
                        };
                    }
                });

                dispatch({ type: 'LOAD_PERSISTED_STATE', states: validStates });
            }
        } catch (error) {
            devLog.error('배치 테스터 상태 로드 실패:', error);
        }
    }, []);

    // localStorage에 상태 저장 - 디바운스 적용
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            try {
                // File 객체를 제외한 상태만 저장
                const serializableStates: Record<string, any> = {};

                Object.entries(state.workflowStates).forEach(([workflowId, workflowState]) => {
                    serializableStates[workflowId] = {
                        ...workflowState,
                        uploadedFile: null, // File 객체는 저장하지 않음
                        uploadedFileName: workflowState.uploadedFile?.name || workflowState.uploadedFileName
                    };
                });

                const serializedData = JSON.stringify(serializableStates);
                const currentData = localStorage.getItem(STORAGE_KEY);

                // 실제로 변경된 경우에만 저장
                if (currentData !== serializedData) {
                    localStorage.setItem(STORAGE_KEY, serializedData);
                }
            } catch (error) {
                devLog.error('배치 테스터 상태 저장 실패:', error);
            }
        }, 50); // 50ms 디바운스로 더 빠른 저장

        return () => clearTimeout(timeoutId);
    }, [state.workflowStates]);

    const getWorkflowState = (workflowId: string): BatchTestState => {
        return state.workflowStates[workflowId] || defaultBatchTestState;
    };

    const updateWorkflowState = (workflowId: string, updates: Partial<BatchTestState>) => {
        dispatch({
            type: 'SET_WORKFLOW_STATE',
            workflowId,
            state: updates
        });
    };

    const updateWorkflowStateFunc = (workflowId: string, updater: (prev: BatchTestState) => Partial<BatchTestState>) => {
        dispatch({
            type: 'UPDATE_WORKFLOW_STATE_FUNC',
            workflowId,
            updater
        });
    };

    const updateWorkflowTestData = (workflowId: string, updater: (prev: TestData[]) => TestData[]) => {
        dispatch({
            type: 'UPDATE_WORKFLOW_TESTDATA',
            workflowId,
            updater
        });
    };

    const clearWorkflowState = (workflowId: string) => {
        dispatch({
            type: 'CLEAR_WORKFLOW_STATE',
            workflowId
        });
    };

    const setCurrentWorkflow = (workflowId: string | null) => {
        dispatch({
            type: 'SET_CURRENT_WORKFLOW',
            workflowId
        });
    };

    const isWorkflowRunning = (workflowId: string): boolean => {
        return state.workflowStates[workflowId]?.isRunning || false;
    };

    const getRunningWorkflows = (): string[] => {
        return Object.entries(state.workflowStates)
            .filter(([_, state]) => state.isRunning)
            .map(([workflowId, _]) => workflowId);
    };

    const value: BatchTesterContextType = {
        getWorkflowState,
        updateWorkflowState,
        updateWorkflowStateFunc,
        updateWorkflowTestData,
        clearWorkflowState,
        setCurrentWorkflow,
        currentWorkflowId: state.currentWorkflowId,
        isWorkflowRunning,
        getRunningWorkflows
    };

    return (
        <BatchTesterContext.Provider value={value}>
            {children}
        </BatchTesterContext.Provider>
    );
};

export const useBatchTester = () => {
    const context = useContext(BatchTesterContext);
    if (context === undefined) {
        throw new Error('useBatchTester must be used within a BatchTesterProvider');
    }
    return context;
};
