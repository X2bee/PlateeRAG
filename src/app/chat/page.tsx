'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import {
    FiGrid,
    FiFolder,
    FiCpu,
    FiSettings,
    FiEye,
} from 'react-icons/fi';
import Sidebar from '@/app/main/components/Sidebar';
import ChatContent from '@/app/chat/components/ChatContent';
import { SidebarItem } from '@/app/main/components/types';
import styles from '@/app/main/assets/MainPage.module.scss';

const ChatPage: React.FC = () => {
    const router = useRouter();
    const sidebarItems: SidebarItem[] = [
        {
            id: 'canvas',
            title: '워크플로우 캔버스',
            description: '새로운 워크플로우 만들기',
            icon: <FiGrid />,
        },
        {
            id: 'workflows',
            title: '완성된 워크플로우',
            description: '저장된 워크플로우 관리',
            icon: <FiFolder />,
        },
        {
            id: 'exec-monitor',
            title: '실행 및 모니터링',
            description: '워크플로우 실행과 성능 모니터링',
            icon: <FiCpu />,
        },
        {
            id: 'settings',
            title: '고급 환경 설정',
            description: 'LLM 및 Tool 환경변수 직접 관리',
            icon: <FiSettings />,
        },
        {
            id: 'config-viewer',
            title: '설정값 확인',
            description: '백엔드 환경변수 및 설정 확인',
            icon: <FiEye />,
        },
    ];

    const handleItemClick = (itemId: string) => {
        // 클릭한 섹션을 localStorage에 저장하고 /main으로 이동
        localStorage.setItem('activeSection', itemId);
        router.push('/main');
    };

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
