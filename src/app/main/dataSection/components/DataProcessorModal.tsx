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
