'use client';

import React from 'react';
import styles from './MlModelWorkspace.module.scss';
import { useMlModelWorkspace } from './MlModelWorkspaceContext';

interface MlModelToolbarProps {
    showActions?: boolean;
}

const MlModelToolbar: React.FC<MlModelToolbarProps> = ({ showActions = true }) => {
    const {
        baseUrl,
        setBaseUrl,
        isLoadingList,
        fetchModels,
        isSyncing,
        syncArtifacts,
        listError,
        syncError,
        syncMessage,
    } = useMlModelWorkspace();

    return (
        <div className={styles.toolbar}>
            <div className={styles.toolbarField}>
                <label htmlFor="ml-workspace-base-url">Backend Base URL</label>
                <input
                    id="ml-workspace-base-url"
                    type="text"
                    value={baseUrl}
                    onChange={event => setBaseUrl(event.target.value)}
                    placeholder="예: http://localhost:8001"
                />
                <small>기본값은 환경 변수에 설정된 API_CONFIG.BASE_URL입니다.</small>
            </div>
            {showActions ? (
                <div className={styles.toolbarActions}>
                    <button type="button" onClick={fetchModels} disabled={isLoadingList}>
                        {isLoadingList ? '목록 불러오는 중...' : '모델 목록 불러오기'}
                    </button>
                    <button type="button" onClick={syncArtifacts} disabled={isSyncing || isLoadingList}>
                        {isSyncing ? '동기화 중...' : '아티팩트 동기화'}
                    </button>
                </div>
            ) : null}
            <div className={styles.statusArea}>
                {listError ? <p className={styles.statusError}>목록 오류: {listError}</p> : null}
                {syncError ? <p className={styles.statusError}>동기화 오류: {syncError}</p> : null}
                {syncMessage ? <p className={styles.statusInfo}>{syncMessage}</p> : null}
            </div>
        </div>
    );
};

export default MlModelToolbar;
