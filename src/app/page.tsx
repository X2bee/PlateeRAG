"use client";
import { useState, useEffect, useRef } from 'react';

import Canvas from '@/app/components/Canvas';
import Header from '@/app/components/Header';
import SideMenu from '@/app/components/SideMenu';
import styles from '@/app/assets/PlateeRAG.module.scss';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
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

    const handleSave = () => {
        if (canvasRef.current) {
            const canvasState = canvasRef.current.getCanvasState();
            const jsonString = JSON.stringify(canvasState, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plateerag-canvas.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        if (canvasRef.current) {
            const nodeData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (nodeData) {
                canvasRef.current.addNode(nodeData, e.clientX, e.clientY);
            }
        }
    };

    return (
        <div
            className={styles.pageContainer}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Header onMenuClick={() => setIsMenuOpen(prev => !prev)} onSave={handleSave} />
            <main className={styles.mainContent}>
                <Canvas ref={canvasRef} />
                {isMenuOpen && <SideMenu menuRef={menuRef} />}
            </main>
        </div>
    );
}