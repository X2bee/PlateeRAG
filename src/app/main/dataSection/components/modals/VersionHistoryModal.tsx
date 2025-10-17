// /components/modals/VersionHistoryModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    IoClose,
    IoTimeOutline,
    IoGitBranch,
    IoRefresh,
    IoArrowBack,
    IoGitCompare,
} from 'react-icons/io5';
import { getVersionHistory, rollbackToVersion, compareVersions } from '@/app/_common/api/dataManagerAPI';
import { showSuccessToastKo, showErrorToastKo, showDeleteConfirmToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from './assets/VersionHistoryModal.module.scss';

interface VersionInfo {
    version: number;
    operation: string;
    timestamp: string;
    minio_path: string | null;
    checksum: string;
    num_rows: number;
    num_columns: number;
    columns: string[];
    metadata: any;
}

interface VersionHistoryData {
    success: boolean;
    manager_id: string;
    current_version: number;
    total_versions: number;
    source_info: any;
    version_history: VersionInfo[];
    lineage: any;
}

interface VersionHistoryModalProps {
    isOpen: boolean;
    managerId: string;
    onClose: () => void;
    onRollback?: () => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    isOpen,
    managerId,
    onClose,
    onRollback
}) => {
    const [versionHistory, setVersionHistory] = useState<VersionHistoryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
    const [compareResult, setCompareResult] = useState<any>(null);

    useEffect(() => {
        if (isOpen && managerId) {
            loadVersionHistory();
        }
    }, [isOpen, managerId]);

    const loadVersionHistory = async () => {
        setLoading(true);
        try {
            const data = await getVersionHistory(managerId);
            setVersionHistory(data as VersionHistoryData);
        } catch (error) {
            showErrorToastKo(`버전 이력 조회 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRollback = (version: number) => {
        showDeleteConfirmToastKo({
            title: '버전 롤백',
            message: `버전 ${version}으로 롤백하시겠습니까?\n현재 데이터가 해당 버전의 상태로 복원됩니다.`,
            itemName: `버전 ${version}`,
            onConfirm: async () => {
                try {
                    showSuccessToastKo(`버전 ${version}으로 롤백하는 중...`);
                    await rollbackToVersion(managerId, version);
                    showSuccessToastKo(`버전 ${version}으로 성공적으로 롤백되었습니다!`);
                    
                    if (onRollback) {
                        onRollback();
                    }
                    onClose();
                } catch (error) {
                    showErrorToastKo(`롤백 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                }
            },
            confirmText: '롤백',
            cancelText: '취소'
        });
    };

    const handleVersionSelect = (version: number) => {
        if (selectedVersions.includes(version)) {
            setSelectedVersions(selectedVersions.filter(v => v !== version));
        } else if (selectedVersions.length < 2) {
            setSelectedVersions([...selectedVersions, version]);
        } else {
            setSelectedVersions([selectedVersions[1], version]);
        }
        setCompareResult(null);
    };

    const handleCompare = async () => {
        if (selectedVersions.length !== 2) {
            showErrorToastKo('비교할 두 개의 버전을 선택해주세요.');
            return;
        }

        try {
            const [v1, v2] = selectedVersions.sort((a, b) => a - b);
            const result = await compareVersions(managerId, v1, v2);
            setCompareResult(result);
        } catch (error) {
            showErrorToastKo(`버전 비교 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        }
    };

    const getOperationIcon = (operation: string) => {
        switch (operation) {
            case 'initial_load':
                return '📥';
            case 'drop_columns':
                return '🗑️';
            case 'replace_values':
                return '✏️';
            case 'apply_operation':
                return '🔢';
            case 'remove_null_rows':
                return '🧹';
            case 'copy_column':
                return '📋';
            case 'rename_column':
                return '✒️';
            case 'format_columns':
                return '📝';
            case 'calculate_columns':
                return '🧮';
            case 'execute_callback':
                return '⚙️';
            default:
                return '📄';
        }
    };

    const getOperationLabel = (operation: string) => {
        const labels: Record<string, string> = {
            'initial_load': '초기 로드',
            'drop_columns': '컬럼 삭제',
            'replace_values': '값 교체',
            'apply_operation': '연산 적용',
            'remove_null_rows': 'NULL 제거',
            'copy_column': '컬럼 복사',
            'rename_column': '컬럼 이름 변경',
            'format_columns': '컬럼 포맷팅',
            'calculate_columns': '컬럼 연산',
            'execute_callback': '콜백 실행'
        };
        return labels[operation] || operation;
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>
                        <IoGitBranch />
                        버전 이력
                    </h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <IoClose />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.loading}>버전 이력을 불러오는 중...</div>
                    ) : versionHistory ? (
                        <>
                            {/* 요약 정보 */}
                            <div className={styles.summaryCard}>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>현재 버전:</span>
                                    <span className={styles.value}>v{versionHistory.current_version}</span>
                                </div>
                                <div className={styles.summaryItem}>
                                    <span className={styles.label}>총 버전 수:</span>
                                    <span className={styles.value}>{versionHistory.total_versions}</span>
                                </div>
                                {versionHistory.source_info && (
                                    <div className={styles.summaryItem}>
                                        <span className={styles.label}>원본 소스:</span>
                                        <span className={styles.value}>
                                            {versionHistory.source_info.type === 'huggingface' 
                                                ? versionHistory.source_info.repo_id 
                                                : '로컬 파일'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 비교 버튼 */}
                            {selectedVersions.length === 2 && (
                                <div className={styles.compareSection}>
                                    <button 
                                        onClick={handleCompare}
                                        className={styles.compareButton}
                                    >
                                        <IoGitCompare />
                                        버전 {selectedVersions[0]}과 {selectedVersions[1]} 비교
                                    </button>
                                </div>
                            )}

                            {/* 비교 결과 */}
                            {compareResult && (
                                <div className={styles.compareResult}>
                                    <h3>버전 비교 결과</h3>
                                    <div className={styles.comparisonGrid}>
                                        <div className={styles.versionColumn}>
                                            <h4>버전 {compareResult.comparison.version1.version}</h4>
                                            <p>작업: {getOperationLabel(compareResult.comparison.version1.operation)}</p>
                                            <p>행: {compareResult.comparison.version1.rows.toLocaleString()}</p>
                                            <p>컬럼: {compareResult.comparison.version1.columns}</p>
                                        </div>
                                        <div className={styles.diffColumn}>
                                            <h4>차이</h4>
                                            <p>행: {compareResult.comparison.differences.rows_diff >= 0 ? '+' : ''}{compareResult.comparison.differences.rows_diff.toLocaleString()}</p>
                                            <p>컬럼: {compareResult.comparison.differences.columns_diff >= 0 ? '+' : ''}{compareResult.comparison.differences.columns_diff}</p>
                                            {compareResult.comparison.differences.columns_added.length > 0 && (
                                                <p>추가된 컬럼: {compareResult.comparison.differences.columns_added.join(', ')}</p>
                                            )}
                                            {compareResult.comparison.differences.columns_removed.length > 0 && (
                                                <p>삭제된 컬럼: {compareResult.comparison.differences.columns_removed.join(', ')}</p>
                                            )}
                                        </div>
                                        <div className={styles.versionColumn}>
                                            <h4>버전 {compareResult.comparison.version2.version}</h4>
                                            <p>작업: {getOperationLabel(compareResult.comparison.version2.operation)}</p>
                                            <p>행: {compareResult.comparison.version2.rows.toLocaleString()}</p>
                                            <p>컬럼: {compareResult.comparison.version2.columns}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 버전 목록 */}
                            <div className={styles.versionList}>
                                {versionHistory.version_history.map((version) => (
                                    <div 
                                        key={version.version} 
                                        className={`${styles.versionCard} ${
                                            selectedVersions.includes(version.version) ? styles.selected : ''
                                        } ${
                                            version.version === versionHistory.current_version - 1 ? styles.current : ''
                                        }`}
                                        onClick={() => handleVersionSelect(version.version)}
                                    >
                                        <div className={styles.versionHeader}>
                                            <div className={styles.versionInfo}>
                                                <span className={styles.versionNumber}>
                                                    {getOperationIcon(version.operation)} v{version.version}
                                                </span>
                                                <span className={styles.operation}>
                                                    {getOperationLabel(version.operation)}
                                                </span>
                                                {version.version === versionHistory.current_version - 1 && (
                                                    <span className={styles.currentBadge}>현재</span>
                                                )}
                                            </div>
                                            <span className={styles.timestamp}>
                                                <IoTimeOutline />
                                                {new Date(version.timestamp).toLocaleString('ko-KR')}
                                            </span>
                                        </div>
                                        
                                        <div className={styles.versionDetails}>
                                            <div className={styles.detailRow}>
                                                <span>행: {version.num_rows.toLocaleString()}</span>
                                                <span>컬럼: {version.num_columns}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.checksum}>
                                                    체크섬: {version.checksum.substring(0, 16)}...
                                                </span>
                                            </div>
                                            {version.metadata && Object.keys(version.metadata).length > 0 && (
                                                <div className={styles.metadata}>
                                                    {JSON.stringify(version.metadata, null, 2)}
                                                </div>
                                            )}
                                        </div>

                                        {version.version !== versionHistory.current_version - 1 && (
                                            <div className={styles.versionActions}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRollback(version.version);
                                                    }}
                                                    className={styles.rollbackButton}
                                                >
                                                    <IoArrowBack />
                                                    이 버전으로 롤백
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className={styles.noData}>버전 이력이 없습니다.</div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={loadVersionHistory} className={styles.refreshButton}>
                        <IoRefresh />
                        새로고침
                    </button>
                    <button onClick={onClose} className={styles.cancelButton}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VersionHistoryModal;