'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/app/main/components/Sidebar';
import ChatContent from '@/app/chat/components/ChatContent';
import { getSidebarItems, createItemClickHandler } from '@/app/_common/components/sidebarConfig';
import styles from '@/app/main/assets/MainPage.module.scss';

const ChatPage: React.FC = () => {
    const router = useRouter();
    const sidebarItems = getSidebarItems();
    const handleItemClick = createItemClickHandler(router);

    return (
        <div className={styles.container}>
            <Sidebar 
                items={sidebarItems} 
                activeItem="new-chat"
                onItemClick={handleItemClick}
                initialChatExpanded={true}
                initialSettingExpanded={false}
            />
            <main className={styles.mainContent}>
                <ChatContent />
            </main>
        </div>
    );
};

export default ChatPage;
