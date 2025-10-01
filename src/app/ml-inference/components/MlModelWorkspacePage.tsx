'use client';

import React from 'react';
import ContentArea from '@/app/main/workflowSection/components/ContentArea';
import styles from './MlModelWorkspace.module.scss';
import MlModelStatusBanner, { MlModelHeaderActions } from './MlModelToolbar';
import MlModelFullView from './MlModelFullView';
import MlModelUploadView from './model-upload/MlModelUploadView';
import MlModelHubView from './model-hub/MlModelHubView';
import MlModelInferenceView from './model-infer/MlModelInferenceView';

type WorkspaceView = 'full' | 'upload' | 'hub' | 'inference';

const VIEW_CONFIG: Record<WorkspaceView, { title: string; description: string }> = {
    full: {
        title: 'ML 모델 워크스페이스 (Beta)',
        description: '모델 업로드, 등록 관리, 추론 검증까지 한 화면에서 빠르게 진행하세요.',
    },
    upload: {
        title: '모델 업로드',
        description: '학습한 모델 파일을 등록하고 메타데이터를 구성하세요. 등록된 모델은 허브와 추론 콘솔에서 즉시 사용할 수 있습니다.',
    },
    hub: {
        title: '모델 허브',
        description: '업로드된 모델을 검색하고 메타데이터를 확인하거나 삭제할 수 있습니다.',
    },
    inference: {
        title: '모델 추론 콘솔',
        description: '선택한 모델로 입력 스키마에 맞춰 추론을 실행하고 결과를 검증하세요.',
    },
};

interface MlModelWorkspacePageProps {
    view: WorkspaceView;
}

const MlModelWorkspacePage: React.FC<MlModelWorkspacePageProps> = ({ view }) => {
    const { title, description } = VIEW_CONFIG[view];
    const headerButtons = view === 'hub' ? null : <MlModelHeaderActions />;

    const renderView = () => {
        switch (view) {
            case 'upload':
                return <MlModelUploadView />;
            case 'hub':
                return <MlModelHubView />;
            case 'inference':
                return <MlModelInferenceView />;
            case 'full':
            default:
                return <MlModelFullView />;
        }
    };

    return (
        <ContentArea
            title={title}
            description={description}
            headerButtons={headerButtons ?? undefined}
            className={styles.contentAreaWrapper}
        >
            <MlModelStatusBanner />
            {renderView()}
        </ContentArea>
    );
};

export default MlModelWorkspacePage;
