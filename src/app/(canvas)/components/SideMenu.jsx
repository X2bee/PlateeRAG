"use client";
import React, { useState } from 'react';
import styles from '@/app/(canvas)/assets/SideMenu.module.scss';
import AddNodePanel from '@/app/(canvas)/components/SideMenuPanel/AddNodePanel';
import ChatPanel from '@/app/(canvas)/components/SideMenuPanel/ChatPanel';
import WorkflowPanel from '@/app/(canvas)/components/SideMenuPanel/WorkflowPanel';
import TemplatePanel from '@/app/(canvas)/components/SideMenuPanel/TemplatePanel';
import { LuCirclePlus, LuCircleHelp, LuSettings, LuLayoutGrid, LuMessageSquare, LuLayoutTemplate } from "react-icons/lu";

// 메인 메뉴 UI
const MainMenu = ({ onNavigate }) => {
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

// SideMenu의 전체 컨테이너 및 뷰 전환 로직
const SideMenu = ({ menuRef, onLoad, onExport, onLoadWorkflow }) => {
    const [view, setView] = useState('main');

    return (
        // menuRef를 받아 외부 클릭 감지에 사용
        <aside ref={menuRef} className={styles.sideMenuContainer} data-view={view}>
            {view === 'main' && <MainMenu onNavigate={setView} />}
            {view === 'addNodes' && <AddNodePanel onBack={() => setView('main')} />}
            {view === 'chat' && <ChatPanel onBack={() => setView('main')} />}
            {view === 'workflow' && (
                <WorkflowPanel 
                    onBack={() => setView('main')} 
                    onLoad={onLoad}
                    onExport={onExport}
                    onLoadWorkflow={onLoadWorkflow}
                />
            )}
            {view === 'template' && (
                <TemplatePanel 
                    onBack={() => setView('main')} 
                    onLoadWorkflow={onLoadWorkflow}
                />
            )}
        </aside>
    );
};

export default SideMenu;