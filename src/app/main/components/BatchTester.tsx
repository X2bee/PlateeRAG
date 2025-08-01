'use client'
import React, { useState, useRef, useEffect } from 'react';
import styles from '@/app/main/assets/BatchTester.module.scss';
import { FiUpload, FiDownload, FiPlay, FiFileText, FiTable, FiCheckCircle, FiXCircle, FiClock, FiRefreshCw, FiTrash2 } from 'react-icons/fi';

import { executeWorkflowById } from '@/app/api/workflowAPI'; // 실제 API 함수 import


// XLSX 라이브러리 동적 로드
declare global {
    interface Window {
        XLSX: any;
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
    actualOutput?: string;
    status?: 'pending' | 'running' | 'success' | 'error';
    executionTime?: number;
    error?: string;
}

const BatchTester: React.FC<BatchTesterProps> = ({ workflow }) => {
    const [testData, setTestData] = useState<TestData[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isXLSXLoaded, setIsXLSXLoaded] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [batchSize, setBatchSize] = useState(5); // 동시 실행 개수
    const [completedCount, setCompletedCount] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // XLSX 라이브러리 로드 함수
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

    useEffect(() => {
        loadXLSX();
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

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
        } else {
            alert('지원되지 않는 파일 형식입니다. CSV 또는 Excel 파일만 업로드해주세요.');
        }
    };

    const parseCSVContent = (content: string) => {
        try {
            let parsedData: TestData[] = [];
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

    const parseExcelContent = (data: ArrayBuffer) => {
        if (!window.XLSX) {
            alert('Excel 파일 처리 라이브러리가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }
        
        try {
            let parsedData: TestData[] = [];
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
        } catch (error) {
            console.error('Excel 파싱 중 오류:', error);
            alert('Excel 파일을 파싱하는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        }
    };

    // 개별 테스트 실행 함수
    const runSingleTest = async (testItem: TestData, index: number): Promise<void> => {
        // 실행 중 상태로 업데이트
        setTestData(prev => prev.map((item, i) => 
            i === index ? { ...item, status: 'running' as const } : item
        ));

        const startTime = Date.now();

        try {
            const workflowName = workflow!.workflow_name.replace('.json', '');
            
            console.log(`Test ${testItem.id} 실행:`, {
                workflowName,
                workflowId: workflow!.workflow_id,
                input: testItem.input,
                inputLength: testItem.input.length
            });
            
            // 실제 API 호출
            const result: any = await executeWorkflowById(
                workflowName,
                workflow!.workflow_id,
                testItem.input,
                'default',
                null
            );
            
            const executionTime = Date.now() - startTime;
            
            console.log(`Test ${testItem.id} 성공:`, {
                result,
                executionTime: `${executionTime}ms`
            });
            
            let actualOutput: string;
            if (result.outputs) {
                if (Array.isArray(result.outputs)) {
                    actualOutput = result.outputs.length > 0 ? String(result.outputs[0]) : '결과 없음';
                } else {
                    actualOutput = String(result.outputs);
                }
            } else if (result.message) {
                actualOutput = result.message;
            } else {
                actualOutput = '결과 없음';
            }
            
            // 성공 상태로 업데이트
            setTestData(prev => prev.map((item, i) => 
                i === index ? { 
                    ...item, 
                    status: 'success' as const,
                    actualOutput: actualOutput,
                    executionTime
                } : item
            ));
            
        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            console.error(`Test ${testItem.id} 실패:`, {
                error,
                errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
                input: testItem.input
            });
            
            // 실패 상태로 업데이트
            setTestData(prev => prev.map((item, i) => 
                i === index ? { 
                    ...item, 
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : '알 수 없는 오류',
                    executionTime
                } : item
            ));
        }

        // 완료된 개수 업데이트
        setCompletedCount(prev => {
            const newCount = prev + 1;
            setProgress((newCount / testData.length) * 100);
            return newCount;
        });
    };

    // 배치 병렬 실행 함수
    const runBatchTest = async () => {
        if (!workflow || testData.length === 0) {
            alert('워크플로우를 선택하고 테스트 데이터를 업로드해주세요.');
            return;
        }

        setIsRunning(true);
        setProgress(0);
        setCompletedCount(0);

        console.log('배치 테스트 시작:', {
            workflow: workflow.workflow_name,
            workflowId: workflow.workflow_id,
            testDataLength: testData.length,
            batchSize: batchSize
        });

        // 모든 테스트를 pending 상태로 초기화
        setTestData(prev => prev.map(item => ({ ...item, status: 'pending' as const })));

        try {
            // 배치 단위로 병렬 실행
            for (let i = 0; i < testData.length; i += batchSize) {
                const batch = testData.slice(i, i + batchSize);
                const batchPromises = batch.map((testItem, batchIndex) => 
                    runSingleTest(testItem, i + batchIndex)
                );
                
                console.log(`배치 ${Math.floor(i / batchSize) + 1} 시작: ${batch.length}개 테스트 병렬 실행`);
                
                // 현재 배치의 모든 테스트가 완료될 때까지 대기
                await Promise.all(batchPromises);
                
                console.log(`배치 ${Math.floor(i / batchSize) + 1} 완료`);
                
                // 다음 배치 실행 전 잠시 대기 (API 부하 방지)
                if (i + batchSize < testData.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } catch (error) {
            console.error('배치 테스트 중 오류:', error);
        }

        setIsRunning(false);
        console.log('배치 테스트 완료');
    };

    const formatExecutionTime = (ms?: number): string => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const downloadResults = () => {
        if (testData.length === 0) return;

        const csvContent = [
            'ID,입력 내용,예상 결과,실제 결과,상태,소요 시간,오류',
            ...testData.map(item => {
                const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
                return [
                    item.id,
                    escapeCsv(item.input),
                    escapeCsv(item.expectedOutput || ''),
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

    const clearTestData = () => {
        setTestData([]);
        setUploadedFile(null);
        setProgress(0);
        setCompletedCount(0);
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
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
            />

            {/* Header */}
            <div className={styles.batchTesterHeader}>
                <h3>{workflow.workflow_name.replace('.json', '')} - 배치 테스터</h3>
                <div className={styles.headerActions}>
                    {/* 배치 크기 설정 */}
                    <div className={styles.batchSizeSelector}>
                        <label>동시 실행:</label>
                        <select 
                            value={batchSize} 
                            onChange={(e) => setBatchSize(Number(e.target.value))}
                            disabled={isRunning}
                        >
                            <option value={1}>1개</option>
                            <option value={3}>3개</option>
                            <option value={5}>5개</option>
                            <option value={10}>10개</option>
                            <option value={20}>20개</option>
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
                    >
                        {isRunning ? <FiRefreshCw className={styles.spinning} /> : <FiPlay />}
                        {isRunning ? '실행 중...' : '배치 실행'}
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
                        <span>테스트 진행률: {Math.round(progress)}%</span>
                        <span>{completedCount} / {testData.length} 완료</span>
                    </div>
                    <div className={styles.progress}>
                        <div 
                            className={styles.progress__fill}
                            style={{ '--progress': `${progress}%` } as React.CSSProperties}
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
                            <span className={styles.total}>총 {testData.length}개</span>
                            <span className={styles.success}>
                                성공 {testData.filter(item => item.status === 'success').length}개
                            </span>
                            <span className={styles.error}>
                                실패 {testData.filter(item => item.status === 'error').length}개
                            </span>
                            <span className={styles.pending}>
                                대기 {testData.filter(item => item.status === 'pending').length}개
                            </span>
                        </div>
                    </div>
                    
                    <div className={styles.resultsTable}>
                        <div className={styles.results__header}>
                            <div>ID</div>
                            <div>입력 내용</div>
                            <div>예상 결과</div>
                            <div>실제 결과</div>
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
                                    <div className={styles.results__expected} title={item.expectedOutput}>
                                        {item.expectedOutput ? 
                                            (item.expectedOutput.length > 30 ? `${item.expectedOutput.substring(0, 30)}...` : item.expectedOutput)
                                            : '-'
                                        }
                                    </div>
                                    <div className={styles.results__actual} title={item.actualOutput}>
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
                    <h4>테스트 데이터를 업로드해주세요</h4>
                    <p>CSV 또는 Excel 파일을 업로드하여 배치 테스트를 시작하세요.</p>
                    <div className={styles.fileFormatInfo}>
                        <h5>파일 형식 안내</h5>
                        <ul>
                            <li><strong>첫 번째 열:</strong> 입력 데이터 (필수)</li>
                            <li><strong>두 번째 열:</strong> 예상 출력 (선택사항)</li>
                            <li><strong>첫 번째 행:</strong> 헤더 (선택사항)</li>
                        </ul>
                        <div className={styles.supportedFormats}>
                            <span>지원 형식:</span>
                            <span>.csv</span>
                            <span>.xlsx</span>
                            <span>.xls</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className={`${styles.btn} ${styles.upload}`}
                    >
                        <FiUpload />
                        파일 선택하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default BatchTester;