'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose, IoPlay, IoInformationCircle } from 'react-icons/io5';
import styles from './assets/DatasetCallbackModal.module.scss';

interface DatasetCallbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExecuteCallback: (callbackCode: string) => void;
    sampleData?: any[];
    columns?: string[];
}

// PyArrow 콜백 코드 실행 모달 컴포넌트
export const DatasetCallbackModal: React.FC<DatasetCallbackModalProps> = ({
    isOpen,
    onClose,
    onExecuteCallback,
    sampleData = [],
    columns = []
}) => {
    const [callbackCode, setCallbackCode] = useState<string>('');
    const [showHelp, setShowHelp] = useState<boolean>(false);

    if (!isOpen) return null;

    // 행 번호 계산
    const getLineNumbers = () => {
        const lines = callbackCode.split('\n').length;
        return Array.from({ length: Math.max(lines, 12) }, (_, i) => i + 1);
    };

    const handleSubmit = () => {
        if (!callbackCode.trim()) {
            alert('실행할 PyArrow 코드를 입력해주세요.');
            return;
        }

        onExecuteCallback(callbackCode.trim());

        // 폼 초기화
        setCallbackCode('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setCallbackCode('');
        setShowHelp(false);
        onClose();
    };

    const insertExample = (exampleCode: string) => {
        setCallbackCode(exampleCode);
        setShowHelp(false);
    };

    // Tab 키 처리 함수
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.currentTarget;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;

            if (e.shiftKey) {
                // Shift+Tab: 역들여쓰기 (4개 공백 제거)
                const lines = callbackCode.split('\n');
                const startLine = callbackCode.substring(0, start).split('\n').length - 1;
                const endLine = callbackCode.substring(0, end).split('\n').length - 1;

                let newValue = '';
                let adjustedStart = start;
                let adjustedEnd = end;

                for (let i = 0; i < lines.length; i++) {
                    if (i >= startLine && i <= endLine) {
                        // 현재 줄에서 앞의 공백 4개 제거
                        const originalLine = lines[i];
                        const newLine = originalLine.replace(/^ {4}/, '');
                        const removed = originalLine.length - newLine.length;

                        if (i === startLine) {
                            adjustedStart = Math.max(0, adjustedStart - removed);
                        }
                        if (i <= endLine) {
                            adjustedEnd = Math.max(0, adjustedEnd - removed);
                        }

                        lines[i] = newLine;
                    }
                }

                newValue = lines.join('\n');
                setCallbackCode(newValue);

                // 커서 위치 조정
                setTimeout(() => {
                    textarea.selectionStart = adjustedStart;
                    textarea.selectionEnd = adjustedEnd;
                }, 0);
            } else {
                // Tab: 들여쓰기 (4개 공백 추가)
                const newValue = callbackCode.substring(0, start) + '    ' + callbackCode.substring(end);
                setCallbackCode(newValue);

                // 커서 위치 조정
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 4;
                }, 0);
            }
        }
    };    const examples = [
        {
            title: '컬럼 필터링',
            code: `# 특정 컬럼만 선택
result = table.select(['column1', 'column2', 'column3'])`,
            description: '원하는 컬럼들만 선택하여 새로운 테이블 생성'
        },
        {
            title: '행 필터링',
            code: `# 조건에 맞는 행만 필터링
result = table.filter(pc.greater(table['age'], 18))`,
            description: 'age 컬럼이 18보다 큰 행만 필터링'
        },
        {
            title: '새로운 컬럼 추가',
            code: `# 새로운 컬럼 추가 (기존 컬럼 연산)
new_col = pc.add(table['col1'], table['col2'])
result = table.append_column('sum_col', new_col)`,
            description: '두 컬럼의 합으로 새로운 컬럼 생성'
        },
        {
            title: '문자열 조작',
            code: `# 문자열 컬럼 조작
upper_col = pc.upper(table['name'])
result = table.set_column(table.column_names.index('name'), 'name', upper_col)`,
            description: 'name 컬럼의 모든 값을 대문자로 변경'
        },
        {
            title: '정렬',
            code: `# 컬럼 기준으로 정렬
result = table.sort_by([('age', 'descending'), ('name', 'ascending')])`,
            description: 'age는 내림차순, name은 오름차순으로 정렬'
        },
        {
            title: '중복 제거',
            code: `# 중복 행 제거
result = table.drop_duplicates()`,
            description: '중복된 행들을 제거'
        }
    ];

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <div className={styles.header}>
                    <h3>PyArrow 콜백 코드 실행</h3>
                    <div className={styles.headerActions}>
                        <button
                            onClick={() => setShowHelp(!showHelp)}
                            className={styles.helpButton}
                            title="도움말 보기"
                        >
                            <IoInformationCircle size={20} />
                        </button>
                        <button
                            onClick={handleClose}
                            className={styles.closeButton}
                        >
                            <IoClose size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.dialogForm}>
                    {showHelp && (
                        <div className={styles.helpSection}>
                            <h4>사용 가능한 기능</h4>
                            <ul className={styles.helpList}>
                                <li><strong>table</strong>: 현재 데이터셋 테이블</li>
                                <li><strong>result</strong>: 결과로 반환할 테이블 (필수)</li>
                                <li><strong>pa, pc, pq, sys</strong>: 자동으로 import됨</li>
                                <li>안전한 PyArrow 함수들만 허용됩니다</li>
                                <li>30초 실행 시간 제한</li>
                            </ul>

                            <h4>예제 코드</h4>
                            <div className={styles.examplesGrid}>
                                {examples.map((example, index) => (
                                    <div key={index} className={styles.exampleCard}>
                                        <div className={styles.exampleHeader}>
                                            <h5>{example.title}</h5>
                                            <button
                                                onClick={() => insertExample(example.code)}
                                                className={styles.useExampleBtn}
                                            >
                                                사용
                                            </button>
                                        </div>
                                        <pre className={styles.exampleCode}>{example.code}</pre>
                                        <p className={styles.exampleDesc}>{example.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={styles.formGroup}>
                        <label>현재 데이터 샘플 (3행)</label>
                        {sampleData && sampleData.length > 0 ? (
                            <div className={styles.sampleTableContainer}>
                                <table className={styles.sampleTable}>
                                    <thead>
                                        <tr>
                                            {columns.map((column, index) => (
                                                <th key={index}>{column}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sampleData.map((row, rowIndex) => (
                                            <tr key={rowIndex}>
                                                {columns.map((column, colIndex) => (
                                                    <td key={colIndex}>
                                                        {String(row[column] || '')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.noDataMessage}>
                                <p>샘플 데이터가 없습니다.</p>
                            </div>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label>PyArrow 코드 *</label>
                        <div className={styles.preImportsInfo}>
                            <small className={styles.preImportsText}>
                                <strong># import:</strong><br/>
                                <code>import pyarrow.parquet as pq</code><br/>
                                <code>import pyarrow as pa</code><br/>
                                <code>import pyarrow.compute as pc</code><br/>
                                <code>import sys</code>
                            </small>
                        </div>
                        <div className={styles.codeEditorContainer}>
                            <div className={styles.lineNumbers}>
                                {getLineNumbers().map(num => (
                                    <div key={num} className={styles.lineNumber}>
                                        {num}
                                    </div>
                                ))}
                            </div>
                            <textarea
                                value={callbackCode}
                                onChange={(e) => setCallbackCode(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={`# 기본 import문은 자동으로 실행됩니다
# 바로 PyArrow 코드를 작성하세요

# 예시:
result = table.filter(pc.greater(table['age'], 18))`}
                                className={styles.codeTextarea}
                                rows={12}
                                spellCheck={false}
                                autoComplete="off"
                            />
                        </div>
                        <div className={styles.codeFooter}>
                            <small className={styles.formHint}>
                                • <code>table</code>: 현재 데이터셋<br/>
                                • <code>result</code>: 반환할 테이블 (필수)<br/>
                                • <code>pa, pc, pq, sys</code>: 자동 import됨<br/>
                                • 안전한 PyArrow 함수만 사용 가능<br/>
                                • 30초 실행 시간 제한
                            </small>
                        </div>
                    </div>

                    <div className={styles.warningBox}>
                        <IoInformationCircle className={styles.warningIcon} />
                        <div className={styles.warningContent}>
                            <strong>주의사항</strong>
                            <p>코드는 격리된 환경에서 실행되며, 허용되지 않은 함수나 모듈 사용 시 오류가 발생합니다.</p>
                        </div>
                    </div>
                </div>

                <div className={styles.dialogActions}>
                    <button
                        onClick={handleClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className={styles.executeButton}
                        disabled={!callbackCode.trim()}
                    >
                        <IoPlay size={16} />
                        실행
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
