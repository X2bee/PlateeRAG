'use client';

import React, { useState } from 'react';
import {
    IoDownload,
    IoCloudUpload,
    IoCreate,
    IoTrash,
    IoAnalytics,
    IoSave,
    IoChevronBack,
    IoWaterOutline,
    IoGitBranch,
    IoServer,
    IoRefresh
} from 'react-icons/io5';
import { MdDataset } from 'react-icons/md';
import { showErrorToastKo, showSuccessToastKo, showDeleteConfirmToastKo } from '@/app/_common/utils/toastUtilsKo';
import { removeDataset, uploadLocalDataset, exportDatasetAsCSV, exportDatasetAsParquet, getDatasetStatistics, removeNullRows } from '@/app/_common/api/dataManagerAPI';
import styles from '@/app/main/dataSection/assets/DataProcessorSidebar.module.scss';

interface DataTableInfo {
    success: boolean;
    sample_data: any[];
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

interface DataProcessorSidebarProps {
    managerId: string;
    userId: string;
    dataTableInfo: DataTableInfo | null;
    downloadDialog: DownloadDialogState;
    setDownloadDialog: (state: DownloadDialogState) => void;
    onDataReload: () => void;
    onStatisticsModal?: (statistics: any, loading: boolean) => void;
    onColumnDeleteModal?: () => void;
    onColumnValueReplaceModal?: () => void;
    onColumnOperationModal?: () => void;
    onSpecificColumnNullRemoveModal?: () => void;
    onHuggingFaceUploadModal?: () => void;
    onMLflowUploadModal?: () => void;  // 새로 추가
    onColumnCopyModal?: () => void;
    onColumnRenameModal?: () => void;
    onColumnFormatModal?: () => void;
    onColumnCalculationModal?: () => void;
    onDatasetCallbackModal?: () => void;
    onVersionHistoryModal?: () => void;  // 추가
    onDatabaseLoadModal?: () => void;  // 추가
    onDatabaseAutoSyncModal?: () => void;  // 추가
}

type CategoryType = 'load' | 'analyze' | 'edit' | 'save';
type ActionType = 'huggingface' | 'file-upload' | 'basic-stats' | 'edit-columns' | 'add-columns' | 'drop-columns' | 'clean-data' | 'export-csv' | 'export-parquet' | 'change-column-data' | 'column-operation' | 'remove-all-null-rows' | 'remove-specific-column-null-rows' | 'copy-specific-column' | 'column-format-string' | 'column-calculation' | 'upload-to-huggingface' | 'upload-to-mlflow' | 'rename-column' | 'dataset-callback' | 'version-history' | 'database-load' | 'database-auto-sync' | null;

const DataProcessorSidebar: React.FC<DataProcessorSidebarProps> = ({
    managerId,
    userId,
    dataTableInfo,
    downloadDialog,
    setDownloadDialog,
    onDataReload,
    onStatisticsModal,
    onColumnDeleteModal,
    onColumnValueReplaceModal,
    onColumnOperationModal,
    onSpecificColumnNullRemoveModal,
    onHuggingFaceUploadModal,
    onMLflowUploadModal,  // 새로 추가
    onColumnCopyModal,
    onColumnRenameModal,
    onColumnFormatModal,
    onColumnCalculationModal,
    onDatasetCallbackModal,
    onVersionHistoryModal,  // 추가
    onDatabaseLoadModal,  // 추가
    onDatabaseAutoSyncModal,
}) => {
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
    const [selectedAction, setSelectedAction] = useState<ActionType>(null);

    // 메인 카테고리 정의
    const categories = [
        {
            id: 'load' as CategoryType,
            title: '데이터셋 불러오기',
            icon: MdDataset,
            description: '데이터셋 가져오기'
        },
        {
            id: 'analyze' as CategoryType,
            title: '데이터셋 분석',
            icon: IoAnalytics,
            description: '데이터셋 통계 및 구조 분석'
        },
        {
            id: 'edit' as CategoryType,
            title: '데이터셋 편집',
            icon: IoCreate,
            description: '데이터셋 내용 수정 및 전처리'
        },
        {
            id: 'save' as CategoryType,
            title: '데이터셋 저장하기',
            icon: IoSave,
            description: '편집된 데이터셋 내보내기'
        }
    ];

    // 액션 정의
    const getActionsForCategory = (category: CategoryType) => {
        switch (category) {
            case 'load':
                return [
                    {
                        id: 'huggingface' as ActionType,
                        title: '허깅페이스에서 다운로드',
                        icon: IoDownload,
                        description: 'Hugging Face Hub에서 데이터셋 가져오기'
                    },
                    {
                        id: 'file-upload' as ActionType,
                        title: '파일 업로드',
                        icon: IoCloudUpload,
                        description: '로컬 파일에서 데이터셋 업로드'
                    },
                    {
                        id: 'database-load' as ActionType,
                        title: '데이터베이스에서 로드',
                        icon: IoServer,
                        description: 'PostgreSQL, MySQL, SQLite 등에서 데이터 가져오기'
                    },
                    {
                        id: 'database-auto-sync' as ActionType,  // ✨ 추가
                        title: 'DB 자동 동기화 설정',
                        icon: IoRefresh,  // react-icons/io5에서 import 필요
                        description: '주기적으로 데이터베이스에서 자동으로 데이터 가져오기'
                    }
                ];
            case 'analyze':
                return [
                    {
                        id: 'basic-stats' as ActionType,
                        title: '기본 통계',
                        icon: IoAnalytics,
                        description: '데이터셋 기본 통계 정보'
                    },
                    {
                        id: 'version-history' as ActionType,  // 추가
                        title: '버전 이력',
                        icon: IoGitBranch,
                        description: '데이터셋 변경 이력 및 버전 관리'
                    }
                ];
            case 'edit':
                return [
                    {
                        id: 'edit-columns' as ActionType,
                        title: '컬럼 편집',
                        icon: IoCreate,
                        description: '컬럼 데이터 편집'
                    },
                    {
                        id: 'add-columns' as ActionType,
                        title: '컬럼 추가',
                        icon: IoCloudUpload,
                        description: '새로운 컬럼 추가'
                    },
                    {
                        id: 'drop-columns' as ActionType,
                        title: '컬럼 삭제',
                        icon: IoTrash,
                        description: '여러 컬럼을 한 번에 삭제'
                    },
                    {
                        id: 'clean-data' as ActionType,
                        title: '데이터 정제',
                        icon: IoWaterOutline,
                        description: '결측치 및 불필요한 데이터 제거'
                    }
                ];
            case 'save':
                return [
                    {
                        id: 'upload-to-huggingface' as ActionType,
                        title: 'Hugging Face에 업로드',
                        icon: IoCloudUpload,
                        description: 'Hugging Face Hub에 데이터셋 업로드'
                    },
                    {
                        id: 'upload-to-mlflow' as ActionType,  // 새로 추가
                        title: 'MLflow에 업로드',
                        icon: IoAnalytics,
                        description: 'MLflow 실험에 데이터셋 업로드'
                    },
                    {
                        id: 'export-csv' as ActionType,
                        title: 'CSV로 저장',
                        icon: IoSave,
                        description: '데이터셋을 CSV 파일로 내보내기'
                    },
                    {
                        id: 'export-parquet' as ActionType,
                        title: 'Parquet으로 저장',
                        icon: IoSave,
                        description: '데이터셋을 Parquet 파일로 내보내기'
                    }
                ];
            default:
                return [];
        }
    };

    // 편집 하위 액션들
    const getEditDataSubActions = () => {
        if (selectedAction === 'edit-columns') {
            return [
                {
                    id: 'change-column-data' as ActionType,
                    title: '열 데이터 변경',
                    icon: IoCreate,
                    description: 'str 바꾸기'
                },
                {
                    id: 'column-operation' as ActionType,
                    title: '열 데이터 연산',
                    icon: IoAnalytics,
                    description: '입력된 연산자 수행'
                },
                {
                    id: 'rename-column' as ActionType,
                    title: '열 이름 변경',
                    icon: IoCreate,
                    description: '컬럼 이름 변경'
                },
                {
                    id: 'dataset-callback' as ActionType,
                    title: 'PyArrow 콜백 함수',
                    icon: IoAnalytics,
                    description: '사용자 정의 PyArrow 코드 실행'
                }
            ];
        } else if (selectedAction === 'clean-data') {
            return [
                {
                    id: 'remove-all-null-rows' as ActionType,
                    title: '모든 결측치 제거',
                    icon: IoWaterOutline,
                    description: '모든 컬럼에서 NULL 값이 있는 행 제거'
                },
                {
                    id: 'remove-specific-column-null-rows' as ActionType,
                    title: '특정 열 결측치 제거',
                    icon: IoTrash,
                    description: '선택한 컬럼에서만 NULL 값이 있는 행 제거'
                }
            ];
        } else if (selectedAction === 'add-columns') {
            return [
                {
                    id: 'copy-specific-column' as ActionType,
                    title: '특정 컬럼 복사',
                    icon: IoCloudUpload,
                    description: '선택한 컬럼을 새로운 이름으로 복사'
                },
                {
                    id: 'column-format-string' as ActionType,
                    title: '컬럼 문자열 포맷팅',
                    icon: IoCreate,
                    description: '여러 컬럼의 값들을 문자열 템플릿으로 결합하여 새 컬럼 생성'
                },
                {
                    id: 'column-calculation' as ActionType,
                    title: '컬럼 간 연산',
                    icon: IoAnalytics,
                    description: '두 컬럼 간 사칙연산을 수행하고 새 컬럼으로 저장'
                }
            ];
        }
        return [];
    };

    const handleUploadFile = async () => {
        // 파일 선택을 위한 input 엘리먼트 생성
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '.parquet,.csv';

        input.onchange = async (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (!files || files.length === 0) {
                return;
            }

            try {
                // 파일 형식 검증
                const supportedFormats = ['.parquet', '.csv'];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    const hasValidExtension = supportedFormats.some(ext =>
                        file.name.toLowerCase().endsWith(ext)
                    );
                    if (!hasValidExtension) {
                        showErrorToastKo(`지원되지 않는 파일 형식: ${file.name}. parquet 또는 csv 파일만 지원됩니다.`);
                        return;
                    }
                }

                // 업로드 진행
                showSuccessToastKo(`${files.length}개 파일 업로드를 시작합니다...`);

                const result = await uploadLocalDataset(managerId, files);

                showSuccessToastKo(`${files.length}개 파일이 성공적으로 업로드되고 적재되었습니다!`);

                // 데이터 다시 로드
                onDataReload();

            } catch (error) {
                console.error('File upload failed:', error);
                showErrorToastKo(`파일 업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        };

        // 파일 선택 다이얼로그 열기
        input.click();
    };

    const handleEditColumns = async () => {
        // 컬럼 편집의 경우 하위 메뉴로 이동
        setSelectedAction('edit-columns');
    };

    const handleAddColumns = async () => {
        // 컬럼 추가의 경우 하위 메뉴로 이동
        setSelectedAction('add-columns');
    };

    const handleChangeColumnData = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('편집할 데이터가 없습니다.');
            return;
        }

        // 컬럼 값 교체 모달 열기
        if (onColumnValueReplaceModal) {
            onColumnValueReplaceModal();
        }
    };

    const handleColumnOperation = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('연산을 적용할 데이터가 없습니다.');
            return;
        }

        // 컬럼 연산 적용 모달 열기
        if (onColumnOperationModal) {
            onColumnOperationModal();
        }
    };

    const handleDropColumns = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('컬럼을 삭제할 데이터가 없습니다.');
            return;
        }

        // 컬럼 삭제 모달 열기
        if (onColumnDeleteModal) {
            onColumnDeleteModal();
        }
    };

    const handleRemoveAllNullRows = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('정제할 데이터가 없습니다.');
            return;
        }

        showDeleteConfirmToastKo({
            title: '모든 결측치 제거',
            message: '모든 컬럼에서 NULL 값이 있는 행을 제거하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
            itemName: 'NULL 값이 포함된 행',
            onConfirm: async () => {
                try {
                    showSuccessToastKo('모든 컬럼에서 NULL 값이 있는 행을 제거하는 중...');

                    const result = await removeNullRows(managerId, null) as any;

                    if (result.success) {
                        const removedCount = result.removal_info?.removed_rows || 0;
                        showSuccessToastKo(`${removedCount}개의 NULL 값이 포함된 행이 성공적으로 제거되었습니다!`);
                        onDataReload(); // 데이터 다시 로드
                    } else {
                        showErrorToastKo(result.message || 'NULL 행 제거에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('NULL rows removal failed:', error);
                    showErrorToastKo(`NULL 행 제거 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                }
            },
            confirmText: '제거',
            cancelText: '취소'
        });
    };

    const handleRemoveSpecificColumnNullRows = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('정제할 데이터가 없습니다.');
            return;
        }

        // 특정 컬럼 NULL 제거 모달 열기
        if (onSpecificColumnNullRemoveModal) {
            onSpecificColumnNullRemoveModal();
        }
    };

    const handleCopySpecificColumn = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('복사할 데이터가 없습니다.');
            return;
        }

        // 컬럼 복사 모달 열기
        if (onColumnCopyModal) {
            onColumnCopyModal();
        }
    };

    const handleRenameColumn = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('이름을 변경할 데이터가 없습니다.');
            return;
        }

        // 컬럼 이름 변경 모달 열기
        if (onColumnRenameModal) {
            onColumnRenameModal();
        }
    };

    const handleColumnCalculationCopy = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('연산을 적용할 데이터가 없습니다.');
            return;
        }

        // 컬럼 간 연산 모달 열기
        if (onColumnCalculationModal) {
            onColumnCalculationModal();
        }
    };

    const handleColumnFormatString = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('포맷팅할 데이터가 없습니다.');
            return;
        }

        // 컬럼 문자열 포맷팅 모달 열기
        if (onColumnFormatModal) {
            onColumnFormatModal();
        }
    };

    const handleDatasetCallback = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('실행할 데이터가 없습니다.');
            return;
        }

        // PyArrow 콜백 모달 열기
        if (onDatasetCallbackModal) {
            onDatasetCallbackModal();
        }
    };

    const handleUploadToMLflow = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('업로드할 데이터가 없습니다.');
            return;
        }
    
        // MLflow 업로드 모달 열기
        if (onMLflowUploadModal) {
            onMLflowUploadModal();
        }
    };
    
    const handleUploadToHuggingFace = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('업로드할 데이터가 없습니다.');
            return;
        }

        // HuggingFace 업로드 모달 열기
        if (onHuggingFaceUploadModal) {
            onHuggingFaceUploadModal();
        }
    };

    const handleBasicStats = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('통계를 분석할 데이터가 없습니다.');
            return;
        }

        try {
            // 로딩 상태로 모달 열기
            if (onStatisticsModal) {
                onStatisticsModal(null, true);
            }

            showSuccessToastKo('데이터셋 통계 정보를 생성하는 중...');

            const result = await getDatasetStatistics(managerId);

            // 통계 결과와 함께 모달 업데이트
            if (onStatisticsModal) {
                onStatisticsModal(result, false);
            }

            if ((result as any).success) {
                showSuccessToastKo('데이터셋 기술통계정보가 생성되었습니다!');
            } else {
                showErrorToastKo((result as any).message || '통계 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('Statistics generation failed:', error);
            showErrorToastKo(`통계 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);

            // 에러 시 모달 닫기
            if (onStatisticsModal) {
                onStatisticsModal(null, false);
            }
        }
    };

    const handleExportCSV = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('내보낼 데이터가 없습니다.');
            return;
        }

        try {
            showSuccessToastKo('CSV 파일 생성 중...');
            await exportDatasetAsCSV(managerId);
            showSuccessToastKo('CSV 파일이 성공적으로 다운로드되었습니다!');
        } catch (error) {
            console.error('CSV export failed:', error);
            showErrorToastKo(`CSV 내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const handleExportParquet = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('내보낼 데이터가 없습니다.');
            return;
        }

        try {
            showSuccessToastKo('Parquet 파일 생성 중...');
            await exportDatasetAsParquet(managerId);
            showSuccessToastKo('Parquet 파일이 성공적으로 다운로드되었습니다!');
        } catch (error) {
            console.error('Parquet export failed:', error);
            showErrorToastKo(`Parquet 내보내기 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const handleDeleteFile = async () => {
        if (!dataTableInfo || !dataTableInfo.success || dataTableInfo.sample_count === 0) {
            showErrorToastKo('삭제할 데이터가 없습니다.');
            return;
        }

        showDeleteConfirmToastKo({
            title: '데이터셋 삭제',
            message: '정말로 현재 데이터셋을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
            itemName: '데이터셋',
            onConfirm: async () => {
                try {
                    await removeDataset(managerId);
                    showSuccessToastKo('데이터셋이 성공적으로 삭제되었습니다!');
                    onDataReload();
                } catch (error) {
                    console.error('Dataset deletion failed:', error);
                    showErrorToastKo(`데이터셋 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                }
            },
            confirmText: '삭제',
            cancelText: '취소'
        });
    };

    const handleCategorySelect = (categoryId: CategoryType) => {
        setSelectedCategory(categoryId);
        setSelectedAction(null);
    };

    const handleActionSelect = (actionId: ActionType) => {
        setSelectedAction(actionId);

        // 액션에 따른 실제 함수 호출
        switch (actionId) {
            case 'huggingface':
                setDownloadDialog({ ...downloadDialog, isOpen: true });
                break;
            case 'file-upload':
                handleUploadFile();
                break;
            case 'basic-stats':
                handleBasicStats();
                break;
            case 'edit-columns':
                handleEditColumns();
                break;
            case 'add-columns':
                handleAddColumns();
                break;
            case 'drop-columns':
                handleDropColumns();
                break;
            case 'clean-data':
                // 데이터 정제는 하위 메뉴로 이동
                setSelectedAction('clean-data');
                break;
            case 'change-column-data':
                handleChangeColumnData();
                break;
            case 'column-operation':
                handleColumnOperation();
                break;
            case 'export-csv':
                handleExportCSV();
                break;
            case 'export-parquet':
                handleExportParquet();
                break;
            case 'remove-all-null-rows':
                handleRemoveAllNullRows();
                break;
            case 'remove-specific-column-null-rows':
                handleRemoveSpecificColumnNullRows();
                break;
            case 'copy-specific-column':
                handleCopySpecificColumn();
                break;
            case 'column-format-string':
                handleColumnFormatString();
                break;
            case 'column-calculation':
                handleColumnCalculationCopy();
                break;
            case 'rename-column':
                handleRenameColumn();
                break;
            case 'upload-to-huggingface':
                handleUploadToHuggingFace();
                break;
            case 'upload-to-mlflow':  // 새로 추가
                handleUploadToMLflow();
                break;
            case 'dataset-callback':
                handleDatasetCallback();
                break;
            case 'version-history':
                if (onVersionHistoryModal) {
                    onVersionHistoryModal();
                }
                break;
            case 'database-load':  // 추가
                if (onDatabaseLoadModal) {
                    onDatabaseLoadModal();
                }
                break;
            case 'database-auto-sync':  // ✨ 추가
                if (onDatabaseAutoSyncModal) {
                    onDatabaseAutoSyncModal();
                }
                break;
            default:
                showErrorToastKo('해당 기능은 추후 구현 예정입니다.');
        }
    };

    const handleBackToCategories = () => {
        if (selectedAction === 'edit-columns' || selectedAction === 'clean-data' || selectedAction === 'add-columns') {
            // 하위 메뉴에서 뒤로가기 시 카테고리로
            setSelectedCategory(null);
            setSelectedAction(null);
        } else {
            // 일반 액션에서 뒤로가기 시 카테고리로
            setSelectedCategory(null);
            setSelectedAction(null);
        }
    };

    const handleBackToActions = () => {
        // 하위 액션에서 상위 액션으로 돌아가기
        setSelectedAction(null);
    };

    const hasDataset = dataTableInfo && dataTableInfo.success && dataTableInfo.sample_count > 0;

    return (
        <div className={styles.sidebar}>
            <h3>데이터 관리</h3>

            {/* 뒤로가기 버튼 (액션 선택 시) */}
            {selectedCategory && (
                <div className={styles.backButton}>
                    <button
                        onClick={(selectedAction === 'edit-columns' || selectedAction === 'clean-data' || selectedAction === 'add-columns') ? handleBackToActions : handleBackToCategories}
                        className={styles.backBtn}
                    >
                        <IoChevronBack />
                        <span>{(selectedAction === 'edit-columns' || selectedAction === 'clean-data' || selectedAction === 'add-columns') ? '액션으로 돌아가기' : '카테고리로 돌아가기'}</span>
                    </button>
                </div>
            )}

            {/* 카테고리 선택 화면 */}
            {!selectedCategory && (
                <div className={styles.categoryGrid}>
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id)}
                            className={styles.categoryCard}
                        >
                            <div className={styles.categoryIcon}>
                                <category.icon />
                            </div>
                            <div className={styles.categoryContent}>
                                <h4>{category.title}</h4>
                                <p>{category.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* 액션 선택 화면 */}
            {selectedCategory && selectedAction !== 'edit-columns' && selectedAction !== 'clean-data' && selectedAction !== 'add-columns' && (
                <div className={styles.actionList}>
                    <h4 className={styles.actionTitle}>
                        {categories.find(c => c.id === selectedCategory)?.title}
                    </h4>
                    {getActionsForCategory(selectedCategory).map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleActionSelect(action.id)}
                            className={styles.actionButton}
                        >
                            <action.icon />
                            <div className={styles.actionContent}>
                                <span className={styles.actionName}>{action.title}</span>
                                <span className={styles.actionDesc}>{action.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* 편집 하위 메뉴 (컬럼 편집, 데이터 정제, 컬럼 추가) */}
            {(selectedAction === 'edit-columns' || selectedAction === 'clean-data' || selectedAction === 'add-columns') && (
                <div className={styles.actionList}>
                    <h4 className={styles.actionTitle}>
                        {selectedAction === 'edit-columns' ? '컬럼 편집 옵션' :
                         selectedAction === 'clean-data' ? '데이터 정제 옵션' :
                         '컬럼 추가 옵션'}
                    </h4>
                    {getEditDataSubActions().map((action) => (
                        <button
                            key={action.id}
                            onClick={() => handleActionSelect(action.id)}
                            className={styles.actionButton}
                        >
                            <action.icon />
                            <div className={styles.actionContent}>
                                <span className={styles.actionName}>{action.title}</span>
                                <span className={styles.actionDesc}>{action.description}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* 데이터셋 삭제 버튼 */}
            <div className={styles.deleteSection}>
                <button
                    onClick={handleDeleteFile}
                    disabled={!hasDataset}
                    className={`${styles.deleteButton} ${!hasDataset ? styles.disabled : ''}`}
                >
                    <IoTrash />
                    <span>Dataset Unload</span>
                </button>
            </div>
        </div>
    );
};

export default DataProcessorSidebar;
