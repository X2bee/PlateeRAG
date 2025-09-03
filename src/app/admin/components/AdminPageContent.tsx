'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronRight } from 'react-icons/fi';
import AdminSidebar from '@/app/admin/components/AdminSidebar';
import AdminContentArea from '@/app/admin/components/helper/AdminContentArea';
import AdminIntroduction from '@/app/admin/components/AdminIntroduction';
import AdminUserContent from '@/app/admin/components/user/AdminUserContent';
import AdminRegisterUser from '@/app/admin/components/user/AdminRegisterUser';
import AdminConfigViewer from '@/app/admin/components/config/AdminConfigViewer';
import AdminSettings from '@/app/admin/components/config/AdminSettings';
import AdminWorkflowLogsContent from '@/app/admin/components/monitor/AdminWorkflowLogsContent';
import AdminGroupContent from '@/app/admin/components/group/AdminGroupContent';
import AdminPlayground from '@/app/admin/components/monitor/playground/AdminPlayground';
import AdminSystemMonitor from '@/app/admin/components/monitor/AdminSystemMonitor';
import {
    getUserSidebarItems,
    getSettingSidebarItems,
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

    // 워크플로우 모니터링용 탭 상태
    const [workflowTab, setWorkflowTab] = useState<'executor' | 'monitoring' | 'batchtester' | 'test-logs'>('executor');

    const handleWorkflowTabChange = (tab: 'executor' | 'monitoring' | 'batchtester' | 'test-logs') => {
        setWorkflowTab(tab);
        localStorage.setItem('adminWorkflowTab', tab);
    };

    const renderWorkflowToggleButtons = () => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
                onClick={() => handleWorkflowTabChange('executor')}
                style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '6px',
                    background: workflowTab === 'executor' ? 'var(--admin-primary)' : 'transparent',
                    color: workflowTab === 'executor' ? 'white' : 'var(--admin-text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                }}
            >
                실행기
            </button>
            <button
                onClick={() => handleWorkflowTabChange('monitoring')}
                style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '6px',
                    background: workflowTab === 'monitoring' ? 'var(--admin-primary)' : 'transparent',
                    color: workflowTab === 'monitoring' ? 'white' : 'var(--admin-text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                }}
            >
                모니터링
            </button>
            <button
                onClick={() => handleWorkflowTabChange('batchtester')}
                style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '6px',
                    background: workflowTab === 'batchtester' ? 'var(--admin-primary)' : 'transparent',
                    color: workflowTab === 'batchtester' ? 'white' : 'var(--admin-text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                }}
            >
                테스트
            </button>
            <button
                onClick={() => handleWorkflowTabChange('test-logs')}
                style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid var(--admin-border)',
                    borderRadius: '6px',
                    background: workflowTab === 'test-logs' ? 'var(--admin-primary)' : 'transparent',
                    color: workflowTab === 'test-logs' ? 'white' : 'var(--admin-text-primary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                }}
            >
                로그
            </button>
        </div>
    );

    const getWorkflowDescription = () => {
        switch (workflowTab) {
            case 'executor':
                return '워크플로우를 실제 환경에서 실행하고 테스트하세요.';
            case 'monitoring':
                return '워크플로우의 실행 성능과 리소스 사용량을 실시간으로 모니터링하세요.';
            case 'batchtester':
                return '파일을 업로드하여 워크플로우를 배치로 테스트하세요.';
            case 'test-logs':
                return '테스트 실행 로그를 확인하고 관리하세요.';
            default:
                return '워크플로우 실행, 성능 모니터링, 배치 테스트 및 로그를 관리하세요.';
        }
    };

    // 사이드바 토글 함수
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // 사이드바 아이템들
    const userItems = getUserSidebarItems();
    const settingItems = getSettingSidebarItems();
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
            'users', 'user-create', 'group-permissions',
            'system-config', 'system-settings', 'chat-monitoring', 'workflow-monitoring', 'system-monitor', 'system-health',
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
                        description="승인 대기 중인 사용자 계정을 확인하고 승인하세요."
                    >
                        <AdminRegisterUser />
                    </AdminContentArea>
                );
            case 'group-permissions':
                return (
                    <AdminContentArea
                        title="조직 권한 관리"
                        description="조직을 생성하고 사용자를 조직에 할당하여 권한을 관리하세요."
                    >
                        <AdminGroupContent />
                    </AdminContentArea>
                );
            case 'system-config':
                return (
                    <AdminContentArea
                        title="시스템 설정"
                        description="전역 시스템 설정 및 환경변수를 관리하세요."
                    >
                        <AdminConfigViewer />
                    </AdminContentArea>
                );
            case 'system-settings':
                return (
                    <AdminContentArea
                        title="시스템 세부 설정"
                        description="LLM, 데이터베이스, 벡터DB 등 시스템 구성 요소들을 상세하게 설정하세요."
                    >
                        <AdminSettings />
                    </AdminContentArea>
                );
            case 'chat-monitoring':
                return (
                    <AdminContentArea
                        title="채팅 모니터링"
                        description="실시간 채팅 활동 및 상태를 모니터링하세요."
                    >
                        <AdminWorkflowLogsContent />
                    </AdminContentArea>
                );
            case 'workflow-monitoring':
                return (
                    <AdminContentArea
                        title="워크플로우 모니터링"
                        description={getWorkflowDescription()}
                        headerButtons={renderWorkflowToggleButtons()}
                    >
                        <AdminPlayground activeTab={workflowTab} onTabChange={handleWorkflowTabChange} />
                    </AdminContentArea>
                );
            case 'system-monitor':
                return (
                    <AdminContentArea
                        title="시스템 모니터링"
                        description="실시간 시스템 성능 및 리소스를 모니터링하세요."
                    >
                        <AdminSystemMonitor />
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
            <AnimatePresence>
                <AdminSidebar
                    key="admin-sidebar"
                    isOpen={isSidebarOpen}
                    onToggle={toggleSidebar}
                    userItems={userItems}
                    settingItems={settingItems}
                    systemItems={systemItems}
                    dataItems={dataItems}
                    securityItems={securityItems}
                    activeItem={activeSection}
                    onItemClick={(itemId: string) => setActiveSection(itemId)}
                    initialUserExpanded={['users', 'user-create', 'group-permissions'].includes(activeSection)}
                    initialSystemExpanded={['system-config', 'system-settings', 'chat-monitoring', 'workflow-monitoring', 'system-monitor', 'system-health'].includes(activeSection)}
                    initialDataExpanded={['database', 'storage', 'backup'].includes(activeSection)}
                    initialSecurityExpanded={['security-settings', 'audit-logs', 'error-logs', 'access-logs'].includes(activeSection)}
                />
                {!isSidebarOpen && (
                    <motion.button
                        key="admin-sidebar-open-button"
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

export default AdminPageContent;
