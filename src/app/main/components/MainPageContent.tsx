'use client';
import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/main/components/Sidebar';
import ContentArea from '@/app/main/components/ContentArea';
import CanvasIntroduction from '@/app/main/components/CanvasIntroduction';
import CompletedWorkflows from '@/app/main/components/CompletedWorkflows';
import Playground from '@/app/main/components/Playground';
import Settings from '@/app/main/components/Settings';
import ConfigViewer from '@/app/main/components/ConfigViewer';
import ChatHistory from '@/app/chat/components/ChatHistory';
import CurrentChatInterface from '@/app/chat/components/CurrentChatInterface';
import { getSidebarItems } from '@/app/_common/components/sidebarConfig';
import styles from '@/app/main/assets/MainPage.module.scss';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

const MainPageContent: React.FC = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [activeSection, setActiveSection] = useState<string>('canvas');
    // Executor/Monitoring 통합 토글 상태
    const [execTab, setExecTab] = useState<'executor' | 'monitoring'>(
        'executor',
    );
    const [initialLoad, setInitialLoad] = useState(true);

    // URL 파라미터 기반 초기 라우팅 처리
    useEffect(() => {
        // Check URL parameters first for direct navigation
        const view = searchParams.get('view');
        const workflowName = searchParams.get('workflowName');
        const workflowId = searchParams.get('workflowId');
        
        if (view === 'playground') {
            setActiveSection('exec-monitor');
            // 워크플로우 ID가 있으면 executor 탭으로 설정
            if (workflowName && workflowId) {
                setExecTab('executor');
            } else {
                // 워크플로우 ID가 없으면 저장된 탭을 사용
                const savedTab = localStorage.getItem('execMonitorTab');
                if (savedTab === 'executor' || savedTab === 'monitoring') {
                    setExecTab(savedTab as 'executor' | 'monitoring');
                }
            }
            setInitialLoad(false);
        } else {
            // Check if there's a saved activeSection from chat page navigation
            const savedActiveSection = localStorage.getItem('activeSection');
            if (savedActiveSection && ['canvas', 'workflows', 'exec-monitor', 'settings', 'config-viewer'].includes(savedActiveSection)) {
                setActiveSection(savedActiveSection);
                localStorage.removeItem('activeSection'); // Clear after use
            }
            
            // If no view parameter, load from localStorage
            const savedTab = localStorage.getItem('execMonitorTab');
            if (savedTab === 'executor' || savedTab === 'monitoring') {
                setExecTab(savedTab as 'executor' | 'monitoring');
            }
            setInitialLoad(false);
        }
    }, [searchParams]);

    // activeSection 변경 시 URL 초기화 처리
    useEffect(() => {
        if (!initialLoad && activeSection !== 'exec-monitor') {
            // URL에서 파라미터를 제거하고 기본 /main 경로로 변경
            const currentParams = new URLSearchParams(searchParams.toString());
            if (
                currentParams.has('view') ||
                currentParams.has('workflowName') ||
                currentParams.has('workflowId')
            ) {
                router.replace(pathname);
            }
        }
    }, [activeSection, initialLoad, pathname, router, searchParams]);

    // 탭 변경 시 로컬 스토리지에 상태 저장
    const handleTabChange = (tab: 'executor' | 'monitoring') => {
        setExecTab(tab);
        localStorage.setItem('execMonitorTab', tab);
    };

    // 사이드바 아이템 클릭 처리
    const handleSidebarItemClick = (id: string) => {
        setActiveSection(id);
    };

    // 채팅 선택 처리 (Main 화면에서 기존 채팅 세션 표시)
    const handleChatSelect = (executionMeta: any) => {
        // 선택된 채팅을 현재 채팅으로 설정 후 current-chat 모드로 전환
        console.log('Selected chat:', executionMeta);
        setActiveSection('current-chat');
    };

    const sidebarItems = getSidebarItems();

    // 헤더에 표시할 토글 버튼
    const renderExecMonitorToggleButtons = () => (
        <div className={styles.tabToggleContainer}>
            <button
                onClick={() => handleTabChange('executor')}
                className={`${styles.tabToggleButton} ${execTab === 'executor' ? styles.active : ''}`}
            >
                채팅 실행기
            </button>
            <button
                onClick={() => handleTabChange('monitoring')}
                className={`${styles.tabToggleButton} ${execTab === 'monitoring' ? styles.active : ''}`}
            >
                성능 모니터링
            </button>
        </div>
    );

    const renderContent = () => {
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
            case 'exec-monitor':
                return (
                    <ContentArea
                        title="실행 및 모니터링"
                        description={
                            execTab === 'executor'
                                ? '완성된 워크플로우를 실제 환경에서 실행하고 모니터링하세요.'
                                : '워크플로우의 실행 성능과 리소스 사용량을 실시간으로 모니터링하세요.'
                        }
                        headerButtons={renderExecMonitorToggleButtons()}
                    >
                        <Playground
                            activeTab={execTab}
                            onTabChange={handleTabChange}
                        />
                    </ContentArea>
                );

            case 'settings':
                return (
                    <ContentArea
                        title="고급 환경 설정"
                        description="백엔드 환경변수를 직접 편집하고 관리하세요. 모든 설정값을 세밀하게 제어할 수 있습니다."
                    >
                        <Settings />
                    </ContentArea>
                );
            case 'config-viewer':
                return (
                    <ContentArea
                        title="설정값 확인"
                        description="백엔드에서 관리되는 모든 환경변수와 설정값을 확인하세요."
                    >
                        <ConfigViewer
                            onNavigateToSettings={() =>
                                setActiveSection('settings')
                            }
                        />
                    </ContentArea>
                );
            case 'chat-history':
                return (
                    <ContentArea
                        title="기존 채팅 불러오기"
                        description="이전 대화 기록을 확인하고 계속 진행하세요."
                    >
                        <ChatHistory onSelectChat={handleChatSelect} />
                    </ContentArea>
                );
            case 'current-chat':
                return (
                    <ContentArea
                        title="현재 채팅"
                        description="진행 중인 대화를 계속하세요."
                    >
                        <CurrentChatInterface />
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

    return (
        <div className={styles.container}>
            <Sidebar
                items={sidebarItems}
                activeItem={activeSection}
                onItemClick={handleSidebarItemClick}
                initialChatExpanded={false}
                initialSettingExpanded={true}
            />
            <main className={styles.mainContent}>{renderContent()}</main>
        </div>
    );
};

export default MainPageContent;
