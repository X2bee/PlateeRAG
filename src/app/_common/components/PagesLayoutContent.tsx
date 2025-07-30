'use client';

import React, { useState, useMemo, createContext, useContext } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/app/_common/components/Sidebar';
import { getChatSidebarItems, getSettingSidebarItems, getTrainSidebarItems, getWorkflowSidebarItems } from '@/app/_common/components/sidebarConfig';
import { getChatItems, getSettingItems, getWorkflowItems, getTrainItems } from '@/app/_common/components/sidebarConfig';
import styles from '@/app/main/assets/MainPage.module.scss';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';

interface PagesLayoutContextType {
    isSidebarOpen: boolean;
    setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
    navigateToChatMode: (mode: 'new-chat' | 'current-chat' | 'chat-history') => void;
}

const PagesLayoutContext = createContext<PagesLayoutContextType | undefined>(undefined);

export const usePagesLayout = () => {
    return useContext(PagesLayoutContext);
};

export const useSidebar = usePagesLayout;

export default function PagesLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navigateToChatMode = (mode: 'new-chat' | 'current-chat' | 'chat-history') => {
        router.replace(`/chat?mode=${mode}`);
    };

    const activeItem = useMemo(() => {
        if (pathname === '/chat') {
            return searchParams.get('mode') || 'new-chat';
        }
        if (pathname === '/main') {
            return searchParams.get('view') || 'canvas';
        }
        if (pathname === '/model') {
            return searchParams.get('view') || 'train';
        }
        return 'canvas';
    }, [pathname, searchParams]);

    const handleSidebarItemClick = (id: string) => {
        const chatItems = getChatItems;
        const mainItems = [...getWorkflowItems, ...getSettingItems];
        const trainItems = getTrainItems;

        if (chatItems.includes(id)) {
            navigateToChatMode(id as 'new-chat' | 'current-chat' | 'chat-history');
        } else if (mainItems.includes(id)) {
            router.replace(`/main?view=${id}`);
        } else if (trainItems.includes(id)) {
            router.replace(`/model?view=${id}`);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const settingSidebarItems = getSettingSidebarItems();
    const workflowSidebarItems = getWorkflowSidebarItems();
    const chatSidebarItems = getChatSidebarItems();
    const trainItems = getTrainSidebarItems();

    return (
        <PagesLayoutContext.Provider value={{ isSidebarOpen, setIsSidebarOpen, navigateToChatMode }}>
            <div className={styles.container}>
                <AnimatePresence>
                    {isSidebarOpen ? (
                        <Sidebar
                            key="sidebar-panel"
                            isOpen={isSidebarOpen}
                            onToggle={toggleSidebar}
                            items={settingSidebarItems}
                            workflowItems={workflowSidebarItems}
                            chatItems={chatSidebarItems}
                            trainItem={trainItems}
                            activeItem={activeItem}
                            onItemClick={handleSidebarItemClick}
                            initialChatExpanded={pathname === '/chat'}
                            initialSettingExpanded={pathname === '/main'}
                            initialTrainExpanded={pathname === '/train'}
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
                <main className={`${styles.mainContent} ${!isSidebarOpen ? styles.mainContentPushed  : ''}` }>
                    {children}
                </main>
            </div>
        </PagesLayoutContext.Provider>
    );
}
