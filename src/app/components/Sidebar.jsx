"use client";
import React, { useState } from 'react';
import styles from '@/app/assets/Sidebar.module.scss';
import AddNodePanel from './AddNodePanel';
import { LuCirclePlus, LuCircleHelp, LuSettings, LuLayoutGrid } from "react-icons/lu";

const MainMenu = ({ onNavigate  }) => {
    return (
        <>
            <div className={styles.header}>
                <h3>Menu</h3>
            </div>
            <div className={styles.mainMenu}>
                <button className={styles.menuItem} onClick={() => onNavigate('addNodes')}>
                    <LuCirclePlus />
                    <span>Add Node</span>
                </button>
                <button className={styles.menuItem}>
                    <LuLayoutGrid />
                    <span>Example 1</span>
                </button>
                <button className={styles.menuItem}>
                    <LuSettings />
                    <span>Example 2</span>
                </button>
                <button className={styles.menuItem}>
                    <LuCircleHelp />
                    <span>Help</span>
                </button>
            </div>
        </>
    );
};

const Sidebar = () => {
    const [view, setView] = useState('main');

    return (
        <aside className={styles.sidebar}>
            {view === 'main' && <MainMenu onNavigate={setView} />}
            {view === 'addNodes' && <AddNodePanel onBack={() => setView('main')} />}
        </aside>
    );
};

export default Sidebar;