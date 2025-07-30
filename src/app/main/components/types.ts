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
    workflowItems?: SidebarItem[];
    chatItems?: SidebarItem[];
    trainItem?: SidebarItem[];
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
    initialChatExpanded?: boolean;
    initialSettingExpanded?: boolean;
    initialWorkflowExpanded?: boolean;
    initialTrainExpanded?: boolean;
}

export interface ContentAreaProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
    headerButtons?: ReactNode; // 헤더 우측에 표시할 버튼 추가
}
