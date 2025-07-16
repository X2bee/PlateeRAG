'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProps } from '@/app/main/components/types';
import styles from '@/app/main/assets/MainPage.module.scss';

const Sidebar: React.FC<SidebarProps> = ({
    items,
    activeItem,
    onItemClick,
    className = '',
}) => {
    const router = useRouter();
    const [isSettingExpanded, setIsSettingExpanded] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);

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
                        onClick={() => onItemClick('new-chat')}
                        className={`${styles.navItem} ${activeItem === 'new-chat' ? styles.active : ''}`}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C13.1 2 14 2.9 14 4V8C14 9.1 13.1 10 12 10C10.9 10 10 9.1 10 8V4C10 2.9 10.9 2 12 2ZM21 9V7L19 7C18.5 5.8 17.7 4.7 16.6 3.9L17.6 2.9C18 2.5 18 1.9 17.6 1.5S16.5 1.1 16.1 1.5L15.1 2.5C14.3 2.2 13.4 2 12.5 2H11.5C10.6 2 9.7 2.2 8.9 2.5L7.9 1.5C7.5 1.1 6.9 1.1 6.5 1.5S6.1 2.5 6.5 2.9L7.5 3.9C6.4 4.7 5.6 5.8 5.1 7H3V9H5.1C5.6 10.2 6.4 11.3 7.5 12.1L6.5 13.1C6.1 13.5 6.1 14.1 6.5 14.5S7.5 14.9 7.9 14.5L8.9 13.5C9.7 13.8 10.6 14 11.5 14H12.5C13.4 14 14.3 13.8 15.1 13.5L16.1 14.5C16.5 14.9 17.1 14.9 17.5 14.5S17.9 13.5 17.5 13.1L16.5 12.1C17.6 11.3 18.4 10.2 18.9 9H21Z"/>
                        </svg>
                        <div className={styles.navText}>
                            <div className={styles.navTitle}>새 채팅</div>
                            <div className={styles.navDescription}>
                                새로운 AI 채팅을 시작합니다
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
