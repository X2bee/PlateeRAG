'use client'
import React, { useRef, useEffect, useState } from 'react';
import styles from '@/app/main/assets/Tester.module.scss';
import { FiUpload, FiDownload, FiPlay, FiFileText, FiTable, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { executeWorkflowTesterStream } from '@/app/api/workflowAPI';
import { devLog } from '@/app/_common/utils/logger';
import { useWorkflowBatchTester } from '@/app/_common/hooks/useWorkflowBatchTester';
import { TestData } from '@/app/_common/contexts/BatchTesterContext';
import { SSEMessage } from '@/app/_common/utils/sseManager';
import toast from 'react-hot-toast';

// 외부 라이브러리 동적 로드
declare global {
    interface Window {
        XLSX: any;
        mammoth: any;
    }
}

interface Workflow {
    id: number;
    workflow_name: string;
    workflow_id: string;
    node_count: number;
    updated_at: string;
    has_startnode: boolean;
    has_endnode: boolean;
}

interface TesterProps {
    workflow: Workflow | null;
}

interface TestResult {
    id: number;
    input: string;
    expected_output?: string | null;
    actual_output?: string | null;
    status: 'success' | 'error';
    execution_time?: number;
    error?: string | null;
}

const Tester: React.FC<TesterProps> = ({ workflow }) => {
    // 워크플로우별 상태 관리 Hook 사용
    const workflowId = workflow?.workflow_id || 'no-workflow';
    const workflowName = workflow?.workflow_name || 'Unknown Workflow';

    const {
        testData,
        uploadedFile,
        uploadedFileName,
        isRunning,
        progress,
        completedCount,
        batchSize,
        llmEvalEnabled,
        llmEvalType,
        llmEvalModel,
        isEvalRunning,
        evalProgress,
        evalCompletedCount,
        evalTotalCount,
        updateTestData,
        setUploadedFile,
        setIsRunning,
        setProgress,
        setCompletedCount,
        setBatchSize,
        setLLMEvalEnabled,
        setLLMEvalType,
        setLLMEvalModel,
        setIsEvalRunning,
        setEvalProgress,
        setEvalCompletedCount,
        setEvalTotalCount,
        clearTestData,
        resetForBatchRun,
        getWorkflowState,
        updateWorkflowState,
        updateWorkflowStateFunc,
        // SSE 관련 기능은 executeWorkflowTesterStream에서 직접 처리하므로 제거
        // isSSEConnected,
        // startSSEConnection,
        // stopSSEConnection
    } = useWorkflowBatchTester(workflowId);

    const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
    const [isMammothLoaded, setIsMammothLoaded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // OpenAI 모델 옵션
    const openAIModels = [
        {"value": "gpt-oss-20b", "label": "GPT-OSS-20B"},
        {"value": "gpt-oss-120b", "label": "GPT-OSS-120B"},
        {"value": "gpt-3.5-turbo", "label": "GPT-3.5 Turbo"},
        {"value": "gpt-4", "label": "GPT-4"},
        {"value": "gpt-4o", "label": "GPT-4o"},
        {"value": "gpt-5", "label": "GPT-5"},
        {"value": "gpt-5-mini", "label": "GPT-5 Mini"},
        {"value": "gpt-5-nano", "label": "GPT-5 Nano"},
    ];

    // 파일명이 있지만 File 객체가 없는 경우 (페이지 새로고침 후) UI에 파일명 표시
    useEffect(() => {
        // File 객체는 페이지 새로고침 후 복원할 수 없음
    }, [uploadedFileName]);

    const handleClearTestData = () => {
        clearTestData();
        // 파일 input 요소도 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 외부 라이브러리 로드 함수들은 동일하게 유지
    const loadXLSX = async () => {
        if (window.XLSX) {
            setIsXLSXLoaded(true);
            return;
        }

        try {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => setIsXLSXLoaded(true);
            document.head.appendChild(script);
        } catch (error) {
            devLog.error('XLSX 라이브러리 로드 실패:', error);
        }
    };

    const loadMammoth = async () => {
        if (window.mammoth) {
            setIsMammothLoaded(true);
            return;
        }

        try {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
            script.onload = () => setIsMammothLoaded(true);
            document.head.appendChild(script);
        } catch (error) {
            devLog.error('Mammoth 라이브러리 로드 실패:', error);
        }
    };

    useEffect(() => {
        loadXLSX();
        loadMammoth();
    }, []);

    // 파일 업로드 및 파싱 함수들은 동일하게 유지
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            // 파일이 선택되지 않았을 때 input 초기화
            if (event.target) {
                event.target.value = '';
            }
            return;
        }

        const maxSizeInBytes = 50 * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
            alert(`파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.\n현재 파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
            if (event.target) {
                event.target.value = '';
            }
            return;
        }

        setUploadedFile(file);

        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (fileExtension === 'csv') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                parseCSVContent(content);
                // 파싱 완료 후 input 초기화 (같은 파일 재선택 가능)
                if (event.target) {
                    event.target.value = '';
                }
            };
            reader.readAsText(file, 'UTF-8');
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as ArrayBuffer;
                parseExcelContent(data);
                // 파싱 완료 후 input 초기화 (같은 파일 재선택 가능)
                if (event.target) {
                    event.target.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as ArrayBuffer;
                parseWordContent(data);
                // 파싱 완료 후 input 초기화 (같은 파일 재선택 가능)
                if (event.target) {
                    event.target.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('지원되지 않는 파일 형식입니다. CSV, Excel, Word 파일만 업로드해주세요.');
            // 잘못된 파일 형식일 때도 input 초기화
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    // 파싱 함수들은 기존 코드와 동일하게 유지
    const parseCSVContent = (content: string) => {
        try {
            const parsedData: TestData[] = [];
            const lines = content.split('\n').filter(line => line.trim());
            const firstLine = lines[0];
            const hasHeader = firstLine.toLowerCase().includes('input') ||
                             firstLine.toLowerCase().includes('question') ||
                             firstLine.toLowerCase().includes('질문') ||
                             firstLine.toLowerCase().includes('expected') ||
                             firstLine.toLowerCase().includes('예상') ||
                             firstLine.toLowerCase().includes('output');

            const startIndex = hasHeader ? 1 : 0;

            for (let i = startIndex; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const values = parseCSVLine(line);

                if (values.length >= 1 && values[0].trim()) {
                    parsedData.push({
                        id: i - startIndex + 1,
                        input: values[0].trim(),
                        expectedOutput: values[1] ? values[1].trim() : undefined,
                        status: 'pending'
                    });
                }
            }

            updateTestData(parsedData);
        } catch (error) {
            devLog.error('CSV 파싱 중 오류:', error);
            alert('CSV 파일을 파싱하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        }
    };

    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }

        result.push(current);
        return result;
    };

    // Excel, Word 파싱 함수들도 동일하게 유지하되, 마지막에 저장 추가
    const parseExcelContent = (data: ArrayBuffer) => {
        if (!window.XLSX) {
            alert('Excel 파일 처리 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        try {
            const parsedData: TestData[] = [];
            const workbook = window.XLSX.read(data, {
                type: 'array',
                cellDates: true,
                cellNF: false,
                cellText: false
            });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const jsonData = window.XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '',
                blankrows: false
            }) as string[][];

            const hasHeader = jsonData.length > 0 && jsonData[0].some(cell =>
                String(cell).toLowerCase().includes('input') ||
                String(cell).toLowerCase().includes('question') ||
                String(cell).toLowerCase().includes('질문') ||
                String(cell).toLowerCase().includes('expected') ||
                String(cell).toLowerCase().includes('예상') ||
                String(cell).toLowerCase().includes('output')
            );

            const startIndex = hasHeader ? 1 : 0;

            for (let i = startIndex; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row.length >= 1 && row[0] && String(row[0]).trim()) {
                    parsedData.push({
                        id: i - startIndex + 1,
                        input: String(row[0]).trim(),
                        expectedOutput: row[1] ? String(row[1]).trim() : undefined,
                        status: 'pending'
                    });
                }
            }

            updateTestData(parsedData);
        } catch (error) {
            devLog.error('Excel 파싱 중 오류:', error);
            alert('Excel 파일을 파싱하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        }
    };

    const parseWordContent = async (data: ArrayBuffer) => {
        if (!window.mammoth) {
            alert('Word 파일 처리 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        try {
            const result = await window.mammoth.extractRawText({ arrayBuffer: data });
            const text = result.value;
            const parsedData: TestData[] = [];

            const lines = text.split('\n').filter((line: string) => line.trim());

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const questionMatch = line.match(/^Q\d*[.:\s]+(.+)/i);

                if (questionMatch) {
                    const question = questionMatch[1].trim();

                    if (question.length > 0) {
                        parsedData.push({
                            id: parsedData.length + 1,
                            input: question,
                            expectedOutput: undefined,
                            status: 'pending'
                        });
                    }
                }
            }

            if (parsedData.length === 0) {
                alert('Word 파일에서 질문을 찾을 수 없습니다. "Q1.", "Q2." 형식으로 작성해주세요.');
                return;
            }

            updateTestData(parsedData);
            devLog.log(`Word 파일에서 ${parsedData.length}개의 질문을 추출했습니다.`);

        } catch (error) {
            devLog.error('Word 파싱 중 오류:', error);
            alert('Word 파일을 파싱하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        }
    };

    const runTest = async () => {
        if (!workflow || testData.length === 0) {
            alert('워크플로우를 선택하고 테스트 데이터를 업로드해주세요.');
            return;
        }

        // 테스터 실행 전 완전 초기화 (파일 정보는 유지하고 이전 결과만 모두 제거)
        resetForBatchRun();

        // 초기화 후 상태 확인
        const initialState = getWorkflowState();
        devLog.log('🔄 테스터 실행 전 eval 상태 확인:', {
            isEvalRunning: initialState.isEvalRunning,
            evalProgress: initialState.evalProgress,
            evalCompletedCount: initialState.evalCompletedCount,
            evalTotalCount: initialState.evalTotalCount
        });

        // 실행 상태로 변경
        setIsRunning(true);

        try {
            // 실행 시점의 최신 데이터를 함수형으로 가져오기 (모든 상태가 pending으로 초기화된 상태)
            const currentTestData = getWorkflowState().testData;

            const testRequest = {
                workflowName: workflow.workflow_name.replace('.json', ''),
                workflowId: workflow.workflow_id,
                testCases: currentTestData.map((item: TestData) => ({
                    id: item.id,
                    input: item.input,
                    expectedOutput: item.expectedOutput || null
                })),
                batchSize: batchSize,
                interactionId: 'tester_test',
                selectedCollections: null,
                llmEvalEnabled: llmEvalEnabled,
                llmEvalType: llmEvalType,
                llmEvalModel: llmEvalModel
            };

            // streamResults는 더 이상 사용하지 않음 (즉시 Context 업데이트로 대체)
            let testId = '';
            let finalStats = {
                total_count: 0,
                success_count: 0,
                error_count: 0,
                total_execution_time: 0
            };

            // 실제 배치 실행 직전에 실행 중 상태로 변경
            updateTestData((prevData: TestData[]) =>
                prevData.map((item: TestData) => ({
                    ...item,
                    status: 'running' as const,
                    llm_eval_score: undefined // LLM 평가 점수 초기화
                }))
            );

            // 실제 테스터 실행 - SSE 콜백과 함께
            await (executeWorkflowTesterStream as any)({
                workflowName: testRequest.workflowName,
                workflowId: testRequest.workflowId,
                testCases: testRequest.testCases,
                batchSize: testRequest.batchSize,
                interactionId: testRequest.interactionId,
                selectedCollections: testRequest.selectedCollections,
                llmEvalEnabled: testRequest.llmEvalEnabled,
                llmEvalType: testRequest.llmEvalType,
                llmEvalModel: testRequest.llmEvalModel,
                onMessage: (data: SSEMessage) => {
                    switch (data.type) {
                        case 'tester_start':
                            testId = data.batch_id || '';
                            break;

                        case 'group_start':
                            break;

                        case 'test_result':
                            {
                                const result = data.result;
                                if (result) {
                                    // 결과를 즉시 Context에 반영하여 페이지 이탈 시에도 보존
                                    updateTestData((prevData: TestData[]) => {
                                        const newData = prevData.map((item: TestData) => {
                                            if (item.id === result.id) {
                                                return {
                                                    ...item,
                                                    status: result.status as 'success' | 'error',
                                                    actualOutput: result.actual_output || '결과 없음',
                                                    executionTime: result.execution_time || 0,
                                                    error: result.error || null
                                                };
                                            }
                                            return item;
                                        });

                                        return newData;
                                    });
                                } else {
                                    devLog.error('❌ 결과 데이터가 없습니다:', data);
                                }
                            break; }

                        case 'eval_start':
                            {
                                devLog.log('LLM 평가 시작:', data.message);

                                // 전체 테스트 케이스 개수를 기준으로 LLM 평가 진행률 계산
                                const currentTestData = getWorkflowState().testData;
                                const totalTestCount = currentTestData.length;

                                // eval 상태를 강제로 초기화
                                updateWorkflowState({
                                    isEvalRunning: true,
                                    evalProgress: 0,
                                    evalCompletedCount: 0,  // 강제로 0으로 초기화
                                    evalTotalCount: totalTestCount
                                });

                                devLog.log(`LLM 평가 진행률 기준: ${totalTestCount}개 (전체 테스트)`);

                                // 성공한 테스트들을 평가 진행중 상태로 변경
                                updateTestData((prevData: TestData[]) => {
                                    return prevData.map((item: TestData) => {
                                        if (item.status === 'success') {
                                            return {
                                                ...item,
                                                evalStatus: 'running' // 평가 진행중
                                            };
                                        }
                                        return item;
                                    });
                                });
                            break; }

                        case 'eval_result':
                            {
                                // LLM 평가 점수를 테스트 데이터에 반영
                                const testId = data.test_id;
                                const score = data.llm_eval_score;

                                updateTestData((prevData: TestData[]) => {
                                    return prevData.map((item: TestData) => {
                                        if (item.id === testId) {
                                            return {
                                                ...item,
                                                llm_eval_score: score,
                                                evalStatus: 'completed' // 평가 완료
                                            };
                                        }
                                        return item;
                                    });
                                });

                                // 평가 진행 상태 업데이트 - 함수형 업데이트로 정확한 계산
                                updateWorkflowStateFunc((prevState) => {
                                    const newCount = prevState.evalCompletedCount + 1;
                                    const progress = prevState.evalTotalCount > 0 ? (newCount / prevState.evalTotalCount) * 100 : 0;

                                    devLog.log(`LLM 평가 진행: ${newCount}/${prevState.evalTotalCount} (${Math.round(progress)}%)`);

                                    return {
                                        evalCompletedCount: newCount,
                                        evalProgress: progress
                                    };
                                });

                                devLog.log(`테스트 ${testId} LLM 평가 완료: ${score}`);
                            break; }

                        case 'eval_error':
                            devLog.error(`테스트 ${data.test_id} LLM 평가 실패:`, data.error);

                            // 평가 실패한 테스트도 완료 상태로 변경
                            updateTestData((prevData: TestData[]) => {
                                return prevData.map((item: TestData) => {
                                    if (item.id === data.test_id) {
                                        return {
                                            ...item,
                                            evalStatus: 'completed' // 평가 완료 (실패)
                                        };
                                    }
                                    return item;
                                });
                            });

                            // 에러가 발생해도 진행 상태는 업데이트 - 함수형 업데이트로 정확한 계산
                            updateWorkflowStateFunc((prevState) => {
                                const newCount = prevState.evalCompletedCount + 1;
                                const progress = prevState.evalTotalCount > 0 ? (newCount / prevState.evalTotalCount) * 100 : 0;

                                devLog.log(`LLM 평가 진행 (오류 포함): ${newCount}/${prevState.evalTotalCount} (${Math.round(progress)}%)`);

                                return {
                                    evalCompletedCount: newCount,
                                    evalProgress: progress
                                };
                            });
                            break;

                        case 'eval_complete':
                            devLog.log('LLM 평가 완료:', data.message);
                            setIsEvalRunning(false);
                            setEvalProgress(100);
                            break;

                        case 'progress':
                            setProgress(data.progress || 0);
                            setCompletedCount(data.completed_count || 0);
                            break;

                        case 'tester_complete':
                            finalStats = {
                                total_count: data.total_count || 0,
                                success_count: data.success_count || 0,
                                error_count: data.error_count || 0,
                                total_execution_time: data.total_execution_time || 0
                            };
                            setProgress(100);
                            setCompletedCount(data.total_count || 0);
                            break;

                        case 'error':
                            devLog.error('테스터 실행 오류:', data);
                            throw new Error(data.error || data.message || '테스터 실행 중 오류 발생');

                        default:
                            break;
                    }
                },
                onEnd: () => {
                    // onEnd에서 testData를 덮어쓰지 않음!
                    // 이미 test_result에서 즉시 업데이트했으므로 여기서는 상태만 정리
                    setIsRunning(false);

                    // 성공률에 따른 토스트 메시지
                    const successRate = finalStats.total_count > 0 ? (finalStats.success_count / finalStats.total_count) * 100 : 0;
                    if (successRate === 100) {
                        toast.success('모든 테스트가 성공했습니다!');
                    } else if (successRate >= 80) {
                        toast.success('대부분의 테스트가 성공했습니다!');
                    } else if (finalStats.error_count > 0) {
                        toast.error('일부 테스트가 실패했습니다. 결과를 확인해주세요.');
                    }
                },
                onError: (error: Error) => {
                    devLog.error('테스터 스트리밍 오류:', error);
                    setIsRunning(false);
                    throw error;
                }
            });

        } catch (error: unknown) {
            devLog.error('❌ 테스터 실행 중 오류:', error);

            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

            // 에러 발생 시 상태 업데이트
            const errorData = testData.map(item => ({
                ...item,
                status: 'error' as const,
                error: errorMessage,
                actualOutput: null,
                executionTime: 0,
                llm_eval_score: undefined // LLM 평가 점수도 초기화
            }));

            devLog.log('에러 상태로 업데이트 중...');
            updateTestData(errorData);
            setCompletedCount(0);
            setProgress(0);
            setIsRunning(false);
            setIsEvalRunning(false);
            setEvalProgress(0);
            setEvalCompletedCount(0);
            setEvalTotalCount(0);

            devLog.log('❌ 에러로 인한 eval 상태 초기화 완료');

            const detailedErrorMessage = `❌ 테스터 실행 중 오류가 발생했습니다.\n\n` +
                                       `🔍 오류 내용:\n${errorMessage}\n\n` +
                                       `💡 해결 방법:\n` +
                                       `• 워크플로우가 올바르게 설정되어 있는지 확인\n` +
                                       `• 네트워크 연결 상태 확인\n` +
                                       `• 서버 로그 확인`;

            alert(detailedErrorMessage);
        }

        devLog.log('테스터 프로세스 완료');
    };

    const formatExecutionTime = (ms?: number): string => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    // 실제 결과에서 <think> 태그와 [Cite.{...}] 패턴을 제거하는 helper 함수
    const parseActualOutput = (output: string | null | undefined): string => {
        if (!output) return '';

        let cleanedOutput = output;

        cleanedOutput = cleanedOutput.replace(/<think>[\s\S]*?<\/think>/gi, '');

        if (cleanedOutput.includes('<TOOLUSELOG>') && cleanedOutput.includes('</TOOLUSELOG>')) {
            cleanedOutput = cleanedOutput.replace(/<TOOLUSELOG>[\s\S]*?<\/TOOLUSELOG>/g, '');
        }

        if (cleanedOutput.includes('<TOOLOUTPUTLOG>') && cleanedOutput.includes('</TOOLOUTPUTLOG>')) {
            cleanedOutput = cleanedOutput.replace(/<TOOLOUTPUTLOG>[\s\S]*?<\/TOOLOUTPUTLOG>/g, '');
        }

        if (cleanedOutput.includes('[Cite.') && cleanedOutput.includes('}]')) {
            cleanedOutput = cleanedOutput.replace(/\[Cite\.\s*\{[\s\S]*?\}\]/g, '');
        }

        return cleanedOutput.trim();
    };

    const downloadResults = () => {
        if (testData.length === 0) return;

        const headers = llmEvalEnabled
            ? 'ID,입력 내용,예상 결과,실제 결과,평가,상태,소요 시간,오류'
            : 'ID,입력 내용,예상 결과,실제 결과,상태,소요 시간,오류';

        const csvContent = [
            headers,
            ...testData.map(item => {
                const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
                const baseData = [
                    item.id,
                    escapeCsv(item.input),
                    escapeCsv(item.expectedOutput || ''),
                    escapeCsv(parseActualOutput(item.actualOutput) || ''),
                ];

                if (llmEvalEnabled) {
                    const score = (item as any).llm_eval_score !== undefined
                        ? parseFloat((item as any).llm_eval_score).toFixed(1)
                        : '0.0';
                    baseData.push(score);
                }

                baseData.push(
                    item.status || 'pending',
                    formatExecutionTime(item.executionTime),
                    escapeCsv(item.error || '')
                );

                return baseData.join(',');
            })
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `test_results_${workflow?.workflow_name.replace('.json', '') || 'unknown'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (!workflow) {
        return (
            <div className={styles.batchTesterPanel}>
                <div className={styles.placeholder}>
                    <h3>워크플로우를 선택하세요</h3>
                    <p>
                        왼쪽 목록에서 워크플로우를 선택하면 테스터를 시작할 수 있습니다.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.batchTesterPanel}>
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.docx,.doc"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Header */}
            <div className={styles.batchTesterHeader}>
                <h3>{workflow.workflow_name.replace('.json', '')} - 테스터</h3>
                <div className={styles.headerActions}>
                    <div className={styles.batchSizeSelector}>
                        <label>동시 실행:</label>
                        <select
                            value={batchSize}
                            onChange={(e) => setBatchSize(Number(e.target.value))}
                            disabled={isRunning}
                            title="서버에서 동시에 처리할 테스트 개수입니다."
                        >
                            <option value={1}>1개 (안전)</option>
                            <option value={3}>3개 (권장)</option>
                            <option value={5}>5개 (기본)</option>
                            <option value={10}>10개 (고성능)</option>
                            <option value={20}>20개 (최대)</option>
                        </select>
                    </div>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRunning}
                        className={`${styles.btn} ${styles.upload}`}
                    >
                        <FiUpload />
                        파일 업로드
                    </button>
                    <button
                        onClick={runTest}
                        disabled={!testData.length || isRunning}
                        className={`${styles.btn} ${styles.run}`}
                        title="워크플로우를 테스트합니다."
                    >
                        {isRunning ? <FiRefreshCw className={styles.spinning} /> : <FiPlay />}
                        {isRunning ? '진행 중...' : '테스트 시작'}
                    </button>
                    <button
                        onClick={downloadResults}
                        disabled={!testData.length || testData.every(item => item.status === 'pending')}
                        className={`${styles.btn} ${styles.download}`}
                    >
                        <FiDownload />
                        결과 다운로드
                    </button>
                    {testData.length > 0 && (
                        <button
                            onClick={handleClearTestData}
                            disabled={isRunning}
                            className={styles.clearBtn}
                        >
                            <FiTrash2 />
                            초기화
                        </button>
                    )}
                </div>
            </div>

            {/* LLM 평가 설정 */}
            <div className={styles.llmEvalSection}>
                <div className={styles.llmEvalMainRow}>
                    <label className={styles.llmEvalLabel}>
                        <div className={styles.customCheckbox}>
                            <input
                                type="checkbox"
                                checked={llmEvalEnabled}
                                onChange={(e) => setLLMEvalEnabled(e.target.checked)}
                                disabled={isRunning}
                            />
                            <span className={styles.checkmark}></span>
                        </div>
                        LLM 평가 사용
                    </label>
                </div>

                {llmEvalEnabled && (
                    <>
                        <div className={styles.llmEvalDivider}></div>
                        <div className={styles.llmEvalContent}>
                            <div className={styles.llmEvalRow}>
                                <label>LLM 평가 종류:</label>
                                <select
                                    value={llmEvalType}
                                    onChange={(e) => {
                                        const newType = e.target.value as 'vLLM' | 'OpenAI';
                                        setLLMEvalType(newType);
                                        // OpenAI로 변경 시 기본 모델 설정
                                        if (newType === 'OpenAI') {
                                            setLLMEvalModel('gpt-5');
                                        } else {
                                            setLLMEvalModel('vllm_model');
                                        }
                                    }}
                                    disabled={isRunning}
                                    className={styles.llmEvalSelect}
                                >
                                    <option value="vLLM">vLLM</option>
                                    <option value="OpenAI">OpenAI</option>
                                </select>
                            </div>

                            <div className={styles.llmEvalRow}>
                                <label>LLM 평가 모델:</label>
                                {llmEvalType === 'OpenAI' ? (
                                    <select
                                        value={llmEvalModel}
                                        onChange={(e) => setLLMEvalModel(e.target.value)}
                                        disabled={isRunning}
                                        className={styles.llmEvalSelect}
                                    >
                                        {openAIModels.map(model => (
                                            <option key={model.value} value={model.value}>
                                                {model.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className={styles.llmEvalNotice}>
                                        vLLM 선택시, 현재 환경 설정된 vLLM 모델을 사용하여 작업을 진행합니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* File Info */}
            {(uploadedFile || uploadedFileName) && (
                <div className={styles.fileInfo}>
                    <FiTable />
                    <span className={styles.fileName}>
                        {uploadedFile?.name || uploadedFileName || '알 수 없는 파일'}
                        {!uploadedFile && uploadedFileName && (
                            <FiAlertCircle title="파일이 새로고침으로 인해 사라졌습니다. 다시 업로드해주세요." />
                        )}
                    </span>
                    <span className={styles.fileType}>
                        {(uploadedFile?.name || uploadedFileName || '').split('.').pop()?.toUpperCase()}
                    </span>
                    <span>{testData.length}개 테스트 케이스</span>
                </div>
            )}

            {/* Progress */}
            {isRunning && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressHeader}>
                        <span>
                            워크플로우 테스트 진행 중...
                        </span>
                        <span className={styles.progressStats}>
                            {completedCount} / {testData.length} 완료 ({Math.round(progress)}%)
                        </span>
                    </div>
                    <div className={styles.progress}>
                        <div
                            className={styles.progress__fill}
                            style={{ '--progress': `${progress}%` } as React.CSSProperties}
                        />
                    </div>
                </div>
            )}

            {/* LLM Evaluation Progress */}
            {isEvalRunning && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressHeader}>
                        <span>
                            LLM 평가 진행 중...
                        </span>
                        <span className={styles.progressStats}>
                            {evalCompletedCount} / {evalTotalCount} 완료 ({Math.round(evalProgress)}%)
                        </span>
                    </div>
                    <div className={styles.progress}>
                        <div
                            className={`${styles.progress__fill} ${styles['progress__fill--eval']}`}
                            style={{ '--progress': `${evalProgress}%` } as React.CSSProperties}
                        />
                    </div>
                </div>
            )}

            {/* Results */}
            {testData.length > 0 ? (
                <div className={styles.resultsContainer}>
                    <div className={styles.resultsHeader}>
                        <h4>테스트 결과</h4>
                        <div className={styles.resultsSummary}>
                            <span className={styles.total}>
                                총 {testData.length}개
                            </span>
                            <span className={styles.success}>
                                ✅ 성공 {testData.filter(item => item.status === 'success').length}개
                                {testData.length > 0 && (
                                    <small>({((testData.filter(item => item.status === 'success').length / testData.length) * 100).toFixed(1)}%)</small>
                                )}
                            </span>
                            <span className={styles.error}>
                                ❌ 실패 {testData.filter(item => item.status === 'error').length}개
                            </span>
                            <span className={styles.pending}>
                                ⏳ 대기 {testData.filter(item => item.status === 'pending').length}개
                            </span>
                            <span className={styles.running}>
                                🔄 실행중 {testData.filter(item => item.status === 'running').length}개
                            </span>
                        </div>
                    </div>

                    {/* 성능 통계 */}
                    {testData.some(item => item.executionTime && item.executionTime > 0) && (
                        <div className={styles.performanceStats}>
                            <h5>성능 통계</h5>
                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <span>평균 실행시간:</span>
                                    <span className={styles.statValue}>
                                        {(() => {
                                            const completedTests = testData.filter(item => item.executionTime && item.executionTime > 0);
                                            const avgTime = completedTests.length > 0
                                                ? completedTests.reduce((sum, item) => sum + (item.executionTime || 0), 0) / completedTests.length
                                                : 0;
                                            return formatExecutionTime(avgTime);
                                        })()}
                                    </span>
                                </div>
                                <div className={styles.statItem}>
                                    <span>최고 속도:</span>
                                    <span className={styles.statValue}>
                                        {(() => {
                                            const times = testData.filter(item => item.executionTime && item.executionTime > 0).map(item => item.executionTime || 0);
                                            return times.length > 0 ? formatExecutionTime(Math.min(...times)) : '-';
                                        })()}
                                    </span>
                                </div>
                                <div className={styles.statItem}>
                                    <span>최저 속도:</span>
                                    <span className={styles.statValue}>
                                        {(() => {
                                            const times = testData.filter(item => item.executionTime && item.executionTime > 0).map(item => item.executionTime || 0);
                                            return times.length > 0 ? formatExecutionTime(Math.max(...times)) : '-';
                                        })()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.resultsTable}>
                        <div className={`${styles.results__header} ${llmEvalEnabled ? styles.withEval : ''}`}>
                            <div>ID</div>
                            <div>입력 내용</div>
                            <div>기대 답변</div>
                            <div>실제 결과</div>
                            {llmEvalEnabled && <div>정답여부</div>}
                            {llmEvalEnabled && <div>평가</div>}
                            <div>상태</div>
                            <div>소요 시간</div>
                        </div>

                        <div className={styles.results__body}>
                            {testData.map((item, index) => (
                                <div key={item.id} className={`${styles.results__row} ${llmEvalEnabled ? styles.withEval : ''}`}>
                                    <div className={styles.results__id}>{item.id}</div>
                                    <div className={styles.results__input} title={item.input}>
                                        {item.input.length > 50 ? `${item.input.substring(0, 50)}...` : item.input}
                                    </div>
                                    <div className={styles.results__expected} title={item.expectedOutput || undefined}>
                                        {item.expectedOutput ?
                                            (item.expectedOutput.length > 50 ? `${item.expectedOutput.substring(0, 50)}...` : item.expectedOutput)
                                            : '-'
                                        }
                                    </div>
                                    <div className={styles.results__actual} title={parseActualOutput(item.actualOutput) || undefined}>
                                        {item.actualOutput ? (() => {
                                            const parsedOutput = parseActualOutput(item.actualOutput);
                                            return parsedOutput.length > 50 ? `${parsedOutput.substring(0, 50)}...` : parsedOutput;
                                        })() : (item.status === 'running' ?
                                                <span className={styles.running}>
                                                    <FiRefreshCw className={styles.spinning} />
                                                    실행 중...
                                                </span>
                                                : '-')
                                        }
                                    </div>
                                    {llmEvalEnabled && (
                                        <div className={styles.results__correct}>
                                            {(item as any).llm_eval_score !== undefined ? (
                                                parseFloat((item as any).llm_eval_score) >= 0.5 ? (
                                                    <FiCheckCircle style={{ color: 'green' }} />
                                                ) : (
                                                    <FiXCircle style={{ color: 'red' }} />
                                                )
                                            ) : '-'}
                                        </div>
                                    )}
                                    {llmEvalEnabled && (
                                        <div className={styles.results__score}>
                                            {(item as any).llm_eval_score !== undefined
                                                ? parseFloat((item as any).llm_eval_score).toFixed(3)
                                                : item.status === 'success' && !isEvalRunning ?
                                                    '-'
                                                    : '-'
                                            }
                                        </div>
                                    )}
                                    <div className={styles.results__status}>
                                        <span className={`${styles.status} ${styles[`status--${item.status}`]}`}>
                                            {(item as any).evalStatus === 'running' ? (
                                                <>
                                                    <FiRefreshCw className={styles.spinning} />
                                                    평가중
                                                </>
                                            ) : (
                                                <>
                                                    {item.status === 'success' && <FiCheckCircle />}
                                                    {item.status === 'error' && <FiXCircle />}
                                                    {item.status === 'running' && <FiRefreshCw className={styles.spinning} />}
                                                    {item.status === 'pending' && <FiClock />}
                                                    {item.status === 'success' ? '성공' :
                                                     item.status === 'error' ? '실패' :
                                                     item.status === 'running' ? '실행중' : '대기'}
                                                </>
                                            )}
                                        </span>
                                    </div>
                                    <div className={styles.results__time}>
                                        {formatExecutionTime(item.executionTime)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <h4>테스터를 시작해보세요</h4>
                    <p>CSV 또는 Excel 파일을 업로드하여 여러 테스트를 한 번에 실행할 수 있습니다.</p>

                    <div className={styles.fileFormatInfo}>
                        <h5>📄 지원 파일 형식</h5>
                        <div className={styles.formatList}>
                            <div className={styles.formatItem}>
                                <strong>첫 번째 열:</strong> 입력 데이터 (필수)
                            </div>
                            <div className={styles.formatItem}>
                                <strong>두 번째 열:</strong> 예상 결과 (선택사항)
                            </div>
                            <div className={styles.formatItem}>
                                <strong>첫 번째 행:</strong> 헤더 (input, expected, output 등 키워드 자동 감지)
                            </div>
                            <div className={styles.formatItem}>
                                <strong>예시 헤더:</strong> "Input,Expected Output" 또는 "질문,예상답변"
                            </div>
                        </div>
                        <div className={styles.supportedFormats}>
                            <span>지원 형식:</span>
                            <span className={styles.formatBadge}>.csv</span>
                            <span className={styles.formatBadge}>.xlsx</span>
                            <span className={styles.formatBadge}>.xls</span>
                            <span className={styles.formatBadge}>.docx</span>
                            <span className={styles.formatBadge}>.doc</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tester;
