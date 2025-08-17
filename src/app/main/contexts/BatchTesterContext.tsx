'use client'
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

interface TestData {
    id: number;
    input: string;
    expectedOutput?: string;
    actualOutput?: string | null;
    status?: 'pending' | 'running' | 'success' | 'error';
    executionTime?: number;
    error?: string | null;
}

interface BatchTesterState {
    testData: TestData[];
    uploadedFile: File | null;
    isRunning: boolean;
    progress: number;
    completedCount: number;
    batchSize: number;
    currentWorkflowId: string | null;
}

interface BatchTesterContextType extends BatchTesterState {
    setTestData: (data: TestData[] | ((prev: TestData[]) => TestData[])) => void;
    setUploadedFile: (file: File | null) => void;
    setIsRunning: (running: boolean) => void;
    setProgress: (progress: number) => void;
    setCompletedCount: (count: number) => void;
    setBatchSize: (size: number) => void;
    setCurrentWorkflowId: (id: string | null) => void;
    clearTestData: () => void;
    loadStateFromStorage: (workflowId: string) => void;
    saveStateToStorage: (workflowId: string) => void;
}

const BatchTesterContext = createContext<BatchTesterContextType | undefined>(undefined);

const STORAGE_KEY_PREFIX = 'batchTester_';
const MAX_STORAGE_AGE = 24 * 60 * 60 * 1000; // 24시간

export const BatchTesterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [testData, setTestData] = useState<TestData[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);
    const [batchSize, setBatchSize] = useState(5);
    const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);

    // 상태 변경 감지를 위한 ref
    const stateRef = useRef({
        testData,
        uploadedFile,
        isRunning,
        progress,
        completedCount,
        batchSize
    });

    // 자동 저장 타이머 ref
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // 상태가 변경될 때마다 ref 업데이트
    useEffect(() => {
        stateRef.current = {
            testData,
            uploadedFile,
            isRunning,
            progress,
            completedCount,
            batchSize
        };
    }, [testData, uploadedFile, isRunning, progress, completedCount, batchSize]);

    // 컴포넌트 마운트 시 오래된 데이터 정리
    useEffect(() => {
        cleanupOldStorageItems();
    }, []);

    // 페이지 언로드 시 현재 상태 저장
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (currentWorkflowId) {
                // 동기적으로 저장 (브라우저가 닫히기 전에)
                const stateToSave = {
                    testData: stateRef.current.testData,
                    uploadedFileName: stateRef.current.uploadedFile?.name || null,
                    isRunning: false, // 페이지 리로드 시에는 항상 false
                    progress: stateRef.current.progress,
                    completedCount: stateRef.current.completedCount,
                    batchSize: stateRef.current.batchSize,
                    timestamp: Date.now()
                };
                
                try {
                    localStorage.setItem(`${STORAGE_KEY_PREFIX}${currentWorkflowId}`, JSON.stringify(stateToSave));
                } catch (error) {
                    console.error('Failed to save state on page unload:', error);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [currentWorkflowId]);

    // 오래된 localStorage 항목 정리
    const cleanupOldStorageItems = useCallback(() => {
        if (typeof window === 'undefined') return;
        
        const keys = Object.keys(localStorage);
        const now = Date.now();
        
        keys.forEach(key => {
            if (key.startsWith(STORAGE_KEY_PREFIX)) {
                try {
                    const item = localStorage.getItem(key);
                    if (item) {
                        const parsed = JSON.parse(item);
                        if (parsed.timestamp && (now - parsed.timestamp > MAX_STORAGE_AGE)) {
                            localStorage.removeItem(key);
                            console.log(`Removed old storage item: ${key}`);
                        }
                    }
                } catch {
                    // 파싱 실패한 항목은 삭제
                    localStorage.removeItem(key);
                    console.log(`Removed corrupted storage item: ${key}`);
                }
            }
        });
    }, []);

    // 디바운스된 자동 저장 함수
    const debouncedSave = useCallback((workflowId: string) => {
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            saveStateToStorage(workflowId);
        }, 2000); // 2초 디바운스
    }, []);

    // localStorage에 상태 저장 (실시간 상태 직접 사용)
    const saveStateToStorage = useCallback((workflowId: string, forcedState?: Partial<BatchTesterState>) => {
        if (typeof window === 'undefined' || !workflowId) return;

        // 강제 상태가 제공되면 사용, 아니면 현재 상태 사용
        const currentState = forcedState ? {
            testData: forcedState.testData || stateRef.current.testData,
            uploadedFile: forcedState.uploadedFile !== undefined ? forcedState.uploadedFile : stateRef.current.uploadedFile,
            isRunning: forcedState.isRunning !== undefined ? forcedState.isRunning : stateRef.current.isRunning,
            progress: forcedState.progress !== undefined ? forcedState.progress : stateRef.current.progress,
            completedCount: forcedState.completedCount !== undefined ? forcedState.completedCount : stateRef.current.completedCount,
            batchSize: forcedState.batchSize !== undefined ? forcedState.batchSize : stateRef.current.batchSize
        } : stateRef.current;
        
        // 저장할 데이터 준비 (기본 압축 적용)
        const stateToSave = {
            testData: currentState.testData.map(item => ({
                ...item,
                // 출력 결과와 에러 메시지 길이 제한 (localStorage 용량 최적화)
                actualOutput: item.actualOutput ? item.actualOutput.substring(0, 300) : null,
                error: item.error ? item.error.substring(0, 200) : null
            })),
            uploadedFileName: currentState.uploadedFile?.name || null,
            isRunning: currentState.isRunning,
            progress: currentState.progress,
            completedCount: currentState.completedCount,
            batchSize: currentState.batchSize,
            timestamp: Date.now()
        };

        try {
            const dataString = JSON.stringify(stateToSave);
            const sizeInKB = Math.round(dataString.length / 1024);
            
            // 1MB 초과 시 추가 압축
            if (sizeInKB > 1024) {
                console.warn(`데이터 크기가 큼 (${sizeInKB}KB), 압축 적용`);
                stateToSave.testData = stateToSave.testData.map(item => ({
                    ...item,
                    input: item.input.substring(0, 100),
                    actualOutput: item.actualOutput ? item.actualOutput.substring(0, 100) : null,
                    error: item.error ? item.error.substring(0, 100) : null
                }));
            }

            localStorage.setItem(`${STORAGE_KEY_PREFIX}${workflowId}`, JSON.stringify(stateToSave));
            
            console.log('✅ State saved to localStorage:', {
                workflowId,
                testDataCount: currentState.testData.length,
                completedCount: currentState.completedCount,
                isRunning: currentState.isRunning,
                sizeKB: Math.round(JSON.stringify(stateToSave).length / 1024),
                forced: !!forcedState
            });
        } catch (error) {
            console.error('❌ Failed to save state to localStorage:', error);
            
            // 실패 시 오래된 데이터 정리 후 최소 데이터만 저장
            try {
                cleanupOldStorageItems();
                const minimalState = {
                    testDataCount: currentState.testData.length,
                    completedCount: currentState.completedCount,
                    progress: currentState.progress,
                    batchSize: currentState.batchSize,
                    isRunning: currentState.isRunning,
                    timestamp: Date.now(),
                    note: 'Minimal save due to storage error'
                };
                localStorage.setItem(`${STORAGE_KEY_PREFIX}${workflowId}`, JSON.stringify(minimalState));
                console.log('Minimal state saved after error');
            } catch (retryError) {
                console.error('❌ Even minimal save failed:', retryError);
            }
        }
    }, [cleanupOldStorageItems]);

    // localStorage에서 상태 불러오기
    const loadStateFromStorage = useCallback((workflowId: string) => {
        if (typeof window === 'undefined' || !workflowId) return;

        try {
            const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${workflowId}`);
            if (!saved) {
                console.log('No saved state found for workflow:', workflowId);
                return;
            }

            const savedState = JSON.parse(saved);
            
            // 데이터 무결성 검증
            if (!savedState.timestamp || typeof savedState.timestamp !== 'number') {
                console.warn('Invalid saved state, removing:', workflowId);
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${workflowId}`);
                return;
            }
            
            // 24시간이 지난 데이터는 삭제
            if (Date.now() - savedState.timestamp > MAX_STORAGE_AGE) {
                console.log('Saved state expired, removing:', workflowId);
                localStorage.removeItem(`${STORAGE_KEY_PREFIX}${workflowId}`);
                return;
            }

            // 상태 복원
            if (Array.isArray(savedState.testData)) {
                console.log('Loading saved state:', {
                    workflowId,
                    testDataCount: savedState.testData.length,
                    completedCount: savedState.completedCount || 0,
                    wasRunning: savedState.isRunning
                });

                setTestData(savedState.testData);
                setIsRunning(false); // 항상 false로 시작 (실행 중 상태는 복원하지 않음)
                setProgress(savedState.progress || 0);
                setCompletedCount(savedState.completedCount || 0);
                setBatchSize(savedState.batchSize || 5);
                
                // 파일 이름 정보만 콘솔에 표시
                if (savedState.uploadedFileName) {
                    console.log(`Previously uploaded file: ${savedState.uploadedFileName}`);
                }
            } else {
                console.warn('Invalid testData in saved state');
            }
        } catch (error) {
            console.error('❌ Failed to load state from localStorage:', error);
            // 잘못된 데이터는 삭제
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}${workflowId}`);
        }
    }, []);

    // 실행 중일 때는 자동 저장 비활성화
    useEffect(() => {
        if (!currentWorkflowId || isRunning) {
            console.log('자동 저장 건너뜀:', { currentWorkflowId: !!currentWorkflowId, isRunning });
            return;
        }

        console.log('자동 저장 예약됨');
        debouncedSave(currentWorkflowId);

        // 컴포넌트 언마운트 시 타이머 정리
        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [testData, progress, completedCount, batchSize, currentWorkflowId, isRunning, debouncedSave]);

    // 실행 상태 변경 시에만 특별 처리 (isRunning false일 때만 저장)
    useEffect(() => {
        if (!currentWorkflowId) return;

        // isRunning이 false로 변경될 때만 즉시 저장
        if (!isRunning) {
            console.log('실행 완료 감지, 즉시 저장 예약');
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
            
            const timer = setTimeout(() => {
                console.log('실행 완료 후 즉시 저장 실행');
                saveStateToStorage(currentWorkflowId);
            }, 300); // 300ms 후 저장

            return () => clearTimeout(timer);
        } else {
            console.log('🚀 실행 시작 감지');
        }
    }, [isRunning, currentWorkflowId, saveStateToStorage]);

    const clearTestData = useCallback(() => {
        console.log('🗑️ Clearing test data');
        setTestData([]);
        setUploadedFile(null);
        setProgress(0);
        setCompletedCount(0);
        setIsRunning(false);
        
        // localStorage에서도 삭제
        if (currentWorkflowId) {
            localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentWorkflowId}`);
            console.log('🗑️ Removed saved state from localStorage');
        }
    }, [currentWorkflowId]);

    const value = {
        testData,
        uploadedFile,
        isRunning,
        progress,
        completedCount,
        batchSize,
        currentWorkflowId,
        setTestData,
        setUploadedFile,
        setIsRunning,
        setProgress,
        setCompletedCount,
        setBatchSize,
        setCurrentWorkflowId,
        clearTestData,
        loadStateFromStorage,
        saveStateToStorage
    };

    return (
        <BatchTesterContext.Provider value={value}>
            {children}
        </BatchTesterContext.Provider>
    );
};

export const useBatchTesterContext = () => {
    const context = useContext(BatchTesterContext);
    if (!context) {
        throw new Error('useBatchTesterContext must be used within BatchTesterProvider');
    }
    return context;
};