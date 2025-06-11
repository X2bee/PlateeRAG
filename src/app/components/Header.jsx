import React from 'react';
import styles from '@/app/assets/Header.module.scss';
import { LuPanelRightOpen } from "react-icons/lu";

const Header = ({onMenuClick}) => {
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
                <button onClick={onMenuClick} className={styles.menuButton}>
                    <LuPanelRightOpen />
                </button>
            </div>
        </header>
    );
};

export default Header;