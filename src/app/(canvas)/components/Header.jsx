import React from 'react';
import styles from '@/app/(canvas)/assets/Header.module.scss';
import { LuPanelRightOpen, LuSave, LuFolderOpen } from "react-icons/lu";

// [수정] onSave 옆에 onLoad prop 추가
const Header = ({ onMenuClick, onSave, onLoad }) => {
    return (
        <header className={styles.header}>
            <div className={styles.logo}>
                PlateeRAG
            </div>
            <div className={styles.rightSection}>
                <nav className={styles.nav}>
                    <ul>
                        <li><button type="button">파일</button></li>
                        <li><button type="button">편집</button></li>
                        <li><button type="button">보기</button></li>
                        <li><button type="button">내보내기</button></li>
                        <li><button type="button">도움말</button></li>
                    </ul>
                </nav>
                <button onClick={onLoad} className={styles.menuButton} title="Load Canvas">
                    <LuFolderOpen />
                </button>
                <button onClick={onSave} className={styles.menuButton} title="Save Canvas">
                    <LuSave />
                </button>
                <button onClick={onMenuClick} className={styles.menuButton}>
                    <LuPanelRightOpen />
                </button>
            </div>
        </header>
    );
};

export default Header;