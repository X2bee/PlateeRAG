import { ReactNode } from 'react';

export interface AdminSidebarItem {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
}

export interface AdminSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    userItems?: AdminSidebarItem[];
    systemItems?: AdminSidebarItem[];
    dataItems?: AdminSidebarItem[];
    securityItems?: AdminSidebarItem[];
    activeItem: string;
    onItemClick: (itemId: string) => void;
    className?: string;
    initialUserExpanded?: boolean;
    initialSystemExpanded?: boolean;
    initialDataExpanded?: boolean;
    initialSecurityExpanded?: boolean;
}

export interface AdminContentAreaProps {
    title: string;
    description: string;
    children: ReactNode;
    className?: string;
    headerButtons?: ReactNode;
}
