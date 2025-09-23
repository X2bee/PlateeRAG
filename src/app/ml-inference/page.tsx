'use client';

import React from 'react';
import styles from './MlInferencePage.module.scss';
import { MlModelWorkspaceProvider } from './components/MlModelWorkspaceContext';
import MlModelFullView from './components/MlModelFullView';

const MlInferencePage: React.FC = () => {
    return (
        <main className={styles.page}>
            <header className={styles.pageHeader}>
                <div>
                    <h1>Machine Learning Inference</h1>
                    <p>백엔드 모델 업로드 및 추론 API를 검증하기 위한 독립형 테스트 콘솔입니다. 기존 워크플로우와 격리되어 동작합니다.</p>
                </div>
                <span className={styles.statusBadge}>Beta Sandbox</span>
            </header>
            <MlModelWorkspaceProvider>
                <MlModelFullView />
            </MlModelWorkspaceProvider>
        </main>
    );
};

export default MlInferencePage;
