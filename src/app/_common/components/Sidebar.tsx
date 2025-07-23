'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SidebarProps } from '@/app/main/components/types';
import styles from '@/app/main/assets/MainPage.module.scss';
import { logout } from '@/app/api/authAPI';
import { useAuth } from '@/app/_common/components/CookieProvider';
import { FiLogOut } from 'react-icons/fi';

const Sidebar: React.FC<SidebarProps> = ({
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
    const { user, isAuthenticated, clearAuth } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            clearAuth(); // CookieProvider를 통한 인증 정보 정리
            toast.success('로그아웃되었습니다.');
            router.push('/'); // 홈페이지로 리다이렉트
        } catch (error) {
            console.error('Logout failed:', error);
            // 로그아웃 실패해도 UI는 업데이트 (스토리지는 이미 정리됨)
            clearAuth();
            toast.error('로그아웃 처리 중 오류가 발생했습니다.');
            router.push('/'); // 홈페이지로 리다이렉트
        }
    };

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

    const handleChatItemClick = (itemId: string) => {
        onItemClick(itemId);
        // /chat 페이지가 아닌 경우에만 localStorage에 저장하고 라우팅
        if (pathname !== '/chat') {
            localStorage.setItem('activeChatSection', itemId);
            router.push('/chat');
        }
    };

    return (
        <aside className={`${styles.sidebar} ${className}`}>
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

            {isChatExpanded && (
                <nav className={styles.sidebarNav}>
                    {chatItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => handleChatItemClick(item.id)}
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
