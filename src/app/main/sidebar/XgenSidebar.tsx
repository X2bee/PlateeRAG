'use client';
import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import styles from '@/app/main/sidebar/Sidebar.module.scss';
import { logout } from '@/app/_common/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { useQuickLogout } from '@/app/_common/utils/logoutUtils';
import { FiChevronLeft, FiLogOut, FiSettings } from 'react-icons/fi';
import { motion } from 'framer-motion';
import {
    getChatSidebarItems,
    getFilteredWorkflowSidebarItems,
    getFilteredTrainSidebarItems,
    getFilteredDataSidebarItems
} from '@/app/main/sidebar/sidebarConfig';
import { devLog } from '@/app/_common/utils/logger';

interface XgenSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
}

const XgenSidebar: React.FC<XgenSidebarProps> = ({
    isOpen,
    onToggle,
    activeItem,
    onItemClick,
    className = '',
}) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isChatExpanded, setIsChatExpanded] = useState(true); // 기본적으로 채팅 섹션 확장
    const [isWorkflowExpanded, setIsWorkflowExpanded] = useState(false);
    const [isDataExpanded, setIsDataExpanded] = useState(false);
    const [isTrainExpanded, setIsTrainExpanded] = useState(false);

    const { user, hasAccessToSection, isInitialized } = useAuth();
    const { quickLogout } = useQuickLogout();

    // URL 파라미터를 기반으로 초기 확장 상태 설정
    React.useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            const chatItems = ['new-chat', 'current-chat', 'chat-history'];
            const workflowItems = ['canvas', 'workflows', 'documents'];
            const dataItems = ['data-station', 'data-storage'];
            const trainItems = ['train', 'train-monitor', 'eval', 'model-storage'];

            if (chatItems.includes(view)) {
                setIsChatExpanded(true);
                setIsWorkflowExpanded(false);
                setIsDataExpanded(false);
                setIsTrainExpanded(false);
            } else if (workflowItems.includes(view)) {
                setIsChatExpanded(false);
                setIsWorkflowExpanded(true);
                setIsDataExpanded(false);
                setIsTrainExpanded(false);
            } else if (dataItems.includes(view)) {
                setIsChatExpanded(false);
                setIsWorkflowExpanded(false);
                setIsDataExpanded(true);
                setIsTrainExpanded(false);
            } else if (trainItems.includes(view)) {
                setIsChatExpanded(false);
                setIsWorkflowExpanded(false);
                setIsDataExpanded(false);
                setIsTrainExpanded(true);
            }
        }
    }, [searchParams]);

    // 권한에 따라 필터링된 사이드바 아이템들을 메모이제이션
    const filteredItems = useMemo(() => {
        if (!isInitialized || !hasAccessToSection) {
            devLog.log('XgenSidebar: Not initialized or no hasAccessToSection function');
            return {
                chatItems: [],
                workflowItems: [],
                dataItems: [],
                trainItems: []
            };
        }

        const chatItems = getChatSidebarItems();
        const workflowItems = getFilteredWorkflowSidebarItems(hasAccessToSection);
        const dataItems = getFilteredDataSidebarItems(hasAccessToSection);
        const trainItems = getFilteredTrainSidebarItems(hasAccessToSection);

        devLog.log('XgenSidebar: Filtered items:', {
            chatItems: chatItems.length,
            workflowItems: workflowItems.length,
            dataItems: dataItems.length,
            trainItems: trainItems.length
        });

        return {
            chatItems,
            workflowItems,
            dataItems,
            trainItems
        };
    }, [hasAccessToSection, isInitialized]);

    const handleLogout = async () => {
        try {
            // 로그아웃 전에 현재 페이지를 sessionStorage에 저장
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

    const toggleChatExpanded = () => setIsChatExpanded(!isChatExpanded);
    const toggleWorkflowExpanded = () => setIsWorkflowExpanded(!isWorkflowExpanded);
    const toggleDataExpanded = () => setIsDataExpanded(!isDataExpanded);
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
                    <div className={styles.headerTop}>
                        <button
                            className={styles.logoButton}
                            onClick={handleLogoClick}
                        >
                            <Image src="/main_simbol.png" alt="XGEN" width={23} height={0}/>
                            <h2>GEN</h2>
                        </button>
                        {hasAccessToSection && hasAccessToSection('admin-page') && (
                            <button
                                onClick={() => router.push('/admin')}
                                className={styles.settingsButton}
                                title="관리자 페이지"
                            >
                                <FiSettings />
                            </button>
                        )}
                        {hasAccessToSection && hasAccessToSection('manager-page') && (
                            <button
                                onClick={() => router.push('/manager')}
                                className={styles.settingsButton}
                                title="매니저 페이지"
                            >
                                <FiSettings />
                            </button>
                        )}
                    </div>
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

                {/* 채팅 섹션 - 항상 표시 */}
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

                {/* 데이터 섹션 - 접근 가능한 아이템이 있을 때만 표시 */}
                {filteredItems.dataItems.length > 0 && (
                    <>
                        <button
                            className={styles.sidebarToggle}
                            onClick={toggleDataExpanded}
                        >
                            <span>데이터</span>
                            <span className={`${styles.toggleIcon} ${isDataExpanded ? styles.expanded : ''}`}>
                                ▼
                            </span>
                        </button>

                        <nav className={`${styles.sidebarNav} ${isDataExpanded ? styles.expanded : ''}`}>
                            {filteredItems.dataItems.map((item) => (
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

export default XgenSidebar;
