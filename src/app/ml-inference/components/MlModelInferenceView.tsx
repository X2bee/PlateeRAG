'use client';

import React from 'react';
import MlModelToolbar from './MlModelToolbar';
import styles from './MlModelWorkspace.module.scss';
import ModelRegistryPanel from './ModelRegistryPanel';
import ModelDetailPanel from './ModelDetailPanel';
import InferenceConsole from './InferenceConsole';
import MlModelDeleteDialogContainer from './MlModelDeleteDialogContainer';
import { useMlModelWorkspace } from './MlModelWorkspaceContext';

const MlModelInferenceView: React.FC = () => {
    const {
        models,
        selectedModelId,
        setSelectedModelId,
        openDeleteDialog,
        modelDetail,
        detailLoading,
        detailError,
        fetchModelDetail,
        inferenceEndpoint,
    } = useMlModelWorkspace();

    return (
        <div className={styles.workspaceGrid}>
            <MlModelToolbar />
            <div className={styles.twoColumn}>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>모델 선택</h2>
                    <p className={styles.sectionDescription}>
                        추론을 실행할 모델을 선택하세요. 선택된 모델의 메타데이터도 함께 확인할 수 있습니다.
                    </p>
                    <ModelRegistryPanel
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelect={setSelectedModelId}
                        onDelete={openDeleteDialog}
                    />
                    <ModelDetailPanel
                        model={modelDetail}
                        isLoading={detailLoading}
                        errorMessage={detailError}
                        onRefetch={selectedModelId ? () => fetchModelDetail(selectedModelId) : undefined}
                    />
                </section>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>모델 추론 콘솔</h2>
                    <p className={styles.sectionDescription}>
                        입력 스키마에 맞춰 샘플 데이터를 구성하고 추론 결과를 확인하세요.
                    </p>
                    <InferenceConsole
                        request={{ endpoint: inferenceEndpoint }}
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelectModel={setSelectedModelId}
                    />
                </section>
            </div>
            <MlModelDeleteDialogContainer />
        </div>
    );
};

export default MlModelInferenceView;
