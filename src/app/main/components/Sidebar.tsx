'use client';
import React from 'react';
import { SidebarProps } from '@/app/main/components/types';
import styles from '@/app/main/assets/MainPage.module.scss';

const Sidebar: React.FC<SidebarProps> = ({
    items,
    activeItem,
    onItemClick,
    className = '',
}) => {
    return (
        <aside className={`${styles.sidebar} ${className}`}>
            <div className={styles.sidebarHeader}>
                <h2>PlateerRAG</h2>
                <p>AI 워크플로우 관리 센터</p>
            </div>

            <nav className={styles.sidebarNav}>
                {items.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onItemClick(item.id)}
                        className={`${styles.navItem} ${activeItem === item.id ? styles.active : ''}`}
                    >
                        {item.icon}
                        <div className={styles.navText}>
                            <div className={styles.navTitle}>{item.title}</div>
                            <div className={styles.navDescription}>
                                {item.description}
                            </div>
                        </div>
                    </button>
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
