import { useBatchTester, TestData } from '@/app/_common/contexts/BatchTesterContext';

export const useWorkflowBatchTester = (workflowId: string) => {
    const {
        getWorkflowState,
        updateWorkflowState,
        updateWorkflowStateFunc,
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
        // LLM 평가 관련 상태
        llmEvalEnabled: state.llmEvalEnabled,
        llmEvalType: state.llmEvalType,
        llmEvalModel: state.llmEvalModel,
        // LLM 평가 진행 상태
        isEvalRunning: state.isEvalRunning,
        evalProgress: state.evalProgress,
        evalCompletedCount: state.evalCompletedCount,
        evalTotalCount: state.evalTotalCount,

        // 액션
        updateTestData,
        setUploadedFile: (file: File | null) => updateWorkflowState(workflowId, { uploadedFile: file }),
        setIsRunning: (running: boolean) => updateWorkflowState(workflowId, { isRunning: running }),
        setProgress: (progress: number) => updateWorkflowState(workflowId, { progress }),
        setCompletedCount: (count: number) => updateWorkflowState(workflowId, { completedCount: count }),
        setBatchSize: (size: number) => updateWorkflowState(workflowId, { batchSize: size }),
        // LLM 평가 관련 액션
        setLLMEvalEnabled: (enabled: boolean) => updateWorkflowState(workflowId, { llmEvalEnabled: enabled }),
        setLLMEvalType: (type: 'vLLM' | 'OpenAI') => updateWorkflowState(workflowId, { llmEvalType: type }),
        setLLMEvalModel: (model: string) => updateWorkflowState(workflowId, { llmEvalModel: model }),
        // LLM 평가 진행 상태 액션
        setIsEvalRunning: (running: boolean) => updateWorkflowState(workflowId, { isEvalRunning: running }),
        setEvalProgress: (progress: number) => updateWorkflowState(workflowId, { evalProgress: progress }),
        setEvalCompletedCount: (count: number) => updateWorkflowState(workflowId, { evalCompletedCount: count }),
        setEvalTotalCount: (count: number) => updateWorkflowState(workflowId, { evalTotalCount: count }),
        clearTestData: () => updateWorkflowState(workflowId, {
            testData: [],
            uploadedFile: null,
            uploadedFileName: undefined
        }),

        // 배치 실행 전 초기화 (파일 정보는 유지하고 결과만 초기화)
        resetForBatchRun: () => {
            updateTestData((prevData: TestData[]) =>
                prevData.map((item: TestData) => ({
                    ...item,
                    status: 'pending' as const,
                    actualOutput: null,
                    error: null,
                    executionTime: undefined
                }))
            );
            updateWorkflowState(workflowId, {
                progress: 0,
                completedCount: 0,
                isRunning: false,
                // LLM 평가 관련 상태도 초기화
                isEvalRunning: false,
                evalProgress: 0,
                evalCompletedCount: 0,
                evalTotalCount: 0
            });
        },

        // 전체 상태 관리
        getWorkflowState: () => getWorkflowState(workflowId),
        updateWorkflowState: (updates: any) => updateWorkflowState(workflowId, updates),
        updateWorkflowStateFunc: (updater: (prev: any) => any) => updateWorkflowStateFunc(workflowId, updater),
        clearWorkflowState: () => clearWorkflowState(workflowId)
    };
};
