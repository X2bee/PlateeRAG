import { useBatchTester, TestData } from '@/app/_common/contexts/BatchTesterContext';

export const useWorkflowBatchTester = (workflowId: string) => {
    const {
        getWorkflowState,
        updateWorkflowState,
        updateWorkflowTestData,
        clearWorkflowState
    } = useBatchTester();

    const updateTestData = (updater: ((prev: TestData[]) => TestData[]) | TestData[]) => {
        if (typeof updater === 'function') {
            // 함수형 업데이트는 Context에서 직접 처리하여 최신 상태 보장
            updateWorkflowTestData(workflowId, updater);
        } else {
            // 직접 값 설정은 기존 방식 사용
            updateWorkflowState(workflowId, { testData: updater });
        }
    };

    const state = getWorkflowState(workflowId);

    return {
        // 상태
        testData: state.testData,
        uploadedFile: state.uploadedFile,
        uploadedFileName: state.uploadedFileName,
        isRunning: state.isRunning,
        progress: state.progress,
        completedCount: state.completedCount,
        batchSize: state.batchSize,

        // 액션
        updateTestData,
        setUploadedFile: (file: File | null) => updateWorkflowState(workflowId, { uploadedFile: file }),
        setIsRunning: (running: boolean) => updateWorkflowState(workflowId, { isRunning: running }),
        setProgress: (progress: number) => updateWorkflowState(workflowId, { progress }),
        setCompletedCount: (count: number) => updateWorkflowState(workflowId, { completedCount: count }),
        setBatchSize: (size: number) => updateWorkflowState(workflowId, { batchSize: size }),
        clearTestData: () => updateWorkflowState(workflowId, {
            testData: [],
            uploadedFile: null,
            uploadedFileName: undefined
        }),

        // 전체 상태 관리
        getWorkflowState: () => getWorkflowState(workflowId),
        updateWorkflowState: (updates: any) => updateWorkflowState(workflowId, updates),
        clearWorkflowState: () => clearWorkflowState(workflowId)
    };
};
