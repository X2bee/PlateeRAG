'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import XgenPageContent from '@/app/main/components/XgenPageContent';
import XgenSidebar from '@/app/main/sidebar/XgenSidebar';
import { getChatItems, getWorkflowItems, getTrainItems, getDataItems, getMlModelItems } from '@/app/main/sidebar/sidebarConfig';
import { useAuth } from '@/app/_common/components/CookieProvider';
import styles from '@/app/main/workflowSection/assets/MainPage.module.scss';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';

interface XgenLayoutContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    activeSection: string;
    setActiveSection: React.Dispatch<React.SetStateAction<string>>;
    navigateToView: (view: string) => void;
}

const XgenLayoutContext = createContext<XgenLayoutContextType | undefined>(undefined);

export const useXgenLayout = () => {
    return useContext(XgenLayoutContext);
};

export default function XgenLayoutContent() {
    const searchParams = useSearchParams();
    const { hasAccessToSection, isInitialized } = useAuth();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState<string>('new-chat');

    // URL에서 초기 섹션 설정 (첫 로드시에만)
    useEffect(() => {
        if (!isInitialized) return;

        const view = searchParams.get('view');
        const allValidSections = [...getChatItems, ...getWorkflowItems, ...getTrainItems, ...getDataItems, ...getMlModelItems];

        // 접근 가능한 첫 번째 섹션을 찾기
        const getAccessibleSection = () => {
            if (view && allValidSections.includes(view)) {
                // 채팅 섹션은 항상 접근 가능
                if (getChatItems.includes(view)) {
                    return view;
                }
                // 워크플로우, 모델, 데이터 섹션은 권한 확인
                if (getWorkflowItems.includes(view) || getTrainItems.includes(view) || getDataItems.includes(view) || getMlModelItems.includes(view)) {
                    if (hasAccessToSection(view)) {
                        return view;
                    }
                }
            }

            // 기본값으로 접근 가능한 첫 번째 섹션 찾기
            // 1. 채팅 섹션부터 시도 (항상 접근 가능)
            for (const section of getChatItems) {
                return section; // 첫 번째 채팅 섹션 반환 (new-chat)
            }

            // 2. 워크플로우 섹션 시도
            for (const section of getWorkflowItems) {
                if (hasAccessToSection(section)) {
                    return section;
                }
            }

            // 3. 데이터 섹션 시도
            for (const section of getDataItems) {
                if (hasAccessToSection(section)) {
                    return section;
                }
            }

            // 4. 모델 섹션 시도
            for (const section of getTrainItems) {
                if (hasAccessToSection(section)) {
                    return section;
                }
            }

            // 5. ML 모델 섹션 시도
            for (const section of getMlModelItems) {
                if (hasAccessToSection(section)) {
                    return section;
                }
            }

            // 기본값으로 new-chat 반환
            return 'new-chat';
        };

        const accessibleSection = getAccessibleSection();
        if (accessibleSection) {
            setActiveSection(accessibleSection);
        }
    }, [searchParams, hasAccessToSection, isInitialized]);

    // URL 변경 없이 내부 상태만 변경하는 함수
    const navigateToView = (view: string) => {
        setActiveSection(view);
    };

    const handleSidebarItemClick = (id: string) => {
        const chatItems = getChatItems;
        const workflowItems = getWorkflowItems;
        const trainItems = getTrainItems;
        const dataItems = getDataItems;
        const mlModelItems = getMlModelItems;
        const allItems = [...chatItems, ...workflowItems, ...trainItems, ...dataItems, ...mlModelItems];

        if (allItems.includes(id)) {
            navigateToView(id);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const contextValue = {
        isSidebarOpen,
        setIsSidebarOpen,
        activeSection,
        setActiveSection,
        navigateToView,
    };

    return (
        <XgenLayoutContext.Provider value={contextValue}>
            <div className={styles.container}>
                <AnimatePresence mode="wait">
                    {isSidebarOpen ? (
                        <XgenSidebar
                            key="xgen-sidebar"
                            isOpen={isSidebarOpen}
                            onToggle={toggleSidebar}
                            activeItem={activeSection}
                            onItemClick={handleSidebarItemClick}
                        />
                    ) : (
                        <motion.button
                            key="sidebar-open-button"
                            onClick={toggleSidebar}
                            className={styles.openOnlyBtn}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <FiChevronRight />
                        </motion.button>
                    )}
                </AnimatePresence>
                <main className={`${styles.mainContent} ${!isSidebarOpen ? styles.mainContentPushed : ''}`}>
                    <XgenPageContent
                        activeSection={activeSection}
                        onSectionChange={setActiveSection}
                    />
                </main>
            </div>
        </XgenLayoutContext.Provider>
    );
}
