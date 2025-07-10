"use client";
import React, { useState } from "react";
import { FiGrid, FiFolder, FiCpu, FiSettings  } from "react-icons/fi";
import Sidebar from "@/app/main/components/Sidebar";
import ContentArea from "@/app/main/components/ContentArea";
import CanvasIntroduction from "@/app/main/components/CanvasIntroduction";
import CompletedWorkflows from "@/app/main/components/CompletedWorkflows";
import Executor from "@/app/main/components/Executor";
import { SidebarItem } from "@/app/main/components/types";
import styles from "@/app/main/assets/MainPage.module.scss";

const MainPage: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string>("canvas");

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
            id: "executor",
            title: "실행기",
            description: "워크플로우 실행 및 모니터링",
            icon: <FiCpu />
        },
        {
            id: "settings",
            title: "환경 설정",
            description: "LLM 및 Tool 환경 설정",
            icon: <FiSettings  />
        },
    ];

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
            case "executor":
                return (
                    <ContentArea
                        title="워크플로우 실행기"
                        description="완성된 워크플로우를 실제 환경에서 실행하고 모니터링하세요."
                    >
                        <Executor />
                    </ContentArea>
                );
            case "settings":
                return (
                    <ContentArea
                        title="워크플로우 실행기"
                        description="완성된 워크플로우를 실제 환경에서 실행하고 모니터링하세요."
                    >
                        <Executor />
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