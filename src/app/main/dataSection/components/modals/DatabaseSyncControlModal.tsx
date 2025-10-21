'use client';

import React, { useState, useEffect } from 'react';
import {
    FiX,
    FiRefreshCw,
    FiCheck,
    FiAlertCircle,
    FiClock,
    FiDatabase,
    FiPlay,
    FiPause,
    FiTrash2,
    FiLoader,
    FiActivity,  // ✨ 추가
    FiToggleLeft,  // ✨ 추가
    FiToggleRight,  // ✨ 추가
} from 'react-icons/fi';
import {
    getDBSyncStatus,
    pauseDBAutoSync,
    resumeDBAutoSync,
    removeDBAutoSync,
    triggerManualDBSync,
    updateMLflowConfig,  // ✨ 새 API 추가 (dataManagerAPI.js에 구현 필요)
} from '@/app/_common/api/dataManagerAPI';
import { showSuccessToastKo, showErrorToastKo, showDeleteConfirmToastKo } from '@/app/_common/utils/toastUtilsKo';
import styles from './assets/DatabaseSyncControlModal.module.scss';

interface DatabaseSyncControlModalProps {
    isOpen: boolean;
    managerId: string;
    onClose: () => void;
    onSuccess: () => void;
}

interface DBSyncStatus {
    sync_id: string;
    manager_id: string;
    enabled: boolean;
    db_type: string;
    db_host: string;
    db_name: string;
    db_username?: string;
    schedule_type: string;
    schedule_description?: string;
    interval_minutes?: number;
    cron_expression?: string;
    query?: string;
    table_name?: string;
    schema_name?: string;
    chunk_size?: number;
    detect_changes?: boolean;
    last_sync?: string;
    last_sync_status?: string;
    last_error?: string;
    sync_count: number;
    next_run_time?: string;
    created_at?: string;
    updated_at?: string;
    last_sync_info?: {
        last_sync_at?: string;
        last_sync_status?: string;
        sync_count: number;
        last_error?: string;
    };
    mlflow_info?: {
        mlflow_enabled: boolean;
        mlflow_experiment_name?: string;
        mlflow_tracking_uri?: string;
        mlflow_upload_count: number;
        last_mlflow_upload_at?: string;
        last_mlflow_run_id?: string;
        last_mlflow_error?: string;
        next_dataset_name?: string;
    };
}

const DatabaseSyncControlModal: React.FC<DatabaseSyncControlModalProps> = ({
    isOpen,
    managerId,
    onClose,
    onSuccess,
}) => {
    const [syncStatus, setSyncStatus] = useState<DBSyncStatus | null>(null);
    const [loading, setLoading] = useState(false);
    const [controlLoading, setControlLoading] = useState(false);
    const [mlflowToggling, setMlflowToggling] = useState(false);  // ✨ 추가

    useEffect(() => {
        if (isOpen) {
            loadSyncStatus();
        }
    }, [isOpen]);

    const loadSyncStatus = async () => {
        setLoading(true);
        try {
            const result = await getDBSyncStatus(managerId) as any;
            
            if (result.success && result.status) {
                setSyncStatus(result.status);
            } else {
                showErrorToastKo('동기화 설정을 찾을 수 없습니다.');
                onClose();
            }
        } catch (error) {
            showErrorToastKo('동기화 상태 조회 실패');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSync = async () => {
        if (!syncStatus) return;

        setControlLoading(true);
        try {
            let response;
            if (syncStatus.enabled) {
                response = await pauseDBAutoSync(managerId) as any;
                showSuccessToastKo('DB 자동 동기화가 일시 중지되었습니다.');
            } else {
                response = await resumeDBAutoSync(managerId) as any;
                showSuccessToastKo('DB 자동 동기화가 재개되었습니다.');
            }
            
            if (response.success && response.status) {
                setSyncStatus(response.status);
            } else {
                await loadSyncStatus();
            }
            onSuccess();
        } catch (error) {
            showErrorToastKo(`동기화 제어 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setControlLoading(false);
        }
    };

    const handleManualSync = async () => {
        if (!syncStatus) return;

        setControlLoading(true);
        try {
            showSuccessToastKo('수동 동기화를 시작합니다...');
            const result = await triggerManualDBSync(managerId) as any;
            
            if (result.success) {
                const syncResult = result.sync_result || {};
                const message = syncResult.status === 'success'
                    ? `수동 동기화가 완료되었습니다! (${syncResult.num_rows || 0}개 행, ${syncResult.duration_seconds?.toFixed(2) || 0}초)`
                    : syncResult.status === 'no_changes'
                    ? '데이터 변경사항이 없습니다.'
                    : `수동 동기화 실패: ${syncResult.message || '알 수 없는 오류'}`;
                
                if (syncResult.status === 'success' || syncResult.status === 'no_changes') {
                    showSuccessToastKo(message);
                } else {
                    showErrorToastKo(message);
                }
                
                await loadSyncStatus();
                onSuccess();
            } else {
                showErrorToastKo(result.message || '수동 동기화 실패');
            }
        } catch (error) {
            showErrorToastKo(`수동 동기화 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setControlLoading(false);
        }
    };

    const handleRemoveSync = () => {
        showDeleteConfirmToastKo({
            title: 'DB 자동 동기화 제거',
            message: '정말로 DB 자동 동기화 설정을 제거하시겠습니까?\n이 작업은 되돌릴 수 없습니다.',
            itemName: 'DB 자동 동기화',
            onConfirm: async () => {
                try {
                    await removeDBAutoSync(managerId);
                    showSuccessToastKo('DB 자동 동기화가 제거되었습니다.');
                    onSuccess();
                    onClose();
                } catch (error) {
                    showErrorToastKo(`동기화 제거 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                }
            },
            confirmText: '제거',
            cancelText: '취소',
        });
    };

    const formatLastSync = (lastSync?: string) => {
        if (!lastSync) return 'N/A';
        try {
            return new Date(lastSync).toLocaleString('ko-KR');
        } catch {
            return lastSync;
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'success':
                return styles.statusSuccess;
            case 'failed':
                return styles.statusError;
            case 'no_changes':
                return styles.statusNoChange;
            default:
                return '';
        }
    };

    const getStatusText = (status?: string) => {
        switch (status) {
            case 'success':
                return '성공';
            case 'failed':
                return '실패';
            case 'no_changes':
                return '변경사항 없음';
            default:
                return status || 'N/A';
        }
    };
    
    const handleToggleMLflow = async () => {
        if (!syncStatus || !syncStatus.mlflow_info) return;

        const currentStatus = syncStatus.mlflow_info.mlflow_enabled;
        const experimentName = syncStatus.mlflow_info.mlflow_experiment_name;

        // MLflow 활성화 시 실험 이름 확인
        if (!currentStatus && !experimentName) {
            showErrorToastKo('MLflow 실험 이름이 설정되지 않았습니다. 동기화를 다시 설정해주세요.');
            return;
        }

        setMlflowToggling(true);
        try {
            const response = await updateMLflowConfig(
                managerId,
                !currentStatus,
                experimentName ?? '',
                syncStatus.mlflow_info.mlflow_tracking_uri ?? ''
            ) as any;

            if (response.success) {
                showSuccessToastKo(
                    !currentStatus 
                        ? 'MLflow 자동 업로드가 활성화되었습니다.' 
                        : 'MLflow 자동 업로드가 비활성화되었습니다.'
                );
                await loadSyncStatus();
                onSuccess();
            } else {
                showErrorToastKo(response.message || 'MLflow 설정 변경 실패');
            }
        } catch (error) {
            showErrorToastKo(`MLflow 설정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        } finally {
            setMlflowToggling(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                {/* Header */}
                <div className={styles.modalHeader}>
                    <div className={styles.headerTitle}>
                        <FiRefreshCw />
                        <h2>DB 자동 동기화 관리</h2>
                    </div>
                    <button onClick={onClose} className={styles.closeButton} aria-label="Close">
                        <FiX />
                    </button>
                </div>

                {/* Body */}
                <div className={styles.modalBody}>
                    {loading ? (
                        <div className={styles.loadingState}>
                            <FiLoader className={styles.spinning} />
                            <p>동기화 상태를 불러오는 중...</p>
                        </div>
                    ) : syncStatus ? (
                        <>
                            {/* Status Banner */}
                            <div className={`${styles.statusBanner} ${syncStatus.enabled ? styles.active : styles.paused}`}>
                                {syncStatus.enabled ? (
                                    <>
                                        <FiPlay />
                                        <span>동기화 활성 중</span>
                                    </>
                                ) : (
                                    <>
                                        <FiPause />
                                        <span>동기화 일시 중지됨</span>
                                    </>
                                )}
                            </div>

                            {/* Sync Info */}
                            <div className={styles.infoSection}>
                                <h3>
                                    <FiDatabase />
                                    데이터베이스 정보
                                </h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>DB 타입</span>
                                        <span className={styles.value}>{syncStatus.db_type.toUpperCase()}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>호스트</span>
                                        <span className={styles.value}>{syncStatus.db_host || 'N/A'}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>데이터베이스</span>
                                        <span className={styles.value}>{syncStatus.db_name}</span>
                                    </div>
                                    {syncStatus.db_username && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>사용자명</span>
                                            <span className={styles.value}>{syncStatus.db_username}</span>
                                        </div>
                                    )}
                                    {syncStatus.schema_name && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>스키마</span>
                                            <span className={styles.value}>{syncStatus.schema_name}</span>
                                        </div>
                                    )}
                                    {syncStatus.table_name && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>테이블</span>
                                            <span className={styles.value}>{syncStatus.table_name}</span>
                                        </div>
                                    )}
                                    {syncStatus.query && (
                                        <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                            <span className={styles.label}>SQL 쿼리</span>
                                            <code className={styles.query}>{syncStatus.query}</code>
                                        </div>
                                    )}
                                    {syncStatus.chunk_size && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>청크 크기</span>
                                            <span className={styles.value}>{syncStatus.chunk_size.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Schedule Info */}
                            <div className={styles.infoSection}>
                                <h3>
                                    <FiClock />
                                    스케줄 정보
                                </h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>스케줄 타입</span>
                                        <span className={styles.value}>
                                            {syncStatus.schedule_type === 'interval' ? '주기적 간격' : 'Cron 표현식'}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>설정</span>
                                        <span className={styles.value}>
                                            {syncStatus.schedule_description || (
                                                syncStatus.schedule_type === 'interval'
                                                    ? `${syncStatus.interval_minutes}분마다`
                                                    : syncStatus.cron_expression
                                            )}
                                        </span>
                                    </div>
                                    {syncStatus.next_run_time && syncStatus.enabled && (
                                        <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                            <span className={styles.label}>다음 실행</span>
                                            <span className={styles.value}>
                                                {formatLastSync(syncStatus.next_run_time)}
                                            </span>
                                        </div>
                                    )}
                                    {syncStatus.detect_changes !== undefined && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>변경 감지</span>
                                            <span className={styles.value}>
                                                {syncStatus.detect_changes ? '활성화' : '비활성화'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* ✨ MLflow Info Section */}
                            {syncStatus.mlflow_info && (
                                <div className={styles.infoSection}>
                                    <h3>
                                        <FiActivity />
                                        MLflow 자동 업로드
                                    </h3>
                                    <div className={styles.infoGrid}>
                                        <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                            <div className={styles.mlflowToggleRow}>
                                                <span className={styles.label}>MLflow 업로드 상태</span>
                                                <button
                                                    onClick={handleToggleMLflow}
                                                    disabled={mlflowToggling}
                                                    className={`${styles.mlflowToggleButton} ${syncStatus.mlflow_info.mlflow_enabled ? styles.mlflowActive : styles.mlflowInactive}`}
                                                >
                                                    {mlflowToggling ? (
                                                        <FiLoader className={styles.spinning} />
                                                    ) : syncStatus.mlflow_info.mlflow_enabled ? (
                                                        <FiToggleRight />
                                                    ) : (
                                                        <FiToggleLeft />
                                                    )}
                                                    <span>
                                                        {syncStatus.mlflow_info.mlflow_enabled ? '활성화' : '비활성화'}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>

                                        {syncStatus.mlflow_info.mlflow_enabled && (
                                            <>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.label}>실험 이름</span>
                                                    <span className={styles.value}>
                                                        {syncStatus.mlflow_info.mlflow_experiment_name || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className={styles.infoItem}>
                                                    <span className={styles.label}>업로드 횟수</span>
                                                    <span className={styles.value}>
                                                        {syncStatus.mlflow_info.mlflow_upload_count}회
                                                    </span>
                                                </div>
                                                <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                                    <span className={styles.label}>다음 데이터셋 이름</span>
                                                    <span className={styles.value}>
                                                        {syncStatus.mlflow_info.next_dataset_name || 'N/A'}
                                                    </span>
                                                </div>
                                                {syncStatus.mlflow_info.mlflow_tracking_uri && (
                                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                                        <span className={styles.label}>Tracking URI</span>
                                                        <span className={styles.value}>
                                                            {syncStatus.mlflow_info.mlflow_tracking_uri}
                                                        </span>
                                                    </div>
                                                )}
                                                {syncStatus.mlflow_info.last_mlflow_upload_at && (
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.label}>마지막 업로드</span>
                                                        <span className={styles.value}>
                                                            {formatLastSync(syncStatus.mlflow_info.last_mlflow_upload_at)}
                                                        </span>
                                                    </div>
                                                )}
                                                {syncStatus.mlflow_info.last_mlflow_run_id && (
                                                    <div className={styles.infoItem}>
                                                        <span className={styles.label}>마지막 Run ID</span>
                                                        <span className={styles.value}>
                                                            {syncStatus.mlflow_info.last_mlflow_run_id.substring(0, 12)}...
                                                        </span>
                                                    </div>
                                                )}
                                                {syncStatus.mlflow_info.last_mlflow_error && (
                                                    <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                                        <span className={styles.label}>마지막 업로드 에러</span>
                                                        <span className={`${styles.value} ${styles.errorText}`}>
                                                            {syncStatus.mlflow_info.last_mlflow_error}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {!syncStatus.mlflow_info.mlflow_enabled && (
                                            <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                                <div className={styles.mlflowDisabledNote}>
                                                    <FiAlertCircle />
                                                    <span>
                                                        MLflow 자동 업로드가 비활성화되어 있습니다.
                                                        <br />
                                                        위 토글 버튼으로 활성화할 수 있습니다.
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Sync History */}
                            <div className={styles.infoSection}>
                                <h3>
                                    <FiCheck />
                                    동기화 이력
                                </h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>총 동기화 횟수</span>
                                        <span className={styles.value}>{syncStatus.sync_count}회</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.label}>마지막 동기화</span>
                                        <span className={styles.value}>{formatLastSync(syncStatus.last_sync)}</span>
                                    </div>
                                    {syncStatus.last_sync_status && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>마지막 상태</span>
                                            <span className={`${styles.value} ${getStatusColor(syncStatus.last_sync_status)}`}>
                                                {getStatusText(syncStatus.last_sync_status)}
                                            </span>
                                        </div>
                                    )}
                                    {syncStatus.created_at && (
                                        <div className={styles.infoItem}>
                                            <span className={styles.label}>생성 시간</span>
                                            <span className={styles.value}>{formatLastSync(syncStatus.created_at)}</span>
                                        </div>
                                    )}
                                    {syncStatus.last_error && (
                                        <div className={`${styles.infoItem} ${styles.fullWidth}`}>
                                            <span className={styles.label}>마지막 에러</span>
                                            <span className={`${styles.value} ${styles.errorText}`}>
                                                {syncStatus.last_error}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className={styles.errorState}>
                            <FiAlertCircle />
                            <p>동기화 정보를 불러올 수 없습니다.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {syncStatus && (
                    <div className={styles.modalFooter}>
                        <button
                            onClick={handleToggleSync}
                            disabled={controlLoading}
                            className={`${styles.actionButton} ${syncStatus.enabled ? styles.pauseButton : styles.playButton}`}
                        >
                            {controlLoading ? (
                                <>
                                    <FiLoader className={styles.spinning} />
                                    처리 중...
                                </>
                            ) : syncStatus.enabled ? (
                                <>
                                    <FiPause />
                                    일시 중지
                                </>
                            ) : (
                                <>
                                    <FiPlay />
                                    재개
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleManualSync}
                            disabled={controlLoading}
                            className={styles.actionButton}
                        >
                            {controlLoading ? (
                                <>
                                    <FiLoader className={styles.spinning} />
                                    실행 중...
                                </>
                            ) : (
                                <>
                                    <FiRefreshCw />
                                    수동 실행
                                </>
                            )}
                        </button>

                        <button
                            onClick={handleRemoveSync}
                            disabled={controlLoading}
                            className={`${styles.actionButton} ${styles.dangerButton}`}
                        >
                            <FiTrash2 />
                            동기화 제거
                        </button>

                        <button onClick={onClose} className={styles.closeFooterButton}>
                            닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DatabaseSyncControlModal;