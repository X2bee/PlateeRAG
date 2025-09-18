'use client';

import React from 'react';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { devLog } from '@/app/_common/utils/logger';

// Main Page Components
import ContentArea from '@/app/main/workflowSection/components/ContentArea';
import CanvasIntroduction from '@/app/main/workflowSection/components/CanvasIntroduction';
import CompletedWorkflows from '@/app/main/workflowSection/components/CompletedWorkflows';
import Documents from '@/app/main/workflowSection/components/Documents';

// Model Page Components
import MetricsPageContent from '@/app/main/modelSection/components/MetricsPageContent';
import EvalPageContent from '@/app/main/modelSection/components/EvalPageContent';
import TrainPageContent from '@/app/main/modelSection/components/TrainPageContent';
import StoragePageContent from '@/app/main/modelSection/components/StoragePageContent';

// Chat Page Components
import ChatHistory from '@/app/main/chatSection/components/ChatHistory';
import CurrentChatInterface from '@/app/main/chatSection/components/CurrentChatInterface';
import ChatContent from '@/app/main/chatSection/components/ChatContent';

// Sidebar Config
import {
    getChatItems,
    getWorkflowItems,
    getTrainItems
} from '@/app/_common/components/sidebarConfig';

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
        const needsPermission = getWorkflowItems.includes(activeSection) || getTrainItems.includes(activeSection);
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
                return <CurrentChatInterface />;
            case 'chat-history':
                return <ChatHistory onSelectChat={handleChatSelect} />;

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
                        title="완성된 워크플로우"
                        description="저장된 워크플로우를 확인하고 관리하세요."
                    >
                        <CompletedWorkflows />
                    </ContentArea>
                );
            case 'documents':
                return (
                    <ContentArea
                        title="문서"
                        description="문서 저장소"
                    >
                        <Documents />
                    </ContentArea>
                );

            // 모델 섹션
            case 'train':
                return <TrainPageContent />;
            case 'train-monitor':
                return <MetricsPageContent />;
            case 'eval':
                return <EvalPageContent />;
            case 'storage':
                return <StoragePageContent />;

            // 기본값
            default:
                return <ChatContent onChatStarted={handleChatStarted} />;
        }
    };

    return <>{renderContent()}</>;
};

export default XgenPageContent;
