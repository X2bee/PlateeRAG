'use client';

import React from 'react';
import styles from './MlModelWorkspace.module.scss';
import { useMlModelWorkspace } from './MlModelWorkspaceContext';

export const MlModelHeaderActions: React.FC = () => {
    const { isLoadingList, fetchModels, isSyncing, syncArtifacts } = useMlModelWorkspace();

    return (
        <div className={styles.toolbarActions}>
            <button type="button" onClick={fetchModels} disabled={isLoadingList}>
                {isLoadingList ? '목록 불러오는 중...' : '모델 목록 불러오기'}
            </button>
            <button type="button" onClick={syncArtifacts} disabled={isSyncing || isLoadingList}>
                {isSyncing ? '동기화 중...' : '아티팩트 동기화'}
            </button>
        </div>
    );
};

const MlModelStatusBanner: React.FC = () => {
    const { listError, syncError, syncMessage } = useMlModelWorkspace();

    if (!listError && !syncError && !syncMessage) {
        return null;
    }

    return (
        <div className={styles.statusBanner}>
            <div className={styles.statusArea}>
                {listError ? <p className={styles.statusError}>목록 오류: {listError}</p> : null}
                {syncError ? <p className={styles.statusError}>동기화 오류: {syncError}</p> : null}
                {syncMessage ? <p className={styles.statusInfo}>{syncMessage}</p> : null}
            </div>
        </div>
    );
};

export default MlModelStatusBanner;
