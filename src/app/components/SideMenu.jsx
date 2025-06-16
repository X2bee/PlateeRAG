"use client";
import React, { useState } from 'react';
import styles from '@/app/assets/SideMenu.module.scss';
import AddNodePanel from './AddNodePanel';
import Chat from './Chat'; // Import the Chat component
import { LuCirclePlus, LuCircleHelp, LuSettings, LuLayoutGrid, LuMessageSquare } from "react-icons/lu";

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
                <button className={styles.menuItem}>
                    <LuLayoutGrid />
                    <span>Templates</span>
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
const SideMenu = ({ menuRef }) => {
    const [view, setView] = useState('main');

    return (
        // menuRef를 받아 외부 클릭 감지에 사용
        <aside ref={menuRef} className={styles.sideMenuContainer} data-view={view}>
            {view === 'main' && <MainMenu onNavigate={setView} />}
            {view === 'addNodes' && <AddNodePanel onBack={() => setView('main')} />}
            {view === 'chat' && <Chat onBack={() => setView('main')} />}
        </aside>
    );
};

export default SideMenu;