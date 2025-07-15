"use client";
import React, { useState, RefObject } from 'react';
import styles from '@/app/canvas/assets/SideMenu.module.scss';
import AddNodePanel from '@/app/canvas/components/SideMenuPanel/AddNodePanel';
import ChatPanel from '@/app/canvas/components/SideMenuPanel/ChatPanel';
import WorkflowPanel from '@/app/canvas/components/SideMenuPanel/WorkflowPanel';
import TemplatePanel from '@/app/canvas/components/SideMenuPanel/TemplatePanel';
import { LuCirclePlus, LuCircleHelp, LuSettings, LuLayoutGrid, LuMessageSquare, LuLayoutTemplate } from "react-icons/lu";

// Type definitions
type MenuView = 'main' | 'addNodes' | 'chat' | 'workflow' | 'template';

interface MainMenuProps {
    onNavigate: (view: MenuView) => void;
}

interface SideMenuProps {
    menuRef: RefObject<HTMLElement | null>;
    onLoad: () => void;
    onExport: () => void;
    onLoadWorkflow: (workflowData: any) => void;
}

// Main menu UI
const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
    return (
        <>
            <div className={styles.menuList}>
                <button className={styles.menuItem} onClick={() => onNavigate('addNodes')}>
                    <LuCirclePlus />
                    <span>Add Node</span>
                </button>
                <button className={styles.menuItem} onClick={() => onNavigate('chat')}>
                    <LuMessageSquare />
                    <span>Chat</span>
                </button>
                <button className={styles.menuItem} onClick={() => onNavigate('workflow')}>
                    <LuLayoutGrid />
                    <span>Workflow</span>
                </button>
                <button className={styles.menuItem} onClick={() => onNavigate('template')}>
                    <LuLayoutTemplate />
                    <span>Template</span>
                </button>
                <button className={styles.menuItem}>
                    <LuSettings />
                    <span>Settings</span>
                </button>
                <button className={styles.menuItem}>
                    <LuCircleHelp />
                    <span>Help</span>
                </button>
            </div>
        </>
    );
};

// SideMenu container and view switching logic
const SideMenu: React.FC<SideMenuProps> = ({ 
    menuRef, 
    onLoad, 
    onExport, 
    onLoadWorkflow 
}) => {
    const [view, setView] = useState<MenuView>('main');

    const handleNavigate = (newView: MenuView): void => {
        setView(newView);
    };

    const handleBackToMain = (): void => {
        setView('main');
    };

    return (
        // menuRef is used for external click detection
        <aside ref={menuRef} className={styles.sideMenuContainer} data-view={view}>
            {view === 'main' && <MainMenu onNavigate={handleNavigate} />}
            {view === 'addNodes' && <AddNodePanel onBack={handleBackToMain} />}
            {view === 'chat' && <ChatPanel onBack={handleBackToMain} />}
            {view === 'workflow' && (
                <WorkflowPanel 
                    onBack={handleBackToMain} 
                    onLoad={onLoad}
                    onExport={onExport}
                    onLoadWorkflow={onLoadWorkflow}
                />
            )}
            {view === 'template' && (
                <TemplatePanel 
                    onBack={handleBackToMain} 
                    onLoadWorkflow={onLoadWorkflow}
                />
            )}
        </aside>
    );
};

export default SideMenu;