// /components/modals/DatasetVersionSwitchModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { IoClose, IoCheckmark, IoLayers, IoCloudDownload, IoDocumentText } from 'react-icons/io5';
import { getAvailableDatasetVersions, switchDatasetVersion } from '@/app/_common/api/dataManagerAPI';
import { showSuccessToastKo, showErrorToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from './assets/DatasetVersionSwitchModal.module.scss';

interface DatasetVersion {
    version: number;
    dataset_id: string;
    source_type: string;
    loaded_at: string;
    num_rows?: number;
    num_columns?: number;
    is_current: boolean;
    repo_id?: string;
    filenames?: string[];
}

interface DatasetVersionSwitchModalProps {
    isOpen: boolean;
    managerId: string;
    onClose: () => void;
    onSwitch?: () => void;
}

interface DatasetVersionsResponse {
    versions?: any[]; // 필요한 타입으로 교체
    current_viewing_version?: number;
  }

const DatasetVersionSwitchModal: React.FC<DatasetVersionSwitchModalProps> = ({
    isOpen,
    managerId,
    onClose,
    onSwitch
}) => {
    const [versions, setVersions] = useState<DatasetVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<number>(0);

    useEffect(() => {
        if (isOpen && managerId) {
            loadVersions();
        }
    }, [isOpen, managerId]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = await getAvailableDatasetVersions(managerId) as DatasetVersionsResponse;
            setVersions(data.versions ?? []);
            setCurrentVersion(data.current_viewing_version ?? 0);
        } catch (error) {
            showErrorToastKo(`버전 목록 로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSwitchVersion = async (versionNumber: number) => {
        if (versionNumber === currentVersion) {
            showErrorToastKo('이미 선택된 버전입니다.');
            return;
        }

        setSwitching(true);
        try {
            showSuccessToastKo(`버전 ${versionNumber}로 전환하는 중...`);
            
            await switchDatasetVersion(managerId, versionNumber);
            
            showSuccessToastKo(`버전 ${versionNumber}로 성공적으로 전환되었습니다!`);
            
            if (onSwitch) {
                onSwitch();
            }
            onClose();
        } catch (error) {
            showErrorToastKo(`버전 전환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setSwitching(false);
        }
    };

    const getSourceIcon = (sourceType: string) => {
        return sourceType === 'huggingface' ? <IoCloudDownload /> : <IoDocumentText />;
    };

    const getSourceLabel = (sourceType: string) => {
        return sourceType === 'huggingface' ? 'HuggingFace' : '로컬 파일';
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>
                        <IoLayers />
                        데이터셋 버전 선택
                    </h2>
                    <button onClick={onClose} className={styles.closeButton}>
                        <IoClose />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.loading}>버전 목록을 불러오는 중...</div>
                    ) : versions.length === 0 ? (
                        <div className={styles.noVersions}>사용 가능한 버전이 없습니다.</div>
                    ) : (
                        <div className={styles.versionList}>
                            {versions.map((version) => (
                                <div
                                    key={version.version}
                                    className={`${styles.versionCard} ${
                                        version.is_current ? styles.current : ''
                                    }`}
                                    onClick={() => !switching && handleSwitchVersion(version.version)}
                                >
                                    <div className={styles.versionHeader}>
                                        <div className={styles.versionInfo}>
                                            <span className={styles.versionNumber}>
                                                v{version.version}
                                                {version.version === 1 && ' (초기)'}
                                            </span>
                                            {version.is_current && (
                                                <span className={styles.currentBadge}>
                                                    <IoCheckmark />
                                                    현재 버전
                                                </span>
                                            )}
                                        </div>
                                        <div className={styles.sourceType}>
                                            {getSourceIcon(version.source_type)}
                                            {getSourceLabel(version.source_type)}
                                        </div>
                                    </div>

                                    <div className={styles.versionDetails}>
                                        {version.repo_id && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.label}>리포지토리:</span>
                                                <span className={styles.value}>{version.repo_id}</span>
                                            </div>
                                        )}
                                        {version.filenames && version.filenames.length > 0 && (
                                            <div className={styles.detailRow}>
                                                <span className={styles.label}>파일:</span>
                                                <span className={styles.value}>
                                                    {version.filenames.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>행/열:</span>
                                            <span className={styles.value}>
                                                {version.num_rows?.toLocaleString() || 'N/A'} 행 × {version.num_columns || 'N/A'} 열
                                            </span>
                                        </div>
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>로드 시간:</span>
                                            <span className={styles.value}>
                                                {new Date(version.loaded_at).toLocaleString('ko-KR')}
                                            </span>
                                        </div>
                                    </div>

                                    {!version.is_current && (
                                        <div className={styles.switchButton}>
                                            이 버전으로 전환
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.cancelButton} disabled={switching}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DatasetVersionSwitchModal;