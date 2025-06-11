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

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

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