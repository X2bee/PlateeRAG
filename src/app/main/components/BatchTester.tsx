'use client'
import React, { useRef, useEffect, useCallback } from 'react';
import styles from '@/app/main/assets/BatchTester.module.scss';
import { FiUpload, FiDownload, FiPlay, FiFileText, FiTable, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useBatchTesterContext } from '@/app/main/contexts/BatchTesterContext';
import { executeWorkflowById, executeWorkflowBatch } from '@/app/api/workflowAPI';

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

interface BatchTesterProps {
    workflow: Workflow | null;
}

interface TestData {
    id: number;
    input: string;
    expectedOutput?: string;
    actualOutput?: string | null;
    status?: 'pending' | 'running' | 'success' | 'error';
    executionTime?: number;
    error?: string | null;
}

interface BatchTestResult {
    id: number;
    input: string;
    expected_output?: string | null;
    actual_output?: string | null;
    status: 'success' | 'error';
    execution_time?: number;
    error?: string | null;
}

interface BatchExecuteResponse {
    batch_id: string;
    total_count: number;
    success_count: number;
    error_count: number;
    total_execution_time: number;
    results: BatchTestResult[];
}

const BatchTester: React.FC<BatchTesterProps> = ({ workflow }) => {
    const {
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
    } = useBatchTesterContext();

    const [isXLSXLoaded, setIsXLSXLoaded] = React.useState(false);
    const [isMammothLoaded, setIsMammothLoaded] = React.useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            console.error('XLSX 라이브러리 로드 실패:', error);
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
            console.error('Mammoth 라이브러리 로드 실패:', error);
        }
    };

    useEffect(() => {
        loadXLSX();
        loadMammoth();
    }, []);

    // 워크플로우 변경 시 상태 로드/저장
    useEffect(() => {
        if (workflow && workflow.workflow_id !== currentWorkflowId) {
            // 이전 워크플로우 상태 저장
            if (currentWorkflowId) {
                saveStateToStorage(currentWorkflowId);
            }

            // 새 워크플로우 상태 로드
            setCurrentWorkflowId(workflow.workflow_id);
            loadStateFromStorage(workflow.workflow_id);
        }
    }, [workflow?.workflow_id]);

    // 파일 업로드 및 파싱 함수들은 동일하게 유지
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
            };
            reader.readAsText(file, 'UTF-8');
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as ArrayBuffer;
                parseExcelContent(data);
            };
            reader.readAsArrayBuffer(file);
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as ArrayBuffer;
                parseWordContent(data);
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('지원되지 않는 파일 형식입니다. CSV, Excel, Word 파일만 업로드해주세요.');
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
                             firstLine.toLowerCase().includes('질문');

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

            setTestData(parsedData);
            // 즉시 저장
            if (workflow) {
                setTimeout(() => saveStateToStorage(workflow.workflow_id), 100);
            }
        } catch (error) {
            console.error('CSV 파싱 중 오류:', error);
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
                String(cell).toLowerCase().includes('질문')
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

            setTestData(parsedData);
            // 즉시 저장
            if (workflow) {
                setTimeout(() => saveStateToStorage(workflow.workflow_id), 100);
            }
        } catch (error) {
            console.error('Excel 파싱 중 오류:', error);
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

            // "Q1.", "Q2." 형식의 질문 찾기
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                //TODO 수정했는데 문제 없는지 확인.
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

            setTestData(parsedData);
            console.log(`Word 파일에서 ${parsedData.length}개의 질문을 추출했습니다.`);

            // 즉시 저장
            if (workflow) {
                setTimeout(() => saveStateToStorage(workflow.workflow_id), 100);
            }

        } catch (error) {
            console.error('Word 파싱 중 오류:', error);
            alert('Word 파일을 파싱하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        }
    };

    // 안전한 상태 업데이트를 위한 헬퍼 함수
    const updateStatesSafely = useCallback(async (
        newTestData: TestData[],
        newCompletedCount: number,
        newProgress: number,
        newIsRunning: boolean
    ) => {
        return new Promise<void>((resolve) => {
            // 모든 상태를 동시에 업데이트
            setTestData(newTestData);
            setCompletedCount(newCompletedCount);
            setProgress(newProgress);
            setIsRunning(newIsRunning);

            // React의 상태 배치 업데이트 완료를 기다림
            setTimeout(() => {
                resolve();
            }, 100);
        });
    }, []);

    // 수정된 배치 테스트 실행 함수
    const runBatchTest = async () => {
        if (!workflow || testData.length === 0) {
            alert('워크플로우를 선택하고 테스트 데이터를 업로드해주세요.');
            return;
        }

        console.log('🚀 배치 테스트 시작:', {
            workflow: workflow.workflow_name,
            workflowId: workflow.workflow_id,
            testDataLength: testData.length,
            batchSize: batchSize
        });

        // 실행 시작 - 상태 초기화
        const initializedData = testData.map(item => ({
            ...item,
            status: 'pending' as const,
            actualOutput: null,
            error: null,
            executionTime: undefined
        }));

        // 직접 상태 업데이트 (실행 시작)
        setTestData(initializedData);
        setCompletedCount(0);
        setProgress(0);
        setIsRunning(true);

        console.log('✅ 실행 상태 초기화 완료');

        try {
            // 배치 실행 요청 준비
            const batchRequest = {
                workflowName: workflow.workflow_name.replace('.json', ''),
                workflowId: workflow.workflow_id,
                testCases: testData.map(item => ({
                    id: item.id,
                    input: item.input,
                    expectedOutput: item.expectedOutput || null
                })),
                batchSize: batchSize,
                interactionId: 'batch_test',
                selectedCollections: null
            };

            // 실행 중 상태로 변경
            const runningData = initializedData.map(item => ({ ...item, status: 'running' as const }));
            setTestData(runningData);
            setProgress(10); // 요청 시작 표시

            console.log('서버로 배치 요청 전송 중...', {
                requestDetails: {
                    testCases: batchRequest.testCases.length,
                    batchSize: batchRequest.batchSize,
                    workflowName: batchRequest.workflowName
                }
            });

            // 서버에서 배치 실행
            const batchResult = await executeWorkflowBatch(batchRequest) as BatchExecuteResponse;

            console.log('배치 실행 완료:', {
                batchId: batchResult.batch_id,
                총개수: batchResult.total_count,
                성공: batchResult.success_count,
                실패: batchResult.error_count,
                총실행시간: `${batchResult.total_execution_time}ms`,
                평균실행시간: `${(batchResult.total_execution_time / batchResult.total_count).toFixed(2)}ms`
            });

            // 결과를 testData에 매핑
            const updatedTestData: TestData[] = testData.map(item => {
                const result = batchResult.results.find((r: BatchTestResult) => r.id === item.id);
                if (result) {
                    return {
                        ...item,
                        status: result.status as 'success' | 'error',
                        actualOutput: result.actual_output || '결과 없음',
                        executionTime: result.execution_time || 0,
                        error: result.error || null
                    };
                }
                return {
                    ...item,
                    status: 'error' as const,
                    error: '서버에서 결과를 찾을 수 없습니다.',
                    actualOutput: null,
                    executionTime: 0
                };
            });

            // 직접 상태 업데이트 (한 번에)
            console.log('완료 상태로 업데이트 중...');
            setTestData(updatedTestData);
            setCompletedCount(batchResult.total_count);
            setProgress(100);
            setIsRunning(false);

            console.log('완료 상태 업데이트 완료');

            // 최종 저장 (상태 업데이트 완료 후)
            if (workflow) {
                console.log('최종 상태 저장 중...');
                setTimeout(() => {
                    // 수동으로 정확한 상태 저장
                    const finalState = {
                        testData: updatedTestData.map(item => ({
                            ...item,
                            actualOutput: item.actualOutput ? item.actualOutput.substring(0, 300) : null,
                            error: item.error ? item.error.substring(0, 200) : null
                        })),
                        uploadedFileName: uploadedFile?.name || null,
                        isRunning: false,
                        progress: 100,
                        completedCount: batchResult.total_count,
                        batchSize: batchSize,
                        timestamp: Date.now()
                    };

                    try {
                        localStorage.setItem(`batchTester_${workflow.workflow_id}`, JSON.stringify(finalState));
                        console.log('수동 저장 완료:', {
                            completedCount: batchResult.total_count,
                            isRunning: false,
                            testDataCount: updatedTestData.length
                        });
                    } catch (error) {
                        console.error('❌ 수동 저장 실패:', error);
                    }

                    console.log('최종 상태 저장 완료');
                }, 1000); // 1초 후 확실히 저장
            }

            // 성공/실패 통계 알림
            const message = `배치 테스트 완료!\n\n` +
                           `결과 요약:\n` +
                           `• 총 ${batchResult.total_count}개 테스트\n` +
                           `• 성공: ${batchResult.success_count}개\n` +
                           `• 실패: ${batchResult.error_count}개\n` +
                           `• 총 소요시간: ${(batchResult.total_execution_time / 1000).toFixed(2)}초\n` +
                           `• 평균 실행시간: ${(batchResult.total_execution_time / batchResult.total_count).toFixed(2)}ms`;

            console.log(message);

            const successRate = (batchResult.success_count / batchResult.total_count) * 100;
            if (successRate === 100) {
                alert(message + '\n\n모든 테스트가 성공했습니다!');
            } else if (successRate >= 80) {
                alert(message + '\n\n대부분의 테스트가 성공했습니다.');
            } else if (batchResult.error_count > 0) {
                alert(message + '\n\n일부 테스트가 실패했습니다. 결과를 확인해주세요.');
            }

        } catch (error: unknown) {
            console.error('❌ 배치 테스트 중 오류:', error);

            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';

            // 에러 발생 시 직접 상태 업데이트
            const errorData = testData.map(item => ({
                ...item,
                status: 'error' as const,
                error: errorMessage,
                actualOutput: null,
                executionTime: 0
            }));

            console.log('에러 상태로 업데이트 중...');
            setTestData(errorData);
            setCompletedCount(0);
            setProgress(0);
            setIsRunning(false);

            // 에러 상태 저장
            if (workflow) {
                setTimeout(() => {
                    // 수동으로 정확한 에러 상태 저장
                    const errorState = {
                        testData: errorData.map(item => ({
                            ...item,
                            error: item.error ? item.error.substring(0, 200) : null
                        })),
                        uploadedFileName: uploadedFile?.name || null,
                        isRunning: false,
                        progress: 0,
                        completedCount: 0,
                        batchSize: batchSize,
                        timestamp: Date.now()
                    };

                    try {
                        localStorage.setItem(`batchTester_${workflow.workflow_id}`, JSON.stringify(errorState));
                        console.log('에러 상태 수동 저장 완료');
                    } catch (error) {
                        console.error('❌ 에러 상태 저장 실패:', error);
                    }

                    console.log('에러 상태 저장 완료');
                }, 1000);
            }

            const detailedErrorMessage = `❌ 배치 테스트 실행 중 오류가 발생했습니다.\n\n` +
                                       `🔍 오류 내용:\n${errorMessage}\n\n` +
                                       `💡 해결 방법:\n` +
                                       `• 워크플로우가 올바르게 설정되어 있는지 확인\n` +
                                       `• 네트워크 연결 상태 확인\n` +
                                       `• 서버 로그 확인`;

            alert(detailedErrorMessage);
        }

        console.log('배치 테스트 프로세스 완료');
    };

    const formatExecutionTime = (ms?: number): string => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const downloadResults = () => {
        if (testData.length === 0) return;

        const csvContent = [
            'ID,입력 내용,결과,상태,소요 시간,오류',
            ...testData.map(item => {
                const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
                return [
                    item.id,
                    escapeCsv(item.input),
                    escapeCsv(item.actualOutput || ''),
                    item.status,
                    formatExecutionTime(item.executionTime),
                    escapeCsv(item.error || '')
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `batch_test_results_${workflow?.workflow_name.replace('.json', '') || 'unknown'}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    if (!workflow) {
        return (
            <div className={styles.batchTesterPanel}>
                <div className={styles.placeholder}>
                    <h3>워크플로우를 선택하세요</h3>
                    <p>
                        왼쪽 목록에서 워크플로우를 선택하면 배치 테스트를 시작할 수 있습니다.
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
                <h3>{workflow.workflow_name.replace('.json', '')} - 배치 테스터</h3>
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
                        onClick={runBatchTest}
                        disabled={!testData.length || isRunning}
                        className={`${styles.btn} ${styles.run}`}
                        title="서버에서 모든 테스트를 배치로 처리합니다."
                    >
                        {isRunning ? <FiRefreshCw className={styles.spinning} /> : <FiPlay />}
                        {isRunning ? '서버에서 처리 중...' : '배치 실행 (서버)'}
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
                            onClick={clearTestData}
                            disabled={isRunning}
                            className={styles.clearBtn}
                        >
                            <FiTrash2 />
                            초기화
                        </button>
                    )}
                </div>
            </div>

            {/* File Info */}
            {uploadedFile && (
                <div className={styles.fileInfo}>
                    <FiTable />
                    <span className={styles.fileName}>{uploadedFile.name}</span>
                    <span className={styles.fileType}>
                        {uploadedFile.name.split('.').pop()?.toUpperCase()}
                    </span>
                    <span>{testData.length}개 테스트 케이스</span>
                </div>
            )}

            {/* Progress */}
            {isRunning && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressHeader}>
                        <span>서버에서 배치 처리 중...</span>
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
                    <div className={styles.progressDetails}>
                        <span>배치 크기: {batchSize}개씩 병렬 처리</span>
                        <span>상태가 자동으로 저장됩니다</span>
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
                                    <span className={styles.statLabel}>평균 실행시간:</span>
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
                                    <span className={styles.statLabel}>최고 속도:</span>
                                    <span className={styles.statValue}>
                                        {(() => {
                                            const times = testData.filter(item => item.executionTime && item.executionTime > 0).map(item => item.executionTime || 0);
                                            return times.length > 0 ? formatExecutionTime(Math.min(...times)) : '-';
                                        })()}
                                    </span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>최저 속도:</span>
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
                        <div className={styles.results__header}>
                            <div>ID</div>
                            <div>입력 내용</div>
                            <div>결과</div>
                            <div>상태</div>
                            <div>소요 시간</div>
                        </div>

                        <div className={styles.results__body}>
                            {testData.map((item, index) => (
                                <div key={item.id} className={styles.results__row}>
                                    <div className={styles.results__id}>{item.id}</div>
                                    <div className={styles.results__input} title={item.input}>
                                        {item.input.length > 50 ? `${item.input.substring(0, 50)}...` : item.input}
                                    </div>
                                    <div className={styles.results__actual} title={item.actualOutput || undefined}>
                                        {item.actualOutput ?
                                            (item.actualOutput.length > 50 ? `${item.actualOutput.substring(0, 50)}...` : item.actualOutput)
                                            : (item.status === 'running' ?
                                                <span className={styles.running}>
                                                    <FiRefreshCw className={styles.spinning} />
                                                    실행 중...
                                                </span>
                                                : '-')
                                        }
                                    </div>
                                    <div className={styles.results__status}>
                                        <span className={`${styles.status} ${styles[`status--${item.status}`]}`}>
                                            {item.status === 'success' && <FiCheckCircle />}
                                            {item.status === 'error' && <FiXCircle />}
                                            {item.status === 'running' && <FiRefreshCw className={styles.spinning} />}
                                            {item.status === 'pending' && <FiClock />}
                                            {item.status === 'success' ? '성공' :
                                             item.status === 'error' ? '실패' :
                                             item.status === 'running' ? '실행중' : '대기'}
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
                    <h4>배치 테스트를 시작해보세요</h4>
                    <p>CSV 또는 Excel 파일을 업로드하여 여러 테스트를 한 번에 실행할 수 있습니다.</p>

                    <div className={styles.fileFormatInfo}>
                        <h5>📄 지원 파일 형식</h5>
                        <div className={styles.formatList}>
                            <div className={styles.formatItem}>
                                <strong>첫 번째 열:</strong> 입력 데이터 (필수)
                            </div>
                            <div className={styles.formatItem}>
                                <strong>두 번째 열:</strong> 예상 출력 (선택사항)
                            </div>
                            <div className={styles.formatItem}>
                                <strong>첫 번째 행:</strong> 헤더 (자동 감지)
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

                    <div className={styles.quickStart}>
                        <details className={styles.quickStartDetails}>
                            <summary>💡 빠른 시작 가이드</summary>
                            <ol className={styles.quickStartSteps}>
                                <li>CSV/Excel 파일 준비 (첫 번째 열에 입력 데이터)</li>
                                <li>위의 "파일 업로드" 버튼 클릭</li>
                                <li>배치 크기 설정 (권장: 3-5개)</li>
                                <li>"배치 실행 (서버)" 버튼 클릭</li>
                                <li>결과 확인 및 다운로드</li>
                            </ol>
                        </details>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BatchTester;
