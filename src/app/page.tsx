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
            // 1. Canvas로부터 현재 상태(노드, 뷰)를 가져옴
            const canvasState = canvasRef.current.getCanvasState();

            // 2. 상태 데이터를 JSON 문자열로 변환
            const jsonString = JSON.stringify(canvasState, null, 2);

            // 3. Blob 객체 생성
            const blob = new Blob([jsonString], { type: 'application/json' });

            // 4. 다운로드를 위한 URL 생성
            const url = URL.createObjectURL(blob);

            // 5. 임시 <a> 태그를 만들어 다운로드 실행
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plateerag-canvas.json'; // 저장될 파일 이름
            document.body.appendChild(a);
            a.click();

            // 6. 뒷정리
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };
    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        // canvasRef가 없으면 중단
        if (!canvasRef.current) return;

        const nodeData = JSON.parse(e.dataTransfer.getData('application/json'));
        if (!nodeData) return;

        // canvasRef를 통해 setNodes 함수를 호출 (이 부분은 Canvas에 추가 구현 필요)
        canvasRef.current.addNode(nodeData, e.clientX, e.clientY);
    };

    return (
        <div className={styles.pageContainer} onDragOver={handleDragOver} onDrop={handleDrop}>
            <Header onMenuClick={() => setIsMenuOpen(prev => !prev)} onSave={handleSave} />
            <main className={styles.mainContent}>
                <Canvas ref={canvasRef} />
                {isMenuOpen && <SideMenu menuRef={menuRef} />}
            </main>
        </div>
    );
}