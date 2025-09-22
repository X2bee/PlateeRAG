'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { IoClose } from 'react-icons/io5';
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

    const formatNumber = (num: number): string => {
        if (typeof num !== 'number' || isNaN(num)) return 'N/A';
        return num.toLocaleString();
    };

    const formatPercentage = (num: number): string => {
        if (typeof num !== 'number' || isNaN(num)) return 'N/A';
        return `${num.toFixed(2)}%`;
    };

    return createPortal(
        <div className={styles.dialogOverlay}>
            <div className={styles.dialog} style={{ maxWidth: '1000px', maxHeight: '90vh', width: '90vw' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3>데이터셋 기술통계정보</h3>
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

                <div style={{ overflow: 'auto', maxHeight: 'calc(90vh - 120px)' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p>통계 정보를 생성하는 중...</p>
                        </div>
                    ) : statistics && statistics.statistics && statistics.statistics.statistics ? (
                        <div>
                            {/* 데이터셋 기본 정보 */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                    데이터셋 개요
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                    <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>총 행 수</div>
                                        <div style={{ fontSize: '1.5rem', color: '#1f2937' }}>
                                            {formatNumber(statistics.statistics.statistics.dataset_info?.total_rows)}
                                        </div>
                                    </div>
                                    <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>총 열 수</div>
                                        <div style={{ fontSize: '1.5rem', color: '#1f2937' }}>
                                            {formatNumber(statistics.statistics.statistics.dataset_info?.total_columns)}
                                        </div>
                                    </div>
                                    <div style={{ background: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
                                        <div style={{ fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>생성 시간</div>
                                        <div style={{ fontSize: '0.9rem', color: '#1f2937' }}>
                                            {statistics.statistics.generated_at ? new Date(statistics.statistics.generated_at).toLocaleString('ko-KR') : 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 컬럼별 통계 */}
                            <div>
                                <h4 style={{ marginBottom: '1rem', color: '#374151', borderBottom: '2px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                                    컬럼별 통계정보
                                </h4>
                                <div style={{ overflow: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                        <thead>
                                            <tr style={{ background: '#f3f4f6' }}>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    컬럼명
                                                </th>
                                                <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    데이터 타입
                                                </th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    NULL 개수
                                                </th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    NULL 비율
                                                </th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    고유값 개수
                                                </th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    최솟값
                                                </th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    최댓값
                                                </th>
                                                <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '2px solid #e5e7eb', fontWeight: '600' }}>
                                                    평균
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {statistics.statistics.statistics.column_statistics && Object.entries(statistics.statistics.statistics.column_statistics).map(([colName, colStats]: [string, any], index) => (
                                                <tr key={colName} style={{ background: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', fontWeight: '500', color: '#1f2937' }}>
                                                        {colName}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                                                        {colStats.data_type || 'N/A'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#6b7280' }}>
                                                        {formatNumber(colStats.null_count)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#6b7280' }}>
                                                        {formatPercentage(colStats.null_percentage)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#6b7280' }}>
                                                        {colStats.unique_count === "계산불가" ? "계산불가" : formatNumber(colStats.unique_count)}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#6b7280' }}>
                                                        {colStats.min !== undefined ? (typeof colStats.min === 'number' ? formatNumber(colStats.min) : String(colStats.min)) : '-'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#6b7280' }}>
                                                        {colStats.max !== undefined ? (typeof colStats.max === 'number' ? formatNumber(colStats.max) : String(colStats.max)) : '-'}
                                                    </td>
                                                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#6b7280' }}>
                                                        {colStats.mean !== undefined ? (typeof colStats.mean === 'number' ? colStats.mean.toFixed(4) : String(colStats.mean)) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <p style={{ color: '#ef4444' }}>
                                {statistics?.message || '통계 정보를 불러올 수 없습니다.'}
                            </p>
                        </div>
                    )}
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
