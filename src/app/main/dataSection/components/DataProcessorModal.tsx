'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { IoClose, IoArrowBack } from 'react-icons/io5';
import styles from '@/app/main/dataSection/assets/DataProcessorModal.module.scss';

interface DataTableRow {
    [key: string]: any;
}

interface DownloadDialogState {
    isOpen: boolean;
    repoId: string;
    filename: string;
    split: string;
}

interface ColumnInfoModalProps {
    isOpen: boolean;
    columnInfo: string | object | null;
    onClose: () => void;
}

interface DownloadDialogProps {
    dialogState: DownloadDialogState;
    downloading: boolean;
    onClose: () => void;
    onDownload: () => void;
    onUpdateDialog: (updates: Partial<DownloadDialogState>) => void;
}

interface StatisticsModalProps {
    isOpen: boolean;
    statistics: any;
    loading: boolean;
    onClose: () => void;
}

interface ColumnDeleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteMultipleColumns: (columnNames: string[]) => void;
    availableColumns: string[];
}

interface ColumnValueReplaceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReplaceValues: (columnName: string, oldValue: string, newValue: string) => void;
    availableColumns: string[];
}

interface ColumnOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyOperation: (columnName: string, operation: string) => void;
    availableColumns: string[];
}

interface SpecificColumnNullRemoveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRemoveNullRows: (columnName: string) => void;
    availableColumns: string[];
}

// 컬럼 정보 포매팅 함수
const formatColumnInfo = (columnInfo: string | object): React.ReactNode => {
    if (typeof columnInfo === 'string') {
        return columnInfo;
    }

    if (typeof columnInfo === 'object' && columnInfo !== null) {
        try {
            const columnData = columnInfo as Record<string, any>;
            return (
                <div className={styles.columnInfoGrid}>
                    {Object.entries(columnData).map(([key, value]) => (
                        <div key={key} className={styles.columnInfoItem}>
                            <span className={styles.columnName}>{key}:</span>
                            <span className={styles.columnType}>
                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                        </div>
                    ))}
                </div>
            );
        } catch (error) {
            return JSON.stringify(columnInfo, null, 2);
        }
    }

    return 'N/A';
};

// 컬럼 정보 모달 컴포넌트
export const ColumnInfoModal: React.FC<ColumnInfoModalProps> = ({
    isOpen,
    columnInfo,
    onClose
}) => {
    if (!isOpen || !columnInfo) return null;

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog} style={{ maxWidth: '800px', maxHeight: '80vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>컬럼 정보</h3>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <IoClose size={20} />
                    </button>
                </div>
                <div style={{ overflow: 'auto', maxHeight: 'calc(80vh - 120px)' }}>
                    {formatColumnInfo(columnInfo)}
                </div>
                <div className={styles.dialogActions}>
                    <button
                        onClick={onClose}
                        className={styles.confirmButton}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 다운로드 다이얼로그 컴포넌트
export const DownloadDialog: React.FC<DownloadDialogProps> = ({
    dialogState,
    downloading,
    onClose,
    onDownload,
    onUpdateDialog
}) => {
    if (!dialogState.isOpen) return null;

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog}>
                <h3>Huggingface 데이터셋 다운로드</h3>
                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>Repository ID *</label>
                        <input
                            type="text"
                            value={dialogState.repoId}
                            onChange={(e) => onUpdateDialog({ repoId: e.target.value })}
                            placeholder="예: squad, glue"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>파일명 (선택사항)</label>
                        <input
                            type="text"
                            value={dialogState.filename}
                            onChange={(e) => onUpdateDialog({ filename: e.target.value })}
                            placeholder="특정 파일명"
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label>데이터 분할 (선택사항)</label>
                        <input
                            type="text"
                            value={dialogState.split}
                            onChange={(e) => onUpdateDialog({ split: e.target.value })}
                            placeholder="예: train, test, validation"
                        />
                    </div>
                </div>
                <div className={styles.dialogActions}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                        disabled={downloading}
                    >
                        취소
                    </button>
                    <button
                        onClick={onDownload}
                        className={styles.confirmButton}
                        disabled={downloading || !dialogState.repoId.trim()}
                    >
                        {downloading ? '다운로드 중...' : '다운로드'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 통계 정보 모달 컴포넌트
export const StatisticsModal: React.FC<StatisticsModalProps> = ({
    isOpen,
    statistics,
    loading,
    onClose
}) => {
    if (!isOpen) return null;

    const [showUniqueDetail, setShowUniqueDetail] = useState<string | null>(null);

    const formatNumber = (num: number): string => {
        if (typeof num !== 'number' || isNaN(num)) return 'N/A';
        return num.toLocaleString();
    };

    const formatPercentage = (num: number): string => {
        if (typeof num !== 'number' || isNaN(num)) return 'N/A';
        return `${num.toFixed(2)}%`;
    };

    const handleShowUniqueDetail = (columnName: string) => {
        setShowUniqueDetail(columnName);
    };

    const handleBackToMain = () => {
        setShowUniqueDetail(null);
    };

    const handleClose = () => {
        setShowUniqueDetail(null);
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={`${styles.dialog} ${styles.statisticsModal}`}>
                <div className={styles.statisticsHeader}>
                    <h3>데이터셋 기술통계정보</h3>
                    <button
                        onClick={handleClose}
                        className={styles.statisticsCloseButton}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.statisticsContent}>
                    {loading ? (
                        <div className={styles.statisticsLoading}>
                            <p>통계 정보를 생성하는 중...</p>
                        </div>
                    ) : statistics && statistics.statistics && statistics.statistics.statistics ? (
                        showUniqueDetail ? (
                            // 고유값 상세 화면
                            <div className={styles.uniqueValuesDetail}>
                                <div className={styles.uniqueValuesHeader}>
                                    <h4 className={styles.sectionTitle}>
                                        "{showUniqueDetail}" 컬럼의 고유값 분포
                                    </h4>
                                    <button
                                        onClick={handleBackToMain}
                                        className={styles.backButton}
                                    >
                                        <IoArrowBack size={16} />
                                        돌아가기
                                    </button>

                                </div>
                                <div className={styles.uniqueValuesGrid}>
                                    {statistics.statistics.statistics.column_statistics[showUniqueDetail]?.unique_dict &&
                                        Object.entries(statistics.statistics.statistics.column_statistics[showUniqueDetail].unique_dict)
                                            .sort(([, a], [, b]) => (b as number) - (a as number)) // 개수 기준 내림차순 정렬
                                            .map(([key, count]) => (
                                                <div key={key} className={styles.uniqueValueItem}>
                                                    <div className={styles.uniqueValueKey}>
                                                        {String(key)}
                                                    </div>
                                                    <div className={styles.uniqueValueCount}>
                                                        {formatNumber(count as number)}개
                                                    </div>
                                                </div>
                                            ))}
                                </div>
                            </div>
                        ) : (
                            // 메인 통계 화면
                            <div>
                                {/* 데이터셋 기본 정보 */}
                                <div className={styles.datasetOverview}>
                                    <h4 className={styles.sectionTitle}>
                                        데이터셋 개요
                                    </h4>
                                    <div className={styles.overviewGrid}>
                                        <div className={styles.overviewCard}>
                                            <div className={styles.overviewCardTitle}>총 행 수</div>
                                            <div className={styles.overviewCardValue}>
                                                {formatNumber(statistics.statistics.statistics.dataset_info?.total_rows)}
                                            </div>
                                        </div>
                                        <div className={styles.overviewCard}>
                                            <div className={styles.overviewCardTitle}>총 열 수</div>
                                            <div className={styles.overviewCardValue}>
                                                {formatNumber(statistics.statistics.statistics.dataset_info?.total_columns)}
                                            </div>
                                        </div>
                                        <div className={styles.overviewCard}>
                                            <div className={styles.overviewCardTitle}>생성 시간</div>
                                            <div className={styles.overviewCardValue}>
                                                {statistics.statistics.generated_at ? new Date(statistics.statistics.generated_at).toLocaleString('ko-KR') : 'N/A'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 컬럼별 통계 */}
                                <div>
                                    <h4 className={styles.sectionTitle}>
                                        컬럼별 통계정보
                                    </h4>
                                    <div className={styles.tableContainer}>
                                        <table className={styles.statisticsTable}>
                                            <thead>
                                                <tr>
                                                    <th>컬럼명</th>
                                                    <th>데이터 타입</th>
                                                    <th className={styles.textRight}>NULL 개수</th>
                                                    <th className={styles.textRight}>NULL 비율</th>
                                                    <th className={styles.textRight}>고유값 개수</th>
                                                    <th className={styles.textRight}>최솟값</th>
                                                    <th className={styles.textRight}>최댓값</th>
                                                    <th className={styles.textRight}>평균</th>
                                                    <th className={styles.textRight}>Q1</th>
                                                    <th className={styles.textRight}>Q3</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {statistics.statistics.statistics.column_statistics && Object.entries(statistics.statistics.statistics.column_statistics).map(([colName, colStats]: [string, any], index) => (
                                                    <tr key={colName}>
                                                        <td className={styles.columnName}>
                                                            {colName}
                                                        </td>
                                                        <td>
                                                            {colStats.data_type || 'N/A'}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {formatNumber(colStats.null_count)}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {formatPercentage(colStats.null_percentage)}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {colStats.unique_count === "계산불가" ? "계산불가" : formatNumber(colStats.unique_count)}
                                                            {colStats.unique_count <= 30 && colStats.unique_dict && (
                                                                <button
                                                                    onClick={() => handleShowUniqueDetail(colName)}
                                                                    className={styles.detailButton}
                                                                >
                                                                    Detail
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {colStats.min !== undefined ? (typeof colStats.min === 'number' ? formatNumber(colStats.min) : String(colStats.min)) : '-'}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {colStats.max !== undefined ? (typeof colStats.max === 'number' ? formatNumber(colStats.max) : String(colStats.max)) : '-'}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {colStats.mean !== undefined ? (typeof colStats.mean === 'number' ? colStats.mean.toFixed(4) : String(colStats.mean)) : '-'}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {colStats.q1 !== undefined ? (colStats.q1 === "계산불가" ? "계산불가" : (typeof colStats.q1 === 'number' ? formatNumber(colStats.q1) : String(colStats.q1))) : '-'}
                                                        </td>
                                                        <td className={styles.textRight}>
                                                            {colStats.q3 !== undefined ? (colStats.q3 === "계산불가" ? "계산불가" : (typeof colStats.q3 === 'number' ? formatNumber(colStats.q3) : String(colStats.q3))) : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className={styles.statisticsError}>
                            <p>
                                {statistics?.message || '통계 정보를 불러올 수 없습니다.'}
                            </p>
                        </div>
                    )}
                </div>

                <div className={styles.dialogActions}>
                    <button
                        onClick={handleClose}
                        className={styles.confirmButton}
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 컬럼 삭제 모달 컴포넌트
export const ColumnDeleteModal: React.FC<ColumnDeleteModalProps> = ({
    isOpen,
    onClose,
    onDeleteMultipleColumns,
    availableColumns
}) => {
    const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

    if (!isOpen) return null;

    const handleMultipleDelete = () => {
        if (selectedColumns.length === 0) {
            return;
        }
        onDeleteMultipleColumns(selectedColumns);
        setSelectedColumns([]);
        onClose();
    };

    const toggleColumnSelection = (columnName: string) => {
        setSelectedColumns(prev =>
            prev.includes(columnName)
                ? prev.filter(col => col !== columnName)
                : [...prev, columnName]
        );
    };

    const selectAllColumns = () => {
        if (selectedColumns.length === availableColumns.length) {
            setSelectedColumns([]);
        } else {
            setSelectedColumns([...availableColumns]);
        }
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog} style={{ maxWidth: '600px', maxHeight: '80vh' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>컬럼 삭제</h3>
                    <button
                        onClick={onClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <p>삭제할 컬럼을 선택해주세요:</p>
                        <button
                            onClick={selectAllColumns}
                            className={styles.cancelButton}
                            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                        >
                            {selectedColumns.length === availableColumns.length ? '모두 해제' : '모두 선택'}
                        </button>
                    </div>

                    <div className={styles.columnDeleteGrid}>
                        {availableColumns.map((columnName) => (
                            <div key={columnName} className={styles.columnDeleteItem}>
                                <label className={styles.columnDeleteLabel}>
                                    <input
                                        type="checkbox"
                                        checked={selectedColumns.includes(columnName)}
                                        onChange={() => toggleColumnSelection(columnName)}
                                        className={styles.columnDeleteCheckbox}
                                    />
                                    <span className={styles.columnDeleteName}>{columnName}</span>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.dialogActions}>
                    <button
                        onClick={onClose}
                        className={styles.cancelButton}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleMultipleDelete}
                        className={styles.confirmButton}
                        disabled={selectedColumns.length === 0}
                        style={{
                            backgroundColor: selectedColumns.length === 0 ? '#9ca3af' : '#dc2626',
                            borderColor: selectedColumns.length === 0 ? '#9ca3af' : '#b91c1c'
                        }}
                    >
                        선택된 {selectedColumns.length}개 컬럼 삭제
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 컬럼 값 교체 모달 컴포넌트
export const ColumnValueReplaceModal: React.FC<ColumnValueReplaceModalProps> = ({
    isOpen,
    onClose,
    onReplaceValues,
    availableColumns
}) => {
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [oldValue, setOldValue] = useState<string>('');
    const [newValue, setNewValue] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedColumn.trim()) {
            alert('컬럼을 선택해주세요.');
            return;
        }
        if (oldValue.trim() === '') {
            alert('기존 값을 입력해주세요.');
            return;
        }
        if (newValue.trim() === '') {
            alert('새로운 값을 입력해주세요.');
            return;
        }

        onReplaceValues(selectedColumn, oldValue, newValue);

        // 폼 초기화
        setSelectedColumn('');
        setOldValue('');
        setNewValue('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSelectedColumn('');
        setOldValue('');
        setNewValue('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog} style={{ maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>컬럼 값 교체</h3>
                    <button
                        onClick={handleClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>대상 컬럼 *</label>
                        <select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="">컬럼을 선택하세요</option>
                            {availableColumns.map((column) => (
                                <option key={column} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>기존 값 *</label>
                        <input
                            type="text"
                            value={oldValue}
                            onChange={(e) => setOldValue(e.target.value)}
                            placeholder="교체할 기존 값을 입력하세요"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>새로운 값 *</label>
                        <input
                            type="text"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="새로운 값을 입력하세요"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem'
                            }}
                        />
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
                        className={styles.confirmButton}
                        disabled={!selectedColumn.trim() || oldValue.trim() === '' || newValue.trim() === ''}
                        style={{
                            backgroundColor: (!selectedColumn.trim() || oldValue.trim() === '' || newValue.trim() === '') ? '#9ca3af' : undefined
                        }}
                    >
                        값 교체
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 컬럼 연산 적용 모달 컴포넌트
export const ColumnOperationModal: React.FC<ColumnOperationModalProps> = ({
    isOpen,
    onClose,
    onApplyOperation,
    availableColumns
}) => {
    const [selectedColumn, setSelectedColumn] = useState<string>('');
    const [operation, setOperation] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedColumn.trim()) {
            alert('컬럼을 선택해주세요.');
            return;
        }
        if (!operation.trim()) {
            alert('연산식을 입력해주세요.');
            return;
        }

        // 연산식 유효성 간단 검사
        const operationPattern = /^[+\-*/\d.]+$/;
        if (!operationPattern.test(operation.trim())) {
            alert('유효하지 않은 연산식입니다. +, -, *, /, 숫자, 소수점만 사용 가능합니다.');
            return;
        }

        onApplyOperation(selectedColumn, operation);

        // 폼 초기화
        setSelectedColumn('');
        setOperation('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSelectedColumn('');
        setOperation('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog} style={{ maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>컬럼 연산 적용</h3>
                    <button
                        onClick={handleClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>대상 컬럼 *</label>
                        <select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="">컬럼을 선택하세요</option>
                            {availableColumns.map((column) => (
                                <option key={column} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label>연산식 *</label>
                        <input
                            type="text"
                            value={operation}
                            onChange={(e) => setOperation(e.target.value)}
                            placeholder="예: +5, -3, *2, /4, *2+1"
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem'
                            }}
                        />
                        <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            사용 가능한 연산자: +, -, *, /, 숫자, 소수점 (예: +5, *2.5, /3+1)
                        </small>
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
                        className={styles.confirmButton}
                        disabled={!selectedColumn.trim() || !operation.trim()}
                        style={{
                            backgroundColor: (!selectedColumn.trim() || !operation.trim()) ? '#9ca3af' : undefined
                        }}
                    >
                        연산 적용
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// 특정 컬럼 NULL 제거 모달 컴포넌트
export const SpecificColumnNullRemoveModal: React.FC<SpecificColumnNullRemoveModalProps> = ({
    isOpen,
    onClose,
    onRemoveNullRows,
    availableColumns
}) => {
    const [selectedColumn, setSelectedColumn] = useState<string>('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!selectedColumn.trim()) {
            alert('컬럼을 선택해주세요.');
            return;
        }

        onRemoveNullRows(selectedColumn);

        // 폼 초기화
        setSelectedColumn('');
        onClose();
    };

    const handleClose = () => {
        // 폼 초기화
        setSelectedColumn('');
        onClose();
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog} style={{ maxWidth: '500px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>특정 컬럼 결측치 제거</h3>
                    <button
                        onClick={handleClose}
                        style={{
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            borderRadius: '0.25rem',
                            transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <IoClose size={20} />
                    </button>
                </div>

                <div className={styles.dialogForm}>
                    <div className={styles.formGroup}>
                        <label>대상 컬럼 *</label>
                        <select
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '0.25rem',
                                fontSize: '0.875rem'
                            }}
                        >
                            <option value="">컬럼을 선택하세요</option>
                            {availableColumns.map((column) => (
                                <option key={column} value={column}>
                                    {column}
                                </option>
                            ))}
                        </select>
                        <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                            선택한 컬럼에 NULL 값이 있는 모든 행이 제거됩니다.
                        </small>
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
                        className={styles.confirmButton}
                        disabled={!selectedColumn.trim()}
                        style={{
                            backgroundColor: !selectedColumn.trim() ? '#9ca3af' : '#dc2626',
                            borderColor: !selectedColumn.trim() ? '#9ca3af' : '#b91c1c'
                        }}
                    >
                        결측치 제거
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
