'use client';

import React from 'react';
import styles from './MlModelWorkspace.module.scss';
import ModelRegistryPanel from './ModelRegistryPanel';
import ModelDetailPanel from './ModelDetailPanel';
import MlModelDeleteDialogContainer from './MlModelDeleteDialogContainer';
import { useMlModelWorkspace } from './MlModelWorkspaceContext';

const MlModelHubView: React.FC = () => {
    const {
        models,
        selectedModelId,
        setSelectedModelId,
        openDeleteDialog,
        modelDetail,
        detailLoading,
        detailError,
        fetchModelDetail,
    } = useMlModelWorkspace();

    return (
        <div className={styles.workspaceGrid}>
            <div className={styles.twoColumn}>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>모델 허브</h2>
                    <p className={styles.sectionDescription}>
                        저장된 모델을 관리하고 메타데이터를 확인하거나 삭제할 수 있습니다.
                    </p>
                    <ModelRegistryPanel
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelect={setSelectedModelId}
                        onDelete={openDeleteDialog}
                    />
                </section>
                <section className={styles.sectionCard}>
                    <ModelDetailPanel
                        model={modelDetail}
                        isLoading={detailLoading}
                        errorMessage={detailError}
                        onRefetch={selectedModelId ? () => fetchModelDetail(selectedModelId) : undefined}
                    />
                </section>
            </div>
            <MlModelDeleteDialogContainer />
        </div>
    );
};

export default MlModelHubView;
