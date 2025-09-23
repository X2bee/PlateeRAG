'use client';

import React from 'react';
import MlModelToolbar from './MlModelToolbar';
import styles from './MlModelWorkspace.module.scss';
import UploadModelSection from './UploadModelSection';
import ModelRegistryPanel from './ModelRegistryPanel';
import ModelDetailPanel from './ModelDetailPanel';
import InferenceConsole from './InferenceConsole';
import MlModelDeleteDialogContainer from './MlModelDeleteDialogContainer';
import { useMlModelWorkspace } from './MlModelWorkspaceContext';

const MlModelFullView: React.FC = () => {
    const {
        uploadEndpoint,
        inferenceEndpoint,
        handleModelInserted,
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
            <MlModelToolbar />
            <div className={styles.twoColumn}>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>모델 업로드</h2>
                    <p className={styles.sectionDescription}>
                        모델 파일, 스키마, 메타데이터를 업로드하여 새로운 모델을 등록합니다.
                    </p>
                    <UploadModelSection
                        request={{ endpoint: uploadEndpoint }}
                        onUploadSuccess={handleModelInserted}
                    />
                </section>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>모델 허브</h2>
                    <p className={styles.sectionDescription}>
                        등록된 모델을 선택하여 상세 정보를 확인하거나 삭제할 수 있습니다.
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
            </div>
            <section className={styles.sectionCard}>
                <h2 className={styles.sectionTitle}>모델 추론</h2>
                <p className={styles.sectionDescription}>
                    선택한 모델로 추론을 실행하고 결과를 확인합니다.
                </p>
                <InferenceConsole
                    request={{ endpoint: inferenceEndpoint }}
                    models={models}
                    selectedModelId={selectedModelId}
                    onSelectModel={setSelectedModelId}
                    activeModelDetail={modelDetail}
                    onRequestModelDetail={(modelId, options) => fetchModelDetail(modelId, { silent: true, ...options })}
                />
            </section>
            <MlModelDeleteDialogContainer />
        </div>
    );
};

export default MlModelFullView;
