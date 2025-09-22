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
} from 'react-icons/io5';
import { MdDataset } from 'react-icons/md';
import { showErrorToastKo, showSuccessToastKo } from '@/app/_common/utils/toastUtilsKo';
import { removeDataset, uploadLocalDataset, exportDatasetAsCSV, exportDatasetAsParquet, getDatasetStatistics } from '@/app/_common/api/dataManagerAPI';
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
}

type CategoryType = 'load' | 'analyze' | 'edit' | 'save';
type ActionType = 'huggingface' | 'file-upload' | 'basic-stats' | 'edit-data' | 'export-csv' | 'export-parquet' | null;

const DataProcessorSidebar: React.FC<DataProcessorSidebarProps> = ({
    managerId,
    userId,
    dataTableInfo,
    downloadDialog,
    setDownloadDialog,
    onDataReload,
    onStatisticsModal,
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
                    }
                ];
            case 'analyze':
                return [
                    {
                        id: 'basic-stats' as ActionType,
                        title: '기본 통계',
                        icon: IoAnalytics,
                        description: '데이터셋 기본 통계 정보'
                    }
                ];
            case 'edit':
                return [
                    {
                        id: 'edit-data' as ActionType,
                        title: '데이터 편집',
                        icon: IoCreate,
                        description: '데이터 행/열 편집'
                    }
                ];
            case 'save':
                return [
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

    const handleEditData = async () => {
        // TODO: 데이터 편집 로직 구현
        showErrorToastKo('데이터 편집 기능은 추후 구현 예정입니다.');
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

        // 확인 다이얼로그
        const confirmDelete = window.confirm(
            '정말로 현재 데이터셋을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.'
        );

        if (!confirmDelete) {
            return;
        }

        try {
            await removeDataset(managerId);
            showSuccessToastKo('데이터셋이 성공적으로 삭제되었습니다!');
            onDataReload();
        } catch (error) {
            console.error('Dataset deletion failed:', error);
            showErrorToastKo(`데이터셋 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
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
            case 'edit-data':
                handleEditData();
                break;
            case 'export-csv':
                handleExportCSV();
                break;
            case 'export-parquet':
                handleExportParquet();
                break;
            default:
                showErrorToastKo('해당 기능은 추후 구현 예정입니다.');
        }
    };

    const handleBackToCategories = () => {
        setSelectedCategory(null);
        setSelectedAction(null);
    };

    const hasDataset = dataTableInfo && dataTableInfo.success && dataTableInfo.sample_count > 0;

    return (
        <div className={styles.sidebar}>
            <h3>데이터 관리</h3>

            {/* 뒤로가기 버튼 (액션 선택 시) */}
            {selectedCategory && (
                <div className={styles.backButton}>
                    <button onClick={handleBackToCategories} className={styles.backBtn}>
                        <IoChevronBack />
                        <span>카테고리로 돌아가기</span>
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
            {selectedCategory && (
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

            {/* 데이터셋 삭제 버튼 */}
            <div className={styles.deleteSection}>
                <button
                    onClick={handleDeleteFile}
                    disabled={!hasDataset}
                    className={`${styles.deleteButton} ${!hasDataset ? styles.disabled : ''}`}
                >
                    <IoTrash />
                    <span>데이터셋 삭제</span>
                </button>
            </div>
        </div>
    );
};

export default DataProcessorSidebar;
