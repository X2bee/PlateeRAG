'use client';

import React, { useState, useEffect } from 'react';
import {
    IoArrowBack,
    IoRefresh,
} from 'react-icons/io5';
import { MdOutlineMore } from "react-icons/md";
import { ColumnInfoModal, DownloadDialog, StatisticsModal } from './DataProcessorModal';
import DataProcessorSidebar from './DataProcessorSidebar';
import { downloadDataset, getDatasetSample } from '@/app/_common/api/dataManagerAPI';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from '@/app/main/dataSection/assets/DataProcessor.module.scss';

interface DataProcessorProps {
    managerId: string;
    userId: string;
    onBack: () => void;
}

interface DataTableRow {
    [key: string]: any;
}

interface DataTableInfo {
    success: boolean;
    sample_data: DataTableRow[];
    sample_count: number;
    total_rows: number;
    total_columns: number;
    columns: string[];
    column_info: string | object;
    sampled_at: string;
}

interface DownloadDialogState {
    isOpen: boolean;
    repoId: string;
    filename: string;
    split: string;
}

const DataProcessor: React.FC<DataProcessorProps> = ({
    managerId,
    userId,
    onBack
}) => {
    const [dataTableInfo, setDataTableInfo] = useState<DataTableInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [columnInfoModalOpen, setColumnInfoModalOpen] = useState(false);
    const [downloadDialog, setDownloadDialog] = useState<DownloadDialogState>({
        isOpen: false,
        repoId: '',
        filename: '',
        split: ''
    });
    const [downloading, setDownloading] = useState(false);
    const [statisticsModalOpen, setStatisticsModalOpen] = useState(false);
    const [statisticsData, setStatisticsData] = useState<any>(null);
    const [statisticsLoading, setStatisticsLoading] = useState(false);

    // 데이터 로드
    useEffect(() => {
        loadDataTableInfo();
    }, [managerId, userId]);

    const loadDataTableInfo = async () => {
        setLoading(true);
        setError(null);

        try {
            const data = await getDatasetSample(managerId, 10) as DataTableInfo;
            setDataTableInfo(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : '데이터 테이블 정보 로드 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    };

    const handleStatisticsModal = (statistics: any, loading: boolean) => {
        setStatisticsData(statistics);
        setStatisticsLoading(loading);
        setStatisticsModalOpen(true);

        // 에러가 발생해서 statistics가 null이고 loading이 false인 경우 모달 닫기
        if (!statistics && !loading) {
            setStatisticsModalOpen(false);
        }
    };

    const handleCloseStatisticsModal = () => {
        setStatisticsModalOpen(false);
        setStatisticsData(null);
        setStatisticsLoading(false);
    };    const handleDownloadDataset = async () => {
        if (!downloadDialog.repoId.trim()) {
            showErrorToastKo('Repository ID를 입력해주세요.');
            return;
        }

        setDownloading(true);
        try {
            const result = await downloadDataset(
                managerId,
                downloadDialog.repoId.trim(),
                downloadDialog.filename.trim() || undefined,
                downloadDialog.split.trim() || undefined
            );

            showSuccessToastKo('데이터셋이 성공적으로 다운로드되고 적재되었습니다!');
            setDownloadDialog({ isOpen: false, repoId: '', filename: '', split: '' });

            // 데이터 다시 로드
            loadDataTableInfo();
        } catch (error) {
            console.error('Dataset download failed:', error);
            showErrorToastKo(`데이터셋 다운로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setDownloading(false);
        }
    };

    const handleRefresh = () => {
        loadDataTableInfo();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR');
    };

    if (loading) {
        return (
            <div className={styles.error}>
                <div className={styles.errorContent}>
                    <p>{error}</p>
                    <button
                        onClick={loadDataTableInfo}
                        className={styles.retryButton}
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 헤더 */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button
                        onClick={onBack}
                        className={styles.backButton}
                        title="뒤로가기"
                    >
                        <IoArrowBack />
                    </button>
                    <div className={styles.headerInfo}>
                        <h2>데이터 프로세서</h2>
                        <p>Manager ID: {managerId} | User ID: {userId}</p>
                    </div>
                </div>
                <button
                    onClick={handleRefresh}
                    className={styles.refreshButton}
                    title="새로고침"
                >
                    <IoRefresh />
                </button>
            </div>

            <div className={styles.content}>
                {/* 가운데 - Data Table 샘플 보기 영역 */}
                <div className={styles.dataSection}>
                    <div className={styles.dataCard}>
                        <div className={styles.dataHeader}>
                            <h3>Data Table 샘플</h3>
                            {!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0 ? (
                                <div>
                                    <p className={styles.emptyMessage}>데이터가 아직 로드되지 않았습니다.</p>
                                    <p className={styles.emptySubMessage}>
                                        데이터셋을 다운로드하여 데이터를 로드해주세요.
                                    </p>
                                </div>
                            ) : (
                                <div className={styles.tableInfo}>
                                    <div className={styles.basicInfo}>
                                        <p><strong>총 데이터 행:</strong> {dataTableInfo.total_rows.toLocaleString()} 행</p>
                                        <div className={styles.columnInfoRow}>
                                            <p><strong>총 컬럼 수:</strong> {dataTableInfo.total_columns} 개</p>
                                            {dataTableInfo.column_info && (
                                                <button
                                                    onClick={() => setColumnInfoModalOpen(true)}
                                                    className={styles.infoButton}
                                                    title="컬럼 정보 보기"
                                                >
                                                    <MdOutlineMore size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <p><strong>샘플 개수:</strong> {dataTableInfo.sample_count} 개</p>
                                        <p><strong>샘플링 시간:</strong> {new Date(dataTableInfo.sampled_at).toLocaleString('ko-KR')}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 데이터 테이블 */}
                        {dataTableInfo && dataTableInfo.success && dataTableInfo.sample_count > 0 && (
                            <div className={styles.tableContainer}>
                                <table className={styles.dataTable}>
                                    <thead>
                                        <tr>
                                            {dataTableInfo.columns.map((column, index) => (
                                                <th key={index}>{column}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataTableInfo.sample_data.map((row, index) => (
                                            <tr key={index}>
                                                {dataTableInfo.columns.map((column, colIndex) => (
                                                    <td key={colIndex}>
                                                        {String(row[column] || '')}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* 우측 - 데이터 편집 버튼들 */}
                <DataProcessorSidebar
                    managerId={managerId}
                    userId={userId}
                    dataTableInfo={dataTableInfo}
                    downloadDialog={downloadDialog}
                    setDownloadDialog={setDownloadDialog}
                    onDataReload={loadDataTableInfo}
                    onStatisticsModal={handleStatisticsModal}
                />
            </div>

            {/* 모달들 */}
            <ColumnInfoModal
                isOpen={columnInfoModalOpen}
                columnInfo={dataTableInfo?.column_info || null}
                onClose={() => setColumnInfoModalOpen(false)}
            />
            <DownloadDialog
                dialogState={downloadDialog}
                downloading={downloading}
                onClose={() => setDownloadDialog({ isOpen: false, repoId: '', filename: '', split: '' })}
                onDownload={handleDownloadDataset}
                onUpdateDialog={(updates) => setDownloadDialog({ ...downloadDialog, ...updates })}
            />
            <StatisticsModal
                isOpen={statisticsModalOpen}
                statistics={statisticsData}
                loading={statisticsLoading}
                onClose={handleCloseStatisticsModal}
            />
        </div>
    );
};

export default DataProcessor;
