'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SidebarProps } from '@/app/main/components/types';
import styles from '@/app/main/assets/MainPage.module.scss';
import { logout } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useQuickLogout } from '@/app/_common/utils/logoutUtils';
import { FiChevronLeft, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';

const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onToggle,
    items,
    chatItems = [],
    activeItem,
    onItemClick,
    className = '',
    initialChatExpanded = false,
    initialSettingExpanded = false,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isSettingExpanded, setIsSettingExpanded] = useState(initialSettingExpanded);
    const [isChatExpanded, setIsChatExpanded] = useState(initialChatExpanded);

    // CookieProvider의 useAuth 훅 사용 (AuthGuard에서 이미 인증 검증을 수행하므로 refreshAuth 호출 불필요)
    const { user, isAuthenticated } = useAuth();
    const { quickLogout } = useQuickLogout();

    const handleLogout = async () => {
        try {
            // 서버에 로그아웃 요청
            await logout();
            // 통합 로그아웃 처리 (localStorage 정리 포함)
            quickLogout();
        } catch (error) {
            console.error('Logout API failed:', error);
            // API 실패해도 클라이언트는 로그아웃 처리
            quickLogout();
        }
    };

    const toggleExpanded = () => setIsSettingExpanded(!isSettingExpanded);
    const toggleChatExpanded = () => setIsChatExpanded(!isChatExpanded);

    const handleLogoClick = () => {
        router.push('/');
    };

    return (
        <motion.aside
            className={`${styles.sidebar} ${className} ${isOpen ? styles.open : styles.closed}`}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}

        >
            <button onClick={onToggle} className={styles.closeOnlyBtn}>
                <FiChevronLeft />
            </button>
            <div className={styles.sidebarContent}>
                <div className={styles.sidebarHeader}>
                    <button
                        className={styles.logoButton}
                        onClick={handleLogoClick}
                    >
                        <h2>Prague</h2>
                    </button>
                    {user && (
                        <div className={styles.userInfo}>
                            <div className={styles.welcomeText}>
                                <span>환영합니다</span>
                                <span className={styles.username}>{user.username}님</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className={styles.logoutButton}
                                title="로그아웃"
                            >
                                <FiLogOut />
                            </button>
                        </div>
                    )}
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

                <nav className={`${styles.sidebarNav} ${isChatExpanded ? styles.expanded : ''}`}>
                    {chatItems.map((item) => (
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

                <button
                    className={styles.sidebarToggle}
                    onClick={toggleExpanded}
                >
                    <span>AI 워크플로우 관리 센터</span>
                    <span className={`${styles.toggleIcon} ${isSettingExpanded ? styles.expanded : ''}`}>
                        ▼
                    </span>
                </button>

                <nav className={`${styles.sidebarNav} ${isSettingExpanded ? styles.expanded : ''}`}>
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
            </div>
        </motion.aside>
    );
};

export default Sidebar;
