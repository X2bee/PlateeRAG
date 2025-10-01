'use client';

import React from 'react';
import styles from '../MlModelWorkspace.module.scss';
import ModelRegistryPanel from '../model-hub/ModelRegistryPanel';
import InferenceConsole from './InferenceConsole';
import MlModelDeleteDialogContainer from '../model-hub/MlModelDeleteDialogContainer';
import ModelStageDialogContainer from '../model-hub/ModelStageDialogContainer';
import { useMlModelWorkspace } from '../MlModelWorkspaceContext';

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

    const inferenceSectionRef = React.useRef<HTMLElement | null>(null);
    const selectedCardRef = React.useRef<HTMLElement | null>(null);

    const scrollToInference = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
        const element = inferenceSectionRef.current;
        if (!element) {
            return;
        }
        element.scrollIntoView({ behavior, block: 'start' });
    }, []);

    const scrollToSelectedCard = React.useCallback((behavior: ScrollBehavior = 'smooth') => {
        const element = selectedCardRef.current;
        if (!element) {
            return;
        }
        element.scrollIntoView({ behavior, block: 'center' });
    }, []);

    const handleRegistrySelect = React.useCallback((modelId: number) => {
        setSelectedModelId(modelId);
    }, [setSelectedModelId]);

    const handleConsoleSelect = React.useCallback((modelId: number | null) => {
        setSelectedModelId(modelId);
    }, [setSelectedModelId]);

    const handleSelectedCardChange = React.useCallback((element: HTMLElement | null) => {
        selectedCardRef.current = element;
    }, []);

    React.useEffect(() => {
        if (selectedModelId == null) {
            selectedCardRef.current = null;
            return;
        }

        scrollToInference();
    }, [selectedModelId, scrollToInference]);

    const hasSelectedModel = selectedModelId != null;

    return (
        <div className={styles.workspaceGrid}>
            <div className={styles.inferenceStack}>
                <section className={styles.sectionCard}>
                    <h2 className={styles.sectionTitle}>모델 선택</h2>
                    <p className={styles.sectionDescription}>
                        추론을 실행할 모델을 선택하세요. 선택된 모델의 메타데이터도 함께 확인할 수 있습니다.
                    </p>
                    <ModelRegistryPanel
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelect={handleRegistrySelect}
                        onDelete={openDeleteDialog}
                        onSelectedCardChange={handleSelectedCardChange}
                    />
                </section>
                <section ref={inferenceSectionRef} className={`${styles.sectionCard} ${styles.inferenceSection}`}>
                    <h2 className={styles.sectionTitle}>모델 추론 콘솔</h2>
                    <p className={styles.sectionDescription}>
                        입력 스키마에 맞춰 샘플 데이터를 구성하고 추론 결과를 확인하세요.
                    </p>
                    <InferenceConsole
                        request={{ endpoint: inferenceEndpoint }}
                        models={models}
                        selectedModelId={selectedModelId}
                        onSelectModel={handleConsoleSelect}
                        activeModelDetail={modelDetail}
                        onRequestModelDetail={(modelId, options) => fetchModelDetail(modelId, { silent: true, ...options })}
                    />
                </section>
            </div>
            <MlModelDeleteDialogContainer />
            <ModelStageDialogContainer />
            {hasSelectedModel ? (
                <button
                    type="button"
                    className={styles.scrollToInferenceButton}
                    onClick={() => scrollToSelectedCard()}
                    aria-label="선택된 모델 카드로 이동"
                >
                    선택한 모델 카드 보기
                </button>
            ) : null}
        </div>
    );
};

export default MlModelInferenceView;
