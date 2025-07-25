import { ReactNode } from 'react';

export interface SidebarItem {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
}

export interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    items: SidebarItem[];
    chatItems?: SidebarItem[];
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
    initialChatExpanded?: boolean;
    initialSettingExpanded?: boolean;
}

export interface ContentAreaProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
    headerButtons?: ReactNode; // 헤더 우측에 표시할 버튼 추가
}
