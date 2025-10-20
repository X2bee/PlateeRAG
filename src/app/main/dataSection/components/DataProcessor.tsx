'use client';
import React, { useState, useEffect } from 'react';
import {
IoArrowBack,
IoRefresh,
IoLayers,
} from 'react-icons/io5';
import { MdOutlineMore } from "react-icons/md";
import {
ColumnInfoModal,
DatasetVersionSwitchModal,
DownloadDialog,
DatabaseConnectionModal,
StatisticsModal,
DatabaseAutoSyncModal,
ColumnDeleteModal,
ColumnValueReplaceModal,
ColumnOperationModal,
SpecificColumnNullRemoveModal,
HuggingFaceUploadModal,
MLflowUploadModal,
ColumnCopyModal,
ColumnRenameModal,
ColumnFormatModal,
ColumnCalculationModal,
DatasetCallbackModal,
VersionHistoryModal
} from './modals';
import DataProcessorSidebar from './DataProcessorSidebar';
import {
downloadDataset,
getDatasetSample,
dropDatasetColumns,
replaceColumnValues,
applyColumnOperation,
removeNullRows,
uploadToHuggingFace,
uploadToMLflow,
copyDatasetColumn,
renameDatasetColumn,
formatDatasetColumns,
calculateDatasetColumns,
executeDatasetCallback
} from '@/app/_common/api/dataManagerAPI';
import { showSuccessToastKo, showErrorToastKo, showDeleteConfirmToastKo } from '@/app/_common/utils/toastUtilsKo';
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
    const [columnDeleteModalOpen, setColumnDeleteModalOpen] = useState(false);
    const [columnValueReplaceModalOpen, setColumnValueReplaceModalOpen] = useState(false);
    const [columnOperationModalOpen, setColumnOperationModalOpen] = useState(false);
    const [specificColumnNullRemoveModalOpen, setSpecificColumnNullRemoveModalOpen] = useState(false);
    const [huggingFaceUploadModalOpen, setHuggingFaceUploadModalOpen] = useState(false);
    const [columnCopyModalOpen, setColumnCopyModalOpen] = useState(false);
    const [columnRenameModalOpen, setColumnRenameModalOpen] = useState(false);
    const [columnFormatModalOpen, setColumnFormatModalOpen] = useState(false);
    const [columnCalculationModalOpen, setColumnCalculationModalOpen] = useState(false);
    const [datasetCallbackModalOpen, setDatasetCallbackModalOpen] = useState(false);
    const [mlflowUploadModalOpen, setMlflowUploadModalOpen] = useState(false);
    const [versionHistoryModalOpen, setVersionHistoryModalOpen] = useState(false);
    const [datasetLoadInfo, setDatasetLoadInfo] = useState<{
    load_count: number;
    dataset_id: string;
    is_new_version: boolean;
    } | null>(null);
    const [versionSwitchModalOpen, setVersionSwitchModalOpen] = useState(false);
    const [databaseLoadModalOpen, setDatabaseLoadModalOpen] = useState(false);
    const [databaseAutoSyncModalOpen, setDatabaseAutoSyncModalOpen] = useState(false);

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
            
            // 버전 정보가 있다면 저장
            if ((data as any).version_info) {
                setDatasetLoadInfo((data as any).version_info);
            }
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
    };

    const handleOpenColumnDeleteModal = () => {
        setColumnDeleteModalOpen(true);
    };

    const handleCloseColumnDeleteModal = () => {
        setColumnDeleteModalOpen(false);
    };

    const handleOpenColumnValueReplaceModal = () => {
        setColumnValueReplaceModalOpen(true);
    };

    const handleCloseColumnValueReplaceModal = () => {
        setColumnValueReplaceModalOpen(false);
    };

    const handleOpenColumnOperationModal = () => {
        setColumnOperationModalOpen(true);
    };

    const handleCloseColumnOperationModal = () => {
        setColumnOperationModalOpen(false);
    };

    const handleOpenDatabaseLoadModal = () => {
        setDatabaseLoadModalOpen(true);
    };

    const handleCloseDatabaseLoadModal = () => {
        setDatabaseLoadModalOpen(false);
    };

    const handleDatabaseLoadSuccess = () => {
        loadDataTableInfo(); // 데이터 다시 로드
    };

    // ✨ DB 자동 동기화 핸들러 추가
    const handleOpenDatabaseAutoSyncModal = () => {
        setDatabaseAutoSyncModalOpen(true);
    };

    const handleCloseDatabaseAutoSyncModal = () => {
        setDatabaseAutoSyncModalOpen(false);
    };

    const handleDatabaseAutoSyncSuccess = () => {
        loadDataTableInfo(); // 데이터 다시 로드
    };

    const handleReplaceColumnValues = async (columnName: string, oldValue: string, newValue: string) => {
        try {
            showSuccessToastKo(`컬럼 '${columnName}'에서 값을 교체하는 중...`);

            const result = await replaceColumnValues(managerId, columnName, oldValue, newValue) as any;

            if (result.success) {
                showSuccessToastKo(`컬럼 '${columnName}'에서 값이 성공적으로 교체되었습니다!`);
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || '값 교체에 실패했습니다.');
            }
        } catch (error) {
            console.error('Column values replacement failed:', error);
            showErrorToastKo(`값 교체 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const handleApplyColumnOperation = async (columnName: string, operation: string) => {
        try {
            showSuccessToastKo(`컬럼 '${columnName}'에 연산 '${operation}'을 적용하는 중...`);

            const result = await applyColumnOperation(managerId, columnName, operation) as any;

            if (result.success) {
                showSuccessToastKo(`컬럼 '${columnName}'에 연산이 성공적으로 적용되었습니다!`);
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || '연산 적용에 실패했습니다.');
            }
        } catch (error) {
            console.error('Column operation failed:', error);
            showErrorToastKo(`연산 적용 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const handleOpenSpecificColumnNullRemoveModal = () => {
        setSpecificColumnNullRemoveModalOpen(true);
    };

    const handleCloseSpecificColumnNullRemoveModal = () => {
        setSpecificColumnNullRemoveModalOpen(false);
    };

    const handleUploadToMLflow = async (experimentName: string, datasetName: string, options: any) => {
        try {
            showSuccessToastKo('MLflow에 데이터셋을 업로드하는 중...');

            const result = await uploadToMLflow(
                managerId,
                experimentName,
                datasetName,
                options
            ) as any;

            if (result.success) {
                showSuccessToastKo(
                    `데이터셋이 MLflow에 성공적으로 업로드되었습니다!\n` +
                    `실험: ${result.mlflow_info?.experiment_name || experimentName}\n` +
                    `Run ID: ${result.mlflow_info?.run_id || 'N/A'}`
                );
            } else {
                showErrorToastKo(result.message || 'MLflow 업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('MLflow upload failed:', error);
            showErrorToastKo(`MLflow 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const handleRemoveSpecificColumnNullRows = async (columnName: string) => {
        try {
            showSuccessToastKo(`컬럼 '${columnName}'에서 NULL 값이 있는 행을 제거하는 중...`);

            const result = await removeNullRows(managerId, columnName) as any;

            if (result.success) {
                const removedCount = result.removal_info?.removed_rows || 0;
                showSuccessToastKo(`컬럼 '${columnName}'에서 ${removedCount}개의 NULL 값이 포함된 행이 성공적으로 제거되었습니다!`);
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || 'NULL 행 제거에 실패했습니다.');
            }
        } catch (error) {
            console.error('NULL rows removal failed:', error);
            showErrorToastKo(`NULL 행 제거 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const handleUploadToHuggingFace = async (repoId: string, filename: string, isPrivate: boolean, hfUserId: string, hubToken: string) => {
        try {
            showSuccessToastKo('HuggingFace Hub에 데이터셋을 업로드하는 중...');

            const result = await uploadToHuggingFace(
                managerId,
                repoId,
                filename || undefined,
                isPrivate,
                hfUserId || undefined,
                hubToken || undefined
            ) as any;

            if (result.success) {
                showSuccessToastKo(`데이터셋이 HuggingFace Hub에 성공적으로 업로드되었습니다!\n리포지토리: ${result.upload_info?.repo_id || repoId}`);
            } else {
                showErrorToastKo(result.message || 'HuggingFace 업로드에 실패했습니다.');
            }
        } catch (error) {
            console.error('HuggingFace upload failed:', error);
            showErrorToastKo(`HuggingFace 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    // 컬럼 복사 모달 핸들러들
    const handleOpenColumnCopyModal = () => {
        setColumnCopyModalOpen(true);
    };

    const handleCloseColumnCopyModal = () => {
        setColumnCopyModalOpen(false);
    };

    const handleCopyColumn = async (sourceColumn: string, newColumn: string) => {
        try {
            showSuccessToastKo(`컬럼 '${sourceColumn}'을 '${newColumn}'으로 복사하는 중...`);

            const result = await copyDatasetColumn(managerId, sourceColumn, newColumn) as any;

            if (result.success) {
                showSuccessToastKo(`컬럼 '${sourceColumn}'이 '${newColumn}'으로 성공적으로 복사되었습니다!`);
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || '컬럼 복사에 실패했습니다.');
            }
        } catch (error) {
            console.error('Column copy failed:', error);
            showErrorToastKo(`컬럼 복사 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    // 컬럼 이름 변경 모달 핸들러들
    const handleOpenColumnRenameModal = () => {
        setColumnRenameModalOpen(true);
    };

    const handleCloseColumnRenameModal = () => {
        setColumnRenameModalOpen(false);
    };

    const handleRenameColumn = async (oldName: string, newName: string) => {
        try {
            showSuccessToastKo(`컬럼 이름을 '${oldName}'에서 '${newName}'으로 변경하는 중...`);

            const result = await renameDatasetColumn(managerId, oldName, newName) as any;

            if (result.success) {
                showSuccessToastKo(`컬럼 이름이 '${oldName}'에서 '${newName}'으로 성공적으로 변경되었습니다!`);
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || '컬럼 이름 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error('Column rename failed:', error);
            showErrorToastKo(`컬럼 이름 변경 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    // 컬럼 포맷 모달 핸들러들
    const handleOpenColumnFormatModal = () => {
        setColumnFormatModalOpen(true);
    };

    const handleCloseColumnFormatModal = () => {
        setColumnFormatModalOpen(false);
    };

    const handleFormatColumns = async (columnNames: string[], template: string, newColumn: string) => {
        try {
            showSuccessToastKo(`컬럼들을 포맷팅하여 '${newColumn}' 컬럼을 생성하는 중...`);

            const result = await formatDatasetColumns(managerId, columnNames, template, newColumn) as any;

            if (result.success) {
                showSuccessToastKo(`새로운 컬럼 '${newColumn}'이 성공적으로 생성되었습니다!`);
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || '컬럼 포맷팅에 실패했습니다.');
            }
        } catch (error) {
            console.error('Column format failed:', error);
            showErrorToastKo(`컬럼 포맷팅 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    // 컬럼 연산 모달 핸들러들
    const handleOpenColumnCalculationModal = () => {
        setColumnCalculationModalOpen(true);
    };

    const handleCloseColumnCalculationModal = () => {
        setColumnCalculationModalOpen(false);
    };

    const handleCalculateColumns = async (col1: string, col2: string, operation: string, newColumn: string) => {
        try {
            showSuccessToastKo(`컬럼 '${col1}'과 '${col2}'를 연산하여 '${newColumn}' 컬럼을 생성하는 중...`);

            const result = await calculateDatasetColumns(managerId, col1, col2, operation, newColumn) as any;

            if (result.success) {
                showSuccessToastKo(`새로운 컬럼 '${newColumn}'이 성공적으로 생성되었습니다!`);
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || '컬럼 연산에 실패했습니다.');
            }
        } catch (error) {
            console.error('Column calculation failed:', error);
            showErrorToastKo(`컬럼 연산 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    // 데이터셋 콜백 모달 핸들러들
    const handleOpenDatasetCallbackModal = () => {
        setDatasetCallbackModalOpen(true);
    };

    const handleCloseDatasetCallbackModal = () => {
        setDatasetCallbackModalOpen(false);
    };

    const handleExecuteDatasetCallback = async (callbackCode: string) => {
        try {
            showSuccessToastKo('PyArrow 콜백 코드를 실행하는 중...');

            const result = await executeDatasetCallback(managerId, callbackCode) as any;

            if (result.success) {
                const callbackResult = result.callback_result;
                const rowsChanged = callbackResult?.rows_changed || 0;
                const columnsChanged = callbackResult?.columns_changed || 0;

                showSuccessToastKo(
                    `콜백 코드가 성공적으로 실행되었습니다!\n` +
                    `행 변경: ${rowsChanged >= 0 ? '+' + rowsChanged : rowsChanged}, 컬럼 변경: ${columnsChanged >= 0 ? '+' + columnsChanged : columnsChanged}`
                );
                loadDataTableInfo(); // 데이터 다시 로드
            } else {
                showErrorToastKo(result.message || '콜백 코드 실행에 실패했습니다.');
            }
        } catch (error) {
            console.error('Dataset callback execution failed:', error);
            showErrorToastKo(`콜백 코드 실행 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const handleDeleteMultipleColumns = async (columnNames: string[]) => {
        showDeleteConfirmToastKo({
            title: '컬럼 삭제',
            message: `선택된 ${columnNames.length}개 컬럼을 삭제하시겠습니까?\n${columnNames.join(', ')}\n\n이 작업은 되돌릴 수 없습니다.`,
            itemName: `${columnNames.length}개 컬럼`,
            onConfirm: async () => {
                try {
                    showSuccessToastKo(`${columnNames.length}개 컬럼을 삭제하는 중...`);

                    const result = await dropDatasetColumns(managerId, columnNames) as any;

                    if (result.success) {
                        showSuccessToastKo(`${columnNames.length}개 컬럼이 성공적으로 삭제되었습니다!`);
                        loadDataTableInfo();
                    } else {
                        showErrorToastKo(result.message || '컬럼 삭제에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('Columns drop failed:', error);
                    showErrorToastKo(`컬럼 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                }
            },
            confirmText: '삭제',
            cancelText: '취소'
        });
    };

    const handleOpenVersionHistoryModal = () => {
        setVersionHistoryModalOpen(true);
    };

    const handleCloseVersionHistoryModal = () => {
        setVersionHistoryModalOpen(false);
    };

    const handleVersionRollback = () => {
        // 롤백 후 데이터 다시 로드
        loadDataTableInfo();
    };

    const handleDropColumn = async (columnName: string) => {
        showDeleteConfirmToastKo({
            title: '컬럼 삭제',
            message: `'${columnName}' 컬럼을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
            itemName: columnName,
            onConfirm: async () => {
                try {
                    showSuccessToastKo(`'${columnName}' 컬럼을 삭제하는 중...`);

                    const result = await dropDatasetColumns(managerId, [columnName]) as any;

                    if (result.success) {
                        showSuccessToastKo(`'${columnName}' 컬럼이 성공적으로 삭제되었습니다!`);
                        // 데이터 다시 로드
                        loadDataTableInfo();
                    } else {
                        showErrorToastKo(result.message || '컬럼 삭제에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('Column drop failed:', error);
                    showErrorToastKo(`컬럼 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                }
            },
            confirmText: '삭제',
            cancelText: '취소'
        });
    };    

    const handleDownloadDataset = async () => {
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
            ) as any;

            // 버전 정보 포함된 성공 메시지
            if (result.version_info) {
                const versionMsg = result.version_info.is_new_version 
                    ? `데이터셋이 v${result.version_info.load_count}로 재업로드되었습니다!`
                    : `데이터셋이 성공적으로 다운로드되고 적재되었습니다! (v${result.version_info.load_count})`;
                showSuccessToastKo(versionMsg);
                
                // 버전 정보 저장
                setDatasetLoadInfo(result.version_info);
            } else {
                showSuccessToastKo('데이터셋이 성공적으로 다운로드되고 적재되었습니다!');
            }
            
            setDownloadDialog({ isOpen: false, repoId: '', filename: '', split: '' });
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
                        <div className={styles.headerMeta}>
                            <p>Manager ID: {managerId} | User ID: {userId}</p>
                            {datasetLoadInfo && datasetLoadInfo.load_count > 0 && (
                                <div className={styles.versionControls}>
                                    <div className={styles.datasetVersionBadge}>
                                        <IoLayers />
                                        <span>
                                            데이터셋 버전: v{datasetLoadInfo.load_count}
                                            {datasetLoadInfo.is_new_version && ' (재업로드됨)'}
                                        </span>
                                    </div>
                                    {datasetLoadInfo.load_count > 1 && (
                                        <button
                                            onClick={() => setVersionSwitchModalOpen(true)}
                                            className={styles.switchVersionButton}
                                            title="버전 선택"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2"/>
                                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2"/>
                                            </svg>
                                            <span>버전 변경</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
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
                                                <th key={index}>
                                                    <div className={styles.columnHeader}>
                                                        <span className={styles.columnName}>{column}</span>
                                                        <button
                                                            onClick={() => handleDropColumn(column)}
                                                            className={styles.dropButton}
                                                            title={`'${column}' 컬럼 삭제`}
                                                            aria-label={`Delete column ${column}`}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dataTableInfo.sample_data.map((row, index) => (
                                            <tr key={index}>
                                                {dataTableInfo.columns.map((column, colIndex) => (
                                                    <td key={colIndex}>
                                                        {String(row[column] ?? '')}
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
                    onColumnDeleteModal={handleOpenColumnDeleteModal}
                    onColumnValueReplaceModal={handleOpenColumnValueReplaceModal}
                    onColumnOperationModal={handleOpenColumnOperationModal}
                    onSpecificColumnNullRemoveModal={handleOpenSpecificColumnNullRemoveModal}
                    onHuggingFaceUploadModal={() => setHuggingFaceUploadModalOpen(true)}
                    onMLflowUploadModal={() => setMlflowUploadModalOpen(true)}
                    onVersionHistoryModal={handleOpenVersionHistoryModal}
                    onColumnCopyModal={handleOpenColumnCopyModal}
                    onColumnRenameModal={handleOpenColumnRenameModal}
                    onColumnFormatModal={handleOpenColumnFormatModal}
                    onColumnCalculationModal={handleOpenColumnCalculationModal}
                    onDatasetCallbackModal={handleOpenDatasetCallbackModal}
                    onDatabaseLoadModal={handleOpenDatabaseLoadModal}
                    onDatabaseAutoSyncModal={handleOpenDatabaseAutoSyncModal}  // ✨ 추가
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
            <ColumnDeleteModal
                isOpen={columnDeleteModalOpen}
                onClose={handleCloseColumnDeleteModal}
                onDeleteMultipleColumns={handleDeleteMultipleColumns}
                availableColumns={dataTableInfo?.columns || []}
            />
            <ColumnValueReplaceModal
                isOpen={columnValueReplaceModalOpen}
                onClose={handleCloseColumnValueReplaceModal}
                onReplaceValues={handleReplaceColumnValues}
                availableColumns={dataTableInfo?.columns || []}
            />
            <ColumnOperationModal
                isOpen={columnOperationModalOpen}
                onClose={handleCloseColumnOperationModal}
                onApplyOperation={handleApplyColumnOperation}
                availableColumns={dataTableInfo?.columns || []}
            />
            <SpecificColumnNullRemoveModal
                isOpen={specificColumnNullRemoveModalOpen}
                onClose={handleCloseSpecificColumnNullRemoveModal}
                onRemoveNullRows={handleRemoveSpecificColumnNullRows}
                availableColumns={dataTableInfo?.columns || []}
            />
            <HuggingFaceUploadModal
                isOpen={huggingFaceUploadModalOpen}
                onClose={() => setHuggingFaceUploadModalOpen(false)}
                onUpload={handleUploadToHuggingFace}
            />
            <ColumnCopyModal
                isOpen={columnCopyModalOpen}
                onClose={handleCloseColumnCopyModal}
                onCopyColumn={handleCopyColumn}
                availableColumns={dataTableInfo?.columns || []}
            />
            <ColumnRenameModal
                isOpen={columnRenameModalOpen}
                onClose={handleCloseColumnRenameModal}
                onRenameColumn={handleRenameColumn}
                availableColumns={dataTableInfo?.columns || []}
            />
            <ColumnFormatModal
                isOpen={columnFormatModalOpen}
                onClose={handleCloseColumnFormatModal}
                onFormatColumns={handleFormatColumns}
                availableColumns={dataTableInfo?.columns || []}
            />
            <ColumnCalculationModal
                isOpen={columnCalculationModalOpen}
                onClose={handleCloseColumnCalculationModal}
                onCalculateColumns={handleCalculateColumns}
                availableColumns={dataTableInfo?.columns || []}
            />
            <DatasetCallbackModal
                isOpen={datasetCallbackModalOpen}
                onClose={handleCloseDatasetCallbackModal}
                onExecuteCallback={handleExecuteDatasetCallback}
                sampleData={dataTableInfo?.sample_data?.slice(0, 3) || []}
                columns={dataTableInfo?.columns || []}
            />
            <MLflowUploadModal
                isOpen={mlflowUploadModalOpen}
                onClose={() => setMlflowUploadModalOpen(false)}
                onUpload={handleUploadToMLflow}
            />
            <VersionHistoryModal
                isOpen={versionHistoryModalOpen}
                managerId={managerId}
                onClose={handleCloseVersionHistoryModal}
                onRollback={handleVersionRollback}
            />
            <DatasetVersionSwitchModal
                isOpen={versionSwitchModalOpen}
                managerId={managerId}
                onClose={() => setVersionSwitchModalOpen(false)}
                onSwitch={() => {
                    loadDataTableInfo();
                }}
            />
            <DatabaseConnectionModal
                isOpen={databaseLoadModalOpen}
                managerId={managerId}
                onClose={handleCloseDatabaseLoadModal}
                onLoadSuccess={handleDatabaseLoadSuccess}
            />
            {/* ✨ DB 자동 동기화 모달 추가 */}
            <DatabaseAutoSyncModal
                isOpen={databaseAutoSyncModalOpen}
                managerId={managerId}
                onClose={handleCloseDatabaseAutoSyncModal}
                onSuccess={handleDatabaseAutoSyncSuccess}
            />
        </div>
    );
};

export default DataProcessor;