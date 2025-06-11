"use client";
import { useState, useEffect, useRef } from 'react';

import Canvas from '@/app/components/Canvas';
import Header from '@/app/components/Header';
import SideMenu from '@/app/components/SideMenu';
import styles from '@/app/assets/PlateeRAG.module.scss';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // menuRef.current가 존재하고, 클릭한 영역이 메뉴 영역에 포함되지 않을 때
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        // 메뉴가 열려있을 때만 이벤트 리스너 추가
        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // cleanup 함수: 컴포넌트가 사라지거나 재렌더링 되기 전에 리스너 제거
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]); // isMenuOpen 상태가 변경될 때마다 이 훅을 다시 실행

    return (
        <div className={styles.pageContainer}>
            {/* 메뉴 버튼 클릭 시 isMenuOpen 상태를 토글 */}
            <Header onMenuClick={() => setIsMenuOpen(prev => !prev)} />
            <main className={styles.mainContent}>
                <Canvas />
                {/* isMenuOpen이 true일 때만 SideMenu를 렌더링 */}
                {isMenuOpen && <SideMenu menuRef={menuRef} />}
            </main>
        </div>
    );
}