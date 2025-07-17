'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiChatSmileAiLine } from "react-icons/ri";
import { FiClock, FiMessageCircle } from "react-icons/fi";
import { SidebarProps } from '@/app/main/components/types';
import styles from '@/app/main/assets/MainPage.module.scss';

const Sidebar: React.FC<SidebarProps> = ({
    items,
    activeItem,
    onItemClick,
    className = '',
    initialChatExpanded = false,
    initialSettingExpanded = false,
}) => {
    const router = useRouter();
    const [isSettingExpanded, setIsSettingExpanded] = useState(initialSettingExpanded);
    const [isChatExpanded, setIsChatExpanded] = useState(initialChatExpanded);

    const toggleExpanded = () => {
        setIsSettingExpanded(!isSettingExpanded);
        if (!isSettingExpanded) {
            setIsChatExpanded(false);
        }
    };

    const toggleChatExpanded = () => {
        setIsChatExpanded(!isChatExpanded);
        if (!isChatExpanded) {
            setIsSettingExpanded(false);
        }
    };

    const handleLogoClick = () => {
        router.push('/');
    };

    const handleNewChatClick = () => {
        onItemClick('new-chat');
        router.push('/chat');
    };

    const handleChatHistoryClick = () => {
        onItemClick('chat-history');
        router.push('/chat');
    };

    const handleCurrentChatClick = () => {
        onItemClick('current-chat');
        router.push('/chat');
    };

    return (
        <aside className={`${styles.sidebar} ${className}`}>
            <div className={styles.sidebarHeader}>
                <button 
                    className={styles.logoButton}
                    onClick={handleLogoClick}
                >
                    <h2>PlateerRAG</h2>
                </button>
            </div>

            <button 
                className={styles.sidebarToggle}
                onClick={toggleChatExpanded}
            >
                <span>채팅하기</span>
                <span className={`${styles.toggleIcon} ${isChatExpanded ? styles.expanded : ''}`}>
                    ▼
                </span>
            </button>

            {isChatExpanded && (
                <nav className={styles.sidebarNav}>
                    <button
                        onClick={handleNewChatClick}
                        className={`${styles.navItem} ${activeItem === 'new-chat' ? styles.active : ''}`}
                    >
                        <RiChatSmileAiLine />
                        <div className={styles.navText}>
                            <div className={styles.navTitle}>새 채팅</div>
                            <div className={styles.navDescription}>
                                새로운 AI 채팅을 시작합니다
                            </div>
                        </div>
                    </button>
                    
                    <button
                        onClick={handleCurrentChatClick}
                        className={`${styles.navItem} ${activeItem === 'current-chat' ? styles.active : ''}`}
                    >
                        <FiMessageCircle />
                        <div className={styles.navText}>
                            <div className={styles.navTitle}>현재 채팅</div>
                            <div className={styles.navDescription}>
                                진행 중인 대화를 계속합니다
                            </div>
                        </div>
                    </button>
                    
                    <button
                        onClick={handleChatHistoryClick}
                        className={`${styles.navItem} ${activeItem === 'chat-history' ? styles.active : ''}`}
                    >
                        <FiClock />
                        <div className={styles.navText}>
                            <div className={styles.navTitle}>기존 채팅 불러오기</div>
                            <div className={styles.navDescription}>
                                이전 대화를 불러와서 계속합니다
                            </div>
                        </div>
                    </button>
                </nav>
            )}

            <button 
                className={styles.sidebarToggle}
                onClick={toggleExpanded}
            >
                <span>AI 워크플로우 관리 센터</span>
                <span className={`${styles.toggleIcon} ${isSettingExpanded ? styles.expanded : ''}`}>
                    ▼
                </span>
            </button>

            {isSettingExpanded && (
                <nav className={styles.sidebarNav}>
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onItemClick(item.id)}
                            className={`${styles.navItem} ${activeItem === item.id ? styles.active : ''}`}
                        >
                            {item.icon}
                            <div className={styles.navText}>
                                <div className={styles.navTitle}>{item.title}</div>
                                <div className={styles.navDescription}>
                                    {item.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </nav>
            )}
        </aside>
    );
};

export default Sidebar;
