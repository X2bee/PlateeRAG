'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { SidebarProps } from '@/app/main/components/types';
import styles from '@/app/main/assets/MainPage.module.scss';
import { logout } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useQuickLogout } from '@/app/_common/utils/logoutUtils';
import { FiChevronLeft, FiLogOut } from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
    getChatSidebarItems,
    getFilteredWorkflowSidebarItems,
    getFilteredTrainSidebarItems
} from '@/app/_common/components/sidebarConfig';
import { devLog } from '@/app/_common/utils/logger';const Sidebar: React.FC<SidebarProps> = ({
    isOpen,
    onToggle,
    workflowItems = [], // 이제 사용하지 않음 (권한에 따라 동적 생성)
    chatItems = [], // 이제 사용하지 않음 (권한에 따라 동적 생성)
    trainItem = [], // 이제 사용하지 않음 (권한에 따라 동적 생성)
    activeItem,
    onItemClick,
    className = '',
    initialChatExpanded = false,
    initialSettingExpanded = false,
    initialWorkflowExpanded = false,
    initialTrainExpanded = false,
}) => {
    const router = useRouter();
    const pathname = usePathname();
    const [isSettingExpanded, setIsSettingExpanded] = useState(initialSettingExpanded);
    const [isChatExpanded, setIsChatExpanded] = useState(initialChatExpanded);
    const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(initialWorkflowExpanded);
    const [isTrainExpanded, setIsTrainExpanded] = useState(initialTrainExpanded);

    // CookieProvider의 useAuth 훅 사용 (AuthGuard에서 이미 인증 검증을 수행하므로 refreshAuth 호출 불필요)
    const { user, isAuthenticated, hasAccessToSection, isInitialized } = useAuth();
    const { quickLogout } = useQuickLogout();

    // 권한에 따라 필터링된 사이드바 아이템들을 메모이제이션
    const filteredItems = useMemo(() => {
        if (!isInitialized || !hasAccessToSection) {
            devLog.log('Sidebar: Not initialized or no hasAccessToSection function');
            return {
                chatItems: [],
                workflowItems: [],
                trainItems: []
            };
        }

        const chatItems = getChatSidebarItems(); // 채팅은 모든 사용자 접근 가능
        const workflowItems = getFilteredWorkflowSidebarItems(hasAccessToSection);
        const trainItems = getFilteredTrainSidebarItems(hasAccessToSection);

        devLog.log('Sidebar: Filtered items:', {
            chatItems: chatItems.length,
            workflowItems: workflowItems.length,
            trainItems: trainItems.length
        });

        return {
            chatItems,
            workflowItems,
            trainItems
        };
    }, [hasAccessToSection, isInitialized]);

    const handleLogout = async () => {
        try {
            // 로그아웃 전에 현재 메인 컨텐츠 페이지를 sessionStorage에 저장
            // /canvas가 아닌 실제 메인 컨텐츠 페이지로 돌아가기 위함
            const fullUrl = window.location.pathname + window.location.search; // 경로 + 쿼리 파라미터
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

    const toggleExpanded = () => setIsSettingExpanded(!isSettingExpanded);
    const toggleChatExpanded = () => setIsChatExpanded(!isChatExpanded);
    const toggleWorkflowExpanded = () => setIsWorkflowExpanded(!isWorkflowExpanded);
    const toggleTrainExpanded = () => setIsTrainExpanded(!isTrainExpanded);


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
                        <Image src="/main_simbol.png" alt="XGEN" width={23} height={0}/>
                        <h2>GEN</h2>
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
                    {filteredItems.chatItems.map((item) => (
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

                {/* 워크플로우 섹션 - 접근 가능한 아이템이 있을 때만 표시 */}
                {filteredItems.workflowItems.length > 0 && (
                    <>
                        <button
                            className={styles.sidebarToggle}
                            onClick={toggleWorkflowExpanded}
                        >
                            <span>워크플로우</span>
                            <span className={`${styles.toggleIcon} ${isWorkflowExpanded ? styles.expanded : ''}`}>
                                ▼
                            </span>
                        </button>

                        <nav className={`${styles.sidebarNav} ${isWorkflowExpanded ? styles.expanded : ''}`}>
                            {filteredItems.workflowItems.map((item) => (
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
                    </>
                )}

                {/* 모델 섹션 - 접근 가능한 아이템이 있을 때만 표시 */}
                {filteredItems.trainItems.length > 0 && (
                    <>
                        <button
                            className={styles.sidebarToggle}
                            onClick={toggleTrainExpanded}
                        >
                            <span>모델</span>
                            <span className={`${styles.toggleIcon} ${isTrainExpanded ? styles.expanded : ''}`}>
                                ▼
                            </span>
                        </button>

                        <nav className={`${styles.sidebarNav} ${isTrainExpanded ? styles.expanded : ''}`}>
                            {filteredItems.trainItems.map((item) => (
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
                    </>
                )}
            </div>
        </motion.aside>
    );
};

export default Sidebar;
