import React from 'react';
import styles from '@/app/assets/Header.module.scss';

const Header = () => {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        PlateeRAG
      </div>
      <nav className={styles.nav}>
        <ul>
          <li><button type="button">파일</button></li>
          <li><button type="button">편집</button></li>
          <li><button type="button">보기</button></li>
          <li><button type="button">내보내기</button></li>
          <li><button type="button">도움말</button></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;