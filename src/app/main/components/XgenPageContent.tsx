'use client';

import React from 'react';
import { useAuth } from '@/app/_common/components/CookieProvider';

// Main Page Components
import ContentArea from '@/app/main/workflowSection/components/ContentArea';
import CanvasIntroduction from '@/app/main/workflowSection/components/CanvasIntroduction';
import CompletedWorkflows from '@/app/main/workflowSection/components/CompletedWorkflows';
import Documents from '@/app/main/workflowSection/components/Documents';
import ToolStorage from '@/app/main/workflowSection/components/ToolStorage';
import PromptStore from '@/app/main/workflowSection/components/prompt/PromptStore';

// Model Page Components
import MetricsPageContent from '@/app/main/modelSection/components/MetricsPageContent';
import EvalPageContent from '@/app/main/modelSection/components/EvalPageContent';
import TrainPageContent from '@/app/main/modelSection/components/TrainPageContent';
import StoragePageContent from '@/app/main/modelSection/components/StoragePageContent';

// Data Page Components
import DataStation from '@/app/main/dataSection/components/DataStation';
import DataStorage from '@/app/main/dataSection/components/DataStorage';

// Chat Page Components
import ChatHistory from '@/app/main/chatSection/components/ChatHistory';
import CurrentChatInterface from '@/app/main/chatSection/components/CurrentChatInterface';
import ChatContent from '@/app/main/chatSection/components/ChatContent';

// ml page components
import MLTrainPage from '@/app/main/mlSection/components/MLTrainPage';

// Sidebar Config
import {
    getWorkflowItems,
    getTrainItems,
    getDataItems,
    getMlModelItems,
} from '@/app/main/sidebar/sidebarConfig';

import { MlModelWorkspaceProvider } from '@/app/ml-inference/components/MlModelWorkspaceContext';
import MlModelWorkspacePage from '@/app/ml-inference/components/MlModelWorkspacePage';

interface XgenPageContentProps {
    activeSection: string;
    onChatSelect?: () => void;
    onChatStarted?: () => void;
    onSectionChange?: (section: string) => void;
}

const XgenPageContent: React.FC<XgenPageContentProps> = ({
    activeSection,
    onChatSelect,
    onChatStarted,
    onSectionChange
}) => {
    const { hasAccessToSection, isInitialized } = useAuth();

    const handleChatSelect = () => {
        if (onSectionChange) {
            onSectionChange('current-chat');
        }
        if (onChatSelect) {
            onChatSelect();
        }
    };

    const handleChatStarted = () => {
        if (onSectionChange) {
            onSectionChange('current-chat');
        }
        if (onChatStarted) {
            onChatStarted();
        }
    };

    const renderContent = () => {
        // 초기화가 완료되지 않았거나 섹션이 설정되지 않았으면 로딩 표시
        if (!isInitialized || !activeSection) {
            return (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '50vh',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                        {!isInitialized ? '권한을 확인하는 중...' : '페이지를 로드하는 중...'}
                    </p>
                    <style jsx>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            );
        }

        // 권한이 필요한 섹션에 대한 접근 권한 확인
        const needsPermission =
            getWorkflowItems.includes(activeSection) ||
            getTrainItems.includes(activeSection) ||
            getDataItems.includes(activeSection) ||
            getMlModelItems.includes(activeSection);
        if (needsPermission && !hasAccessToSection(activeSection)) {
            return (
                <ContentArea
                    title="접근 권한 없음"
                    description="이 섹션에 접근할 권한이 없습니다."
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '200px',
                        color: '#64748b',
                        fontSize: '1rem'
                    }}>
                        접근 권한이 없는 섹션입니다.
                    </div>
                </ContentArea>
            );
        }

        // 섹션별 컴포넌트 렌더링
        switch (activeSection) {
            // 채팅 섹션
            case 'new-chat':
                return <ChatContent onChatStarted={handleChatStarted} />;
            case 'current-chat':
                return ( 
                    <ContentArea
                    title="현재 채팅"
                    description="현재 채팅을 이어나가 보세요."
                    >       
                        <CurrentChatInterface />;
                    </ContentArea>
                );
            case 'chat-history':
                return (
                    <ContentArea
                        title="기존 채팅 불러오기"
                        description="이전 대화를 선택하여 계속하거나 새로운 창에서 열어보세요."
                    >
                        <ChatHistory onSelectChat={handleChatSelect} />
                    </ContentArea>
                );

            // 워크플로우 섹션
            case 'canvas':
                return (
                    <ContentArea
                        title="워크플로우 캔버스"
                        description="드래그 앤 드롭으로 AI 워크플로우를 직관적으로 구성하세요."
                    >
                        <CanvasIntroduction />
                    </ContentArea>
                );
            case 'workflows':
                return (
                    <ContentArea
                        title="워크플로우 관리"
                        description="저장된 워크플로우를 확인하고 관리하세요."
                    >
                        <CompletedWorkflows />
                    </ContentArea>
                );
            case 'documents':
                return (
                    <ContentArea
                        title="문서 관리"
                        description="문서 저장소"
                    >
                        <Documents />
                    </ContentArea>
                );
            case 'tool-storage':
                return (
                    <ContentArea
                        title="도구 관리"
                        description="도구를 탐색하고 관리하세요."
                    >
                        <ToolStorage />
                    </ContentArea>
                );
            case 'prompt-store':
                return (
                    <ContentArea
                        title="프롬프트 스토어"
                        description="다양한 프롬프트 템플릿을 탐색하고 활용하세요."
                    >
                        <PromptStore />
                    </ContentArea>
                );

            // 모델 섹션
            case 'train':
                return (
                    <ContentArea
                        title="모델 훈련"
                        description="모델 훈련을 위한 파라미터를 설정하고 훈련을 시작하세요."
                    >
                        <TrainPageContent />
                    </ContentArea>
                );
            case 'train-monitor':
                return (
                    <ContentArea
                    title="모델 훈련 모니터"
                    description="모델 훈련을 위한 파라미터를 설정하고 훈련을 시작하세요."
                        >
                        <MetricsPageContent />
                    </ContentArea>);
            case 'eval':
                return (
                    <ContentArea
                        title="모델 평가"
                        description="학습된 모델을 평가해보세요."
                    >
                        <EvalPageContent />
                    </ContentArea>
                );
            // ML 모델 섹션
            case 'model-storage':
                return (
                    <ContentArea
                        title="모델 허브"
                        description="저장된 모델을 확인하고 관리하세요."
                    >
                        <StoragePageContent />
                    </ContentArea>
                );
            case 'model-upload':
            case 'model-hub':
            case 'model-inference': {
                const view =
                    activeSection === 'model-upload'
                        ? 'upload'
                        : activeSection === 'model-hub'
                            ? 'hub'
                            : 'inference';

                return (
                    <MlModelWorkspaceProvider>
                        <MlModelWorkspacePage view={view} />
                    </MlModelWorkspaceProvider>
                );
            }

            // 데이터 섹션
            case 'data-station':
                return (
                    <ContentArea
                        title="데이터 스테이션"
                        description="데이터 매니저를 생성하고 관리합니다."
                    >
                        <DataStation />
                    </ContentArea>
                );
            case 'data-storage':
                return (
                    <ContentArea
                        title="데이터셋 허브"
                        description="머신러닝을 위한 데이터를 확인하고 관리하세요."
                    >
                        <DataStorage />
                    </ContentArea> );
            case 'ml-train':
                return (
                    <ContentArea
                        title="ML 모델 훈련"
                        description="원하는 머신러닝 모델을 학습하세요."
                    >
                        <MLTrainPage />
                    </ContentArea> );
            case 'ml-train-monitor':
                return (
                    <ContentArea
                    title="ML 모델 훈련 모니터 및 저장소"
                    description="학습 중인 머신러닝 모델을 실시간으로 모니터링하고 결과를 확인하세요."
                    >
                        <MetricsPageContent />
                    </ContentArea> );

            // 기본값
            default:
                return <ChatContent onChatStarted={handleChatStarted} />;
        }
    };

    return <>{renderContent()}</>;
};

export default XgenPageContent;
