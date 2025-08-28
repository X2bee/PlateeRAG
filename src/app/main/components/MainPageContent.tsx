'use client';

import React, { useState, useEffect } from 'react';
import ContentArea from '@/app/main/components/ContentArea';
import CanvasIntroduction from '@/app/main/components/CanvasIntroduction';
import CompletedWorkflows from '@/app/main/components/CompletedWorkflows';
import Documents from '@/app/main/components/Documents';
import { useSearchParams } from 'next/navigation';
import styles from '@/app/main/assets/MainPage.module.scss';

const MainPage: React.FC = () => {
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<string>('canvas');
    const [execTab, setExecTab] = useState<'executor' | 'monitoring' | 'batchtester' | 'test-logs'>('executor');

    useEffect(() => {
        const view = searchParams.get('view');
        if (view && ['canvas', 'workflows', 'exec-monitor', 'settings', 'config-viewer', 'documents'].includes(view)) {
            setActiveSection(view);
        } else {
            setActiveSection('canvas'); // 기본값 설정
        }
    }, [searchParams]);

    const handleTabChange = (tab: 'executor' | 'monitoring' | 'batchtester' | 'test-logs') => {
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
                테스트
            </button>
            <button
                onClick={() => handleTabChange('test-logs')}
                className={`${styles.tabToggleButton} ${execTab === 'test-logs' ? styles.active : ''}`}
            >
                테스트 로그
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
