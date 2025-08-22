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
} from 'react-icons/fi';
import { AdminSidebarItem } from '@/app/admin/components/types';

export const getUserItems = ['users', 'user-create', 'user-permissions'];

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
        id: 'user-permissions',
        title: '권한 관리',
        description: '사용자별 권한 설정 및 관리',
        icon: React.createElement(FiShield),
    },
];

export const getSystemItems = ['system-config', 'system-monitor', 'system-health'];

export const getSystemSidebarItems = (): AdminSidebarItem[] => [
    {
        id: 'system-config',
        title: '시스템 설정',
        description: '전역 시스템 설정 및 환경변수',
        icon: React.createElement(FiSettings),
    },
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

export const getSecurityItems = ['security-settings', 'audit-logs', 'error-logs', 'access-logs'];

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
    {
        id: 'access-logs',
        title: '접근 로그',
        description: 'API 및 웹 접근 로그',
        icon: React.createElement(FiFileText),
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
