'use client';

import React, { useState, useEffect } from 'react';
import ContentArea from '@/app/main/components/ContentArea';
import CanvasIntroduction from '@/app/main/components/CanvasIntroduction';
import CompletedWorkflows from '@/app/main/components/CompletedWorkflows';
import Documents from '@/app/main/components/Documents';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { getWorkflowItems } from '@/app/_common/components/sidebarConfig';
import { devLog } from '@/app/_common/utils/logger';

const MainPage: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [activeSection, setActiveSection] = useState<string>('');
    const { hasAccessToSection, isInitialized } = useAuth();

    useEffect(() => {
        if (!isInitialized) return;

        const view = searchParams.get('view');
        const validSections = [...getWorkflowItems];

        // 접근 가능한 첫 번째 섹션을 찾기
        const getAccessibleSection = () => {
            if (view && validSections.includes(view)) {
                // 워크플로우 관련 섹션이면 권한 확인
                if (getWorkflowItems.includes(view)) {
                    if (hasAccessToSection(view)) {
                        return view;
                    }
                } else {
                    // 기타 섹션은 기본 허용 (exec-monitor, settings 등)
                    return view;
                }
            }

            // 기본값으로 접근 가능한 첫 번째 워크플로우 섹션 찾기
            for (const section of getWorkflowItems) {
                if (hasAccessToSection(section)) {
                    return section;
                }
            }

            devLog.log('MainPage: No accessible workflow sections found, redirecting to chat');
            router.push('/chat');
            return null;
        };

        const accessibleSection = getAccessibleSection();
        if (accessibleSection) {
            setActiveSection(accessibleSection);
            devLog.log('MainPage: Setting active section to:', accessibleSection);
        }
        // accessibleSection이 null이면 이미 /chat으로 리다이렉트됨
    }, [searchParams, hasAccessToSection, isInitialized]);

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
                        {!isInitialized ? '권한을 확인하는 중...' : '채팅 페이지로 이동 중...'}
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

        // 워크플로우 섹션에 대한 접근 권한 확인
        if (getWorkflowItems.includes(activeSection) && !hasAccessToSection(activeSection)) {
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

        switch (activeSection) {
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
            default:
                return (
                    <ContentArea
                        title="워크플로우 캔버스"
                        description="드래그 앤 드롭으로 AI 워크플로우를 직관적으로 구성하세요."
                    >
                        <CanvasIntroduction />
                    </ContentArea>
                );
        }
    };

    return <>{renderContent()}</>;
};

export default MainPage;
