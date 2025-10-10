'use client';

import React from 'react';
import { FiDownloadCloud, FiRefreshCw } from 'react-icons/fi';
import styles from '../MlModelWorkspace.module.scss';
import ModelRegistryPanel from './ModelRegistryPanel';
import MlModelDeleteDialogContainer from './MlModelDeleteDialogContainer';
import ModelStageDialogContainer from './ModelStageDialogContainer';
import { useMlModelWorkspace } from '../MlModelWorkspaceContext';

const MlModelHubView: React.FC = () => {
    const {
        models,
        selectedModelId,
        setSelectedModelId,
        openDeleteDialog,
        fetchModels,
        isLoadingList,
        listError,
        syncArtifacts,
        isSyncing,
        syncMessage,
        syncError,
    } = useMlModelWorkspace();

    const totalModelCount = models.length;
    const groupCount = React.useMemo(() => {
        if (models.length === 0) {
            return 0;
        }
        const groups = new Set<string>();
        models.forEach(model => {
            const key = model.mlflow_metadata?.registered_model_name || model.model_name;
            groups.add(key);
        });
        return groups.size;
    }, [models]);

    const selectedModel = selectedModelId
        ? models.find(model => model.model_id === selectedModelId) ?? null
        : null;
    const selectedVersion = selectedModel?.mlflow_metadata?.model_version ?? selectedModel?.model_version ?? null;

    const statusMessages: Array<{ id: string; type: 'info' | 'error'; text: string }> = [];

    if (isLoadingList) {
        statusMessages.push({ id: 'loading', type: 'info', text: '모델 목록을 불러오는 중입니다…' });
    }

    if (listError) {
        statusMessages.push({ id: 'list-error', type: 'error', text: `모델 목록을 불러오는데 실패했습니다: ${listError}` });
    }

    if (isSyncing) {
        statusMessages.push({ id: 'syncing', type: 'info', text: '아티팩트 동기화 중입니다…' });
    }

    if (syncError) {
        statusMessages.push({ id: 'sync-error', type: 'error', text: `아티팩트 동기화에 실패했습니다: ${syncError}` });
    }

    if (syncMessage) {
        statusMessages.push({ id: 'sync-message', type: 'info', text: syncMessage });
    }

    const hasErrors = statusMessages.some(entry => entry.type === 'error');
    const fetchLabel = isLoadingList ? '불러오는 중…' : '모델 목록 불러오기';
    const syncLabel = isSyncing ? '동기화 중…' : '아티팩트 동기화';

    return (
        <div className={styles.hubWrapper}>
            <div className={styles.hubUtilityRow}>
                <div className={styles.hubSummary}>
                    <span className={styles.summaryBadge}>총 {totalModelCount}개 모델</span>
                    <span className={styles.summaryBadge}>그룹 {groupCount}개</span>
                    {selectedModel ? (
                        <span className={`${styles.summaryBadge} ${styles.summaryActive}`}>
                            선택 {selectedModel.model_name}
                            {selectedVersion ? ` v${selectedVersion}` : ''}
                        </span>
                    ) : (
                        <span className={`${styles.summaryBadge} ${styles.summaryMuted}`}>
                            선택된 모델 없음
                        </span>
                    )}
                </div>
                <div className={styles.hubActions}>
                    <button
                        type="button"
                        onClick={() => { void fetchModels(); }}
                        disabled={isLoadingList}
                        className={`${styles.actionButton} ${styles.secondaryAction}`}
                    >
                        <FiDownloadCloud
                            aria-hidden="true"
                            className={`${styles.actionIcon} ${isLoadingList ? styles.spinningIcon : ''}`}
                        />
                        <span>{fetchLabel}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { void syncArtifacts(); }}
                        disabled={isSyncing || isLoadingList}
                        className={`${styles.actionButton} ${styles.primaryAction}`}
                    >
                        <FiRefreshCw
                            aria-hidden="true"
                            className={`${styles.actionIcon} ${isSyncing ? styles.spinningIcon : ''}`}
                        />
                        <span>{syncLabel}</span>
                    </button>
                </div>
            </div>

            {statusMessages.length > 0 ? (
                <div
                    className={styles.statusBanner}
                    role={hasErrors ? 'alert' : 'status'}
                    aria-live="polite"
                >
                    {statusMessages.map(entry => (
                        <p
                            key={entry.id}
                            className={entry.type === 'error' ? styles.statusError : styles.statusInfo}
                        >
                            {entry.text}
                        </p>
                    ))}
                </div>
            ) : null}

            <ModelRegistryPanel
                models={models}
                selectedModelId={selectedModelId}
                onSelect={setSelectedModelId}
                onDelete={openDeleteDialog}
                className={styles.hubRegistry}
            />
            <MlModelDeleteDialogContainer />
            <ModelStageDialogContainer />
        </div>
    );
};

export default MlModelHubView;
