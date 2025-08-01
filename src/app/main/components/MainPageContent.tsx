'use client';

import React, { useState, useEffect } from 'react';
import ContentArea from '@/app/main/components/ContentArea';
import CanvasIntroduction from '@/app/main/components/CanvasIntroduction';
import CompletedWorkflows from '@/app/main/components/CompletedWorkflows';
import Playground from '@/app/main/components/Playground';
import Settings from '@/app/main/components/Settings';
import ConfigViewer from '@/app/main/components/ConfigViewer';
import Documents from '@/app/main/components/Documents';
import { useSearchParams } from 'next/navigation';
import styles from '@/app/main/assets/MainPage.module.scss';

const MainPage: React.FC = () => {
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<string>('canvas');
    const [execTab, setExecTab] = useState<'executor' | 'monitoring' | 'batchtester'>('executor');

    useEffect(() => {
        const view = searchParams.get('view');
        if (view && ['canvas', 'workflows', 'exec-monitor', 'settings', 'config-viewer', 'documents'].includes(view)) {
            setActiveSection(view);
        } else {
            setActiveSection('canvas'); // 기본값 설정
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'executor' | 'monitoring' | 'batchtester') => {
        setExecTab(tab);
        localStorage.setItem('execMonitorTab', tab);
    };

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
            <button
                onClick={() => handleTabChange('batchtester')}
                className={`${styles.tabToggleButton} ${execTab === 'batchtester' ? styles.active : ''}`}
            >
                배치 테스터
            </button>
        </div>
    );

    const getExecMonitorDescription = () => {
        switch (execTab) {
            case 'executor':
                return '완성된 워크플로우를 실제 환경에서 실행하고 모니터링하세요.';
            case 'monitoring':
                return '워크플로우의 실행 성능과 리소스 사용량을 실시간으로 모니터링하세요.';
            case 'batchtester':
                return 'CSV나 Excel 파일을 업로드하여 워크플로우를 배치로 테스트하세요.';
            default:
                return '완성된 워크플로우를 실제 환경에서 실행하고 모니터링하세요.';
        }
    };

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
                        description={getExecMonitorDescription()}
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