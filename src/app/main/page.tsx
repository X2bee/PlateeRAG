"use client";
import React, { useState, useEffect } from "react";
import { FiGrid, FiFolder, FiCpu, FiSettings, FiEye, FiBarChart } from "react-icons/fi";
import Sidebar from "@/app/main/components/Sidebar";
import ContentArea from "@/app/main/components/ContentArea";
import CanvasIntroduction from "@/app/main/components/CanvasIntroduction";
import CompletedWorkflows from "@/app/main/components/CompletedWorkflows";
import Playground from "@/app/main/components/Playground";
import Settings from "@/app/main/components/Settings";
import ConfigViewer from "@/app/main/components/ConfigViewer";
import { SidebarItem } from "@/app/main/components/types";
import styles from "@/app/main/assets/MainPage.module.scss";

const MainPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>("canvas");
    // Executor/Monitoring 통합 토글 상태
    const [execTab, setExecTab] = useState<'executor' | 'monitoring'>("executor");

    // 페이지 이동 시에도 탭 상태 유지
    useEffect(() => {
        // 로컬 스토리지에서 탭 상태 복원
        const savedTab = localStorage.getItem('execMonitorTab');
        if (savedTab === 'executor' || savedTab === 'monitoring') {
            setExecTab(savedTab as 'executor' | 'monitoring');
        }
    }, []);

    // 탭 변경 시 로컬 스토리지에 상태 저장
    const handleTabChange = (tab: 'executor' | 'monitoring') => {
        setExecTab(tab);
        localStorage.setItem('execMonitorTab', tab);
    };

    const sidebarItems: SidebarItem[] = [
        {
            id: "canvas",
            title: "워크플로우 캔버스",
            description: "새로운 워크플로우 만들기",
            icon: <FiGrid />
        },
        {
            id: "workflows",
            title: "완성된 워크플로우",
            description: "저장된 워크플로우 관리",
            icon: <FiFolder />
        },
        {
            id: "exec-monitor",
            title: "실행 및 모니터링",
            description: "워크플로우 실행과 성능 모니터링",
            icon: <FiCpu />
        },
        {
            id: "settings",
            title: "고급 환경 설정",
            description: "LLM 및 Tool 환경변수 직접 관리",
            icon: <FiSettings />
        },
        {
            id: "config-viewer",
            title: "설정값 확인",
            description: "백엔드 환경변수 및 설정 확인",
            icon: <FiEye />
        },
    ];

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
            case "canvas":
                return (
                    <ContentArea
                        title="워크플로우 캔버스"
                        description="드래그 앤 드롭으로 AI 워크플로우를 직관적으로 구성하세요."
                    >
                        <CanvasIntroduction />
                    </ContentArea>
                );
            case "workflows":
                return (
                    <ContentArea
                        title="완성된 워크플로우"
                        description="저장된 워크플로우를 확인하고 관리하세요."
                    >
                        <CompletedWorkflows />
                    </ContentArea>
                );
            case "exec-monitor":
                return (
                    <ContentArea
                        title="실행 및 모니터링"
                        description={execTab === 'executor' ? "완성된 워크플로우를 실제 환경에서 실행하고 모니터링하세요." : "워크플로우의 실행 성능과 리소스 사용량을 실시간으로 모니터링하세요."}
                        headerButtons={renderExecMonitorToggleButtons()}
                    >
                        <Playground 
                            activeTab={execTab}
                            onTabChange={handleTabChange}
                        />
                    </ContentArea>
                );

            case "settings":
                return (
                    <ContentArea
                        title="고급 환경 설정"
                        description="백엔드 환경변수를 직접 편집하고 관리하세요. 모든 설정값을 세밀하게 제어할 수 있습니다."
                    >
                        <Settings />
                    </ContentArea>
                );
            case "config-viewer":
                return (
                    <ContentArea
                        title="설정값 확인"
                        description="백엔드에서 관리되는 모든 환경변수와 설정값을 확인하세요."
                    >
                        <ConfigViewer 
                            onNavigateToSettings={() => setActiveSection("settings")}
                        />
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
                onItemClick={setActiveSection}
            />
            <main className={styles.mainContent}>
                {renderContent()}
            </main>
        </div>
    );
};

export default MainPage;