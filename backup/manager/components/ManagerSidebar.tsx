'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { ManagerSidebarProps } from '@/app/manager/components/types';
import styles from '@/app/manager/assets/ManagerPage.module.scss';
import { logout } from '@/app/_common/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useQuickLogout } from '@/app/_common/utils/logoutUtils';
import { FiChevronLeft, FiLogOut, FiMessageCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

const ManagerSidebar: React.FC<ManagerSidebarProps> = ({
    isOpen,
    onToggle,
    groupItems = [],
    workflowItems = [],
    activeItem,
    onItemClick,
    className = '',
    initialGroupExpanded = false,
    initialWorkflowExpanded = false,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isGroupExpanded, setIsGroupExpanded] = useState(initialGroupExpanded);
    const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(initialWorkflowExpanded);

    // CookieProvider의 useAuth 훅 사용
    const { user, isAuthenticated } = useAuth();
    const { quickLogout } = useQuickLogout();

    const handleLogout = async () => {
        try {
            // 로그아웃 전에 현재 메인 컨텐츠 페이지를 sessionStorage에 저장
            const fullUrl = window.location.pathname + window.location.search;
            if (fullUrl && !fullUrl.includes('/login') && !fullUrl.includes('/signup')) {
                sessionStorage.setItem('logoutFromPage', fullUrl);
            }

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

    const toggleGroupExpanded = () => setIsGroupExpanded(!isGroupExpanded);
    const toggleWorkflowExpanded = () => setIsWorkflowExpanded(!isWorkflowExpanded);

    const handleLogoClick = () => {
        onItemClick('dashboard');
    };

    return (
        <motion.aside
            className={`${styles.sidebar} ${className}`}
            initial={{ x: "-100%" }}
            animate={{ x: isOpen ? 0 : "-100%" }}
            transition={{ type: "tween", duration: 0.3 }}
        >
            <button onClick={onToggle} className={styles.closeOnlyBtn}>
                <FiChevronLeft />
            </button>
            <div className={styles.sidebarContent}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.headerTop}>
                        <button
                            className={styles.logoButton}
                            onClick={handleLogoClick}
                        >
                            <Image src="/main_simbol.png" alt="MANAGER" width={23} height={0} />
                            <h2>MANAGER</h2>
                        </button>
                        <button
                            onClick={() => router.push('/main')}
                            className={styles.chatButton}
                            title="채팅으로 돌아가기"
                        >
                            <FiMessageCircle />
                        </button>
                    </div>
                    {user && (
                        <div className={styles.userInfo}>
                            <div className={styles.welcomeText}>
                                <span>매니저 모드</span>
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
                    onClick={toggleGroupExpanded}
                >
                    <span>조직 관리</span>
                    <span className={`${styles.toggleIcon} ${isGroupExpanded ? styles.expanded : ''}`}>
                        ▼
                    </span>
                </button>

                <nav className={`${styles.sidebarNav} ${isGroupExpanded ? styles.expanded : ''}`}>
                    {groupItems.map((item: any) => (
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
                    onClick={toggleWorkflowExpanded}
                >
                    <span>워크플로우 관리</span>
                    <span className={`${styles.toggleIcon} ${isWorkflowExpanded ? styles.expanded : ''}`}>
                        ▼
                    </span>
                </button>

                <nav className={`${styles.sidebarNav} ${isWorkflowExpanded ? styles.expanded : ''}`}>
                    {workflowItems.map((item: any) => (
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

export default ManagerSidebar;
