'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import AdminSidebar from '@/app/admin/components/AdminSidebar';
import AdminContentArea from '@/app/admin/components/AdminContentArea';
import AdminIntroduction from '@/app/admin/components/AdminIntroduction';
import AdminUserContent from '@/app/admin/components/AdminUserContent';
import {
    getUserSidebarItems,
    getSystemSidebarItems,
    getDataSidebarItems,
    getSecuritySidebarItems,
    createAdminItemClickHandler,
} from '@/app/admin/components/adminSidebarConfig';
import styles from '@/app/admin/assets/AdminPage.module.scss';

const AdminPageContent: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeSection, setActiveSection] = useState<string>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // 사이드바 토글 함수
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // 사이드바 아이템들
    const userItems = getUserSidebarItems();
    const systemItems = getSystemSidebarItems();
    const dataItems = getDataSidebarItems();
    const securityItems = getSecuritySidebarItems();

    // 아이템 클릭 핸들러
    const handleItemClick = createAdminItemClickHandler(router);

    useEffect(() => {
        const view = searchParams.get('view');
        if (view) {
            setActiveSection(view);
        } else {
            // localStorage에서 저장된 섹션 불러오기
            const savedSection = localStorage.getItem('adminActiveSection');
            if (savedSection && isValidSection(savedSection)) {
                setActiveSection(savedSection);
            } else {
                setActiveSection('dashboard'); // 기본값 설정
            }
        }
    }, [searchParams]);

    // 유효한 섹션인지 확인하는 함수
    const isValidSection = (section: string): boolean => {
        const validSections = [
            'dashboard',
            'users', 'user-create', 'user-permissions',
            'system-config', 'system-monitor', 'system-health',
            'database', 'storage', 'backup',
            'security-settings', 'audit-logs', 'error-logs', 'access-logs'
        ];
        return validSections.includes(section);
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <AdminContentArea
                        title="관리자 대시보드"
                        description="시스템 전반을 관리하고 모니터링할 수 있는 통합 관리 환경입니다."
                    >
                        <AdminIntroduction />
                    </AdminContentArea>
                );
            case 'users':
                return (
                    <AdminContentArea
                        title="사용자 목록"
                        description="등록된 사용자 목록을 확인하고 관리하세요."
                    >
                        <AdminUserContent />
                    </AdminContentArea>
                );
            case 'user-create':
                return (
                    <AdminContentArea
                        title="사용자 등록"
                        description="새로운 사용자 계정을 생성하세요."
                    >
                        <div>사용자 등록 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'user-permissions':
                return (
                    <AdminContentArea
                        title="권한 관리"
                        description="사용자별 권한을 설정하고 관리하세요."
                    >
                        <div>권한 관리 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'system-config':
                return (
                    <AdminContentArea
                        title="시스템 설정"
                        description="전역 시스템 설정 및 환경변수를 관리하세요."
                    >
                        <div>시스템 설정 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'system-monitor':
                return (
                    <AdminContentArea
                        title="시스템 모니터링"
                        description="실시간 시스템 성능 및 리소스를 모니터링하세요."
                    >
                        <div>시스템 모니터링 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'system-health':
                return (
                    <AdminContentArea
                        title="시스템 상태"
                        description="서버 상태 및 서비스 건강성을 체크하세요."
                    >
                        <div>시스템 상태 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'database':
                return (
                    <AdminContentArea
                        title="데이터베이스 관리"
                        description="데이터베이스 상태를 확인하고 최적화하세요."
                    >
                        <div>데이터베이스 관리 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'storage':
                return (
                    <AdminContentArea
                        title="스토리지 관리"
                        description="파일 시스템 및 저장공간을 관리하세요."
                    >
                        <div>스토리지 관리 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'backup':
                return (
                    <AdminContentArea
                        title="백업 관리"
                        description="데이터 백업 및 복구를 관리하세요."
                    >
                        <div>백업 관리 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'security-settings':
                return (
                    <AdminContentArea
                        title="보안 설정"
                        description="보안 정책 및 인증을 설정하세요."
                    >
                        <div>보안 설정 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'audit-logs':
                return (
                    <AdminContentArea
                        title="감사 로그"
                        description="사용자 활동 및 시스템 변경 로그를 확인하세요."
                    >
                        <div>감사 로그 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'error-logs':
                return (
                    <AdminContentArea
                        title="에러 로그"
                        description="시스템 오류 및 예외 로그를 확인하세요."
                    >
                        <div>에러 로그 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            case 'access-logs':
                return (
                    <AdminContentArea
                        title="접근 로그"
                        description="API 및 웹 접근 로그를 확인하세요."
                    >
                        <div>접근 로그 컴포넌트가 여기에 표시됩니다.</div>
                    </AdminContentArea>
                );
            default:
                return (
                    <AdminContentArea
                        title="관리자 대시보드"
                        description="시스템 전반을 관리하고 모니터링할 수 있는 통합 관리 환경입니다."
                    >
                        <AdminIntroduction />
                    </AdminContentArea>
                );
        }
    };

    return (
        <div className={styles.container}>
            <AdminSidebar
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
                userItems={userItems}
                systemItems={systemItems}
                dataItems={dataItems}
                securityItems={securityItems}
                activeItem={activeSection}
                onItemClick={(itemId: string) => setActiveSection(itemId)}
                initialUserExpanded={['users', 'user-create', 'user-permissions'].includes(activeSection)}
                initialSystemExpanded={['system-config', 'system-monitor', 'system-health'].includes(activeSection)}
                initialDataExpanded={['database', 'storage', 'backup'].includes(activeSection)}
                initialSecurityExpanded={['security-settings', 'audit-logs', 'error-logs', 'access-logs'].includes(activeSection)}
            />

            {!isSidebarOpen && (
                <button onClick={toggleSidebar} className={styles.openOnlyBtn}>
                    ▶
                </button>
            )}

            <main className={`${styles.mainContent} ${!isSidebarOpen ? styles.mainContentPushed : ''}`}>
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminPageContent;
