'use client';

import React from 'react';
import styles from './MlModelWorkspace.module.scss';
import UploadModelSection from './UploadModelSection';
import ModelRegistryPanel from './ModelRegistryPanel';
import ModelDetailPanel from './ModelDetailPanel';
import MlModelDeleteDialogContainer from './MlModelDeleteDialogContainer';
import { useMlModelWorkspace } from './MlModelWorkspaceContext';

const MlModelUploadView: React.FC = () => {
    const {
        uploadEndpoint,
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
            <div className={styles.twoColumn}>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>모델 업로드</h2>
                    <p className={styles.sectionDescription}>
                        학습된 모델 파일과 메타데이터를 등록하세요. 업로드 후 추론 콘솔과 모델 허브에서 즉시 사용할 수 있습니다.
                    </p>
                    <UploadModelSection
                        request={{ endpoint: uploadEndpoint }}
                        onUploadSuccess={handleModelInserted}
                    />
                </section>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>등록된 모델</h2>
                    <p className={styles.sectionDescription}>
                        업로드된 모델을 선택하여 메타데이터를 확인하거나 삭제할 수 있습니다.
                    </p>
                    <ModelRegistryPanel
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelect={setSelectedModelId}
                        onDelete={openDeleteDialog}
                    />
                </section>
            </div>
            <section className={styles.sectionCard}>
                <ModelDetailPanel
                    model={modelDetail}
                    isLoading={detailLoading}
                    errorMessage={detailError}
                    onRefetch={selectedModelId ? () => fetchModelDetail(selectedModelId) : undefined}
                />
            </section>
            <MlModelDeleteDialogContainer />
        </div>
    );
};

export default MlModelUploadView;
