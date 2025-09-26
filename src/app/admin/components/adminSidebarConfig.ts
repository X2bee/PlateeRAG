import React from 'react';
import {
    FiUsers,
    FiUserPlus,
    FiUserCheck,
    FiShield,
    FiSettings,
    FiActivity,
    FiServer,
    FiDatabase,
    FiHardDrive,
    FiArchive,
    FiLock,
    FiEye,
    FiFileText,
    FiAlertTriangle,
    FiMessageSquare,
    FiBarChart,
    FiPackage,
    FiGrid,
} from 'react-icons/fi';
import { AdminSidebarItem } from '@/app/admin/components/types';

export const getUserItems = ['users', 'user-create', 'group-permissions'];

export const getUserSidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'users',
        title: '사용자 목록',
        description: '등록된 사용자 목록 및 상태 관리',
        icon: React.createElement(FiUsers),
    },
    {
        id: 'user-create',
        title: '사용자 등록',
        description: '새로운 사용자 계정 생성',
        icon: React.createElement(FiUserPlus),
    },
    {
        id: 'group-permissions',
        title: '조직 및 권한 관리',
        description: '조직별 권한 설정 및 관리',
        icon: React.createElement(FiShield),
    },
];

export const getWorkflowItems = ['workflow-management', 'workflow-monitoring', 'chat-monitoring'];

export const getWorkflowSidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'workflow-management',
        title: '워크플로우 관리',
        description: '워크플로우 생성, 편집, 삭제 및 관리',
        icon: React.createElement(FiSettings),
    },
    {
        id: 'workflow-monitoring',
        title: '워크플로우 모니터링',
        description: '워크플로우 실행, 성능 분석, 배치 테스트',
        icon: React.createElement(FiBarChart),
    },
    {
        id: 'chat-monitoring',
        title: '채팅 모니터링',
        description: '실시간 채팅 활동 및 상태 모니터링',
        icon: React.createElement(FiMessageSquare),
    },
];

export const getSettingItems = ['system-config', 'system-settings'];

export const getSettingSidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'system-settings',
        title: '시스템 설정',
        description: 'LLM, 데이터베이스, 벡터DB 등',
        icon: React.createElement(FiServer),
    },
    {
        id: 'system-config',
        title: '시스템 세부 설정',
        description: '전역 시스템 설정 및 환경변수',
        icon: React.createElement(FiSettings),
    },
];

export const getSystemItems = ['system-monitor', 'system-health', 'backend-logs'];

export const getSystemSidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'system-monitor',
        title: '시스템 모니터링',
        description: '실시간 시스템 성능 및 리소스 모니터링',
        icon: React.createElement(FiActivity),
    },
    {
        id: 'system-health',
        title: '시스템 상태',
        description: '서버 상태 및 서비스 건강성 체크',
        icon: React.createElement(FiServer),
    },
    {
        id: 'backend-logs',
        title: '접근 로그',
        description: 'API 및 웹 접근 로그',
        icon: React.createElement(FiFileText),
    },
];

export const getDataItems = ['database', 'storage', 'backup'];

export const getDataSidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'database',
        title: '데이터베이스 관리',
        description: '데이터베이스 상태 및 최적화',
        icon: React.createElement(FiDatabase),
    },
    {
        id: 'storage',
        title: '스토리지 관리',
        description: '파일 시스템 및 저장공간 관리',
        icon: React.createElement(FiHardDrive),
    },
    {
        id: 'backup',
        title: '백업 관리',
        description: '데이터 백업 및 복구 관리',
        icon: React.createElement(FiArchive),
    },
];

export const getSecurityItems = ['security-settings', 'audit-logs', 'error-logs'];

export const getSecuritySidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'security-settings',
        title: '보안 설정',
        description: '보안 정책 및 인증 설정',
        icon: React.createElement(FiLock),
    },
    {
        id: 'audit-logs',
        title: '감사 로그',
        description: '사용자 활동 및 시스템 변경 로그',
        icon: React.createElement(FiEye),
    },
    {
        id: 'error-logs',
        title: '에러 로그',
        description: '시스템 오류 및 예외 로그',
        icon: React.createElement(FiAlertTriangle),
    },
];

export const getMCPItems = ['mcp-market'];

export const getMCPSidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'mcp-market',
        title: 'MCP 마켓',
        description: 'Model Context Protocol 확장 프로그램 검색 및 관리',
        icon: React.createElement(FiPackage),
    },
];

// 공통 아이템 클릭 핸들러 (localStorage 사용)
export const createAdminItemClickHandler = (router: any) => {
    return (itemId: string) => {
        // 클릭한 섹션을 localStorage에 저장하고 /admin으로 이동
        localStorage.setItem('adminActiveSection', itemId);
        router.push('/admin');
    };
};
