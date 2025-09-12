'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';
import ManagerSidebar from '@/app/manager/components/ManagerSidebar';
import ManagerContentArea from '@/app/manager/components/helper/ManagerContentArea';
import ManagerGroupContent from '@/app/manager/components/group/ManagerGroupContent';
import {
    getGroupSidebarItems,
    createManagerItemClickHandler,
} from '@/app/manager/components/managerSidebarConfig';
import styles from '@/app/manager/assets/ManagerPage.module.scss';

const ManagerPageContent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<string>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 사이드바 토글 함수
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // 사이드바 아이템들
    const groupItems = getGroupSidebarItems();

    // 아이템 클릭 핸들러
    const handleItemClick = createManagerItemClickHandler(router);

    useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            setActiveSection(view);
        } else {
            // localStorage에서 저장된 섹션 불러오기
            const savedSection = localStorage.getItem('managerActiveSection');
            if (savedSection && isValidSection(savedSection)) {
                setActiveSection(savedSection);
            } else {
                setActiveSection('group-permissions'); // 기본값을 그룹 권한으로 설정
            }
        }
    }, [searchParams]);

    // 유효한 섹션인지 확인하는 함수
    const isValidSection = (section: string): boolean => {
        const validSections = [
            'dashboard', 'group-permissions'
        ];
        return validSections.includes(section);
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <ManagerContentArea
                        title="매니저 대시보드"
                        description="조직 관리를 위한 전용 관리 환경입니다."
                    >
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <h3>조직 관리 대시보드</h3>
                            <p>좌측 메뉴에서 '조직 권한 관리'를 선택하여 시작하세요.</p>
                        </div>
                    </ManagerContentArea>
                );
            case 'group-permissions':
                return (
                    <ManagerContentArea
                        title="조직 권한 관리"
                        description="조직을 생성하고 사용자를 조직에 할당하여 권한을 관리하세요."
                    >
                        <ManagerGroupContent />
                    </ManagerContentArea>
                );
            default:
                return (
                    <ManagerContentArea
                        title="조직 권한 관리"
                        description="조직을 생성하고 사용자를 조직에 할당하여 권한을 관리하세요."
                    >
                        <ManagerGroupContent />
                    </ManagerContentArea>
                );
        }
    };

    return (
        <div className={styles.container}>
            <AnimatePresence>
                <ManagerSidebar
                    key="manager-sidebar"
                    isOpen={isSidebarOpen}
                    onToggle={toggleSidebar}
                    groupItems={groupItems}
                    activeItem={activeSection}
                    onItemClick={(itemId: string) => setActiveSection(itemId)}
                    initialGroupExpanded={['group-permissions'].includes(activeSection)}
                />
                {!isSidebarOpen && (
                    <motion.button
                        key="manager-sidebar-open-button"
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

            <main className={`${styles.mainContent} ${!isSidebarOpen ? styles.mainContentPushed : ''}`}>
                {renderContent()}
            </main>
        </div>
    );
};

export default ManagerPageContent;
