"use client";
import { useState, useEffect, useRef } from 'react';

import Canvas from '@/app/(canvas)/components/Canvas';
import Header from '@/app/(canvas)/components/Header';
import SideMenu from '@/app/(canvas)/components/SideMenu';
import styles from '@/app/(canvas)/assets/PlateeRAG.module.scss';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !(menuRef.current as any).contains(event.target)) {
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
            const canvasState = (canvasRef.current as any).getCanvasState();
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

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = event.target?.result as string;
                const savedState = JSON.parse(json);
                if (canvasRef.current) {
                    (canvasRef.current as any).loadCanvasState(savedState);
                }
            } catch (error) {
                console.error("Error parsing JSON file:", error);
                alert("유효하지 않은 파일 형식입니다.");
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (canvasRef.current) {
            const nodeData = JSON.parse(e.dataTransfer.getData('application/json'));
            if (nodeData) {
                (canvasRef.current as any).addNode(nodeData, e.clientX, e.clientY);
            }
        }
    };

    return (
        <div
            className={styles.pageContainer}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <Header 
                onMenuClick={() => setIsMenuOpen(prev => !prev)} 
                onSave={handleSave}
                onLoad={handleLoadClick}
            />
            <main className={styles.mainContent}>
                <Canvas ref={canvasRef} />
                {isMenuOpen && <SideMenu menuRef={menuRef} />}
            </main>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".json"
                onChange={handleFileChange}
            />
        </div>
    );
}