"use client";
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

import Canvas from '@/app/(canvas)/components/Canvas';
import Header from '@/app/(canvas)/components/Header';
import SideMenu from '@/app/(canvas)/components/SideMenu';
import ExecutionPanel from '@/app/(canvas)/components/ExecutionPanel';

import styles from '@/app/(canvas)/assets/PlateeRAG.module.scss';

import { executeWorkflow } from '@/app/api/components/nodeApi';

export default function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [executionOutput, setExecutionOutput] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);

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

    const handleExecute = async () => {
        if (!canvasRef.current) {
            toast.error("Canvas is not ready.");
            return;
        }

        setIsExecuting(true);
        setExecutionOutput(null);
        const toastId = toast.loading('Executing workflow...');

        try {
            const workflowData = (canvasRef.current as any).getCanvasState();
            
            if (!workflowData.nodes || workflowData.nodes.length === 0) {
                throw new Error("Cannot execute an empty workflow. Please add nodes.");
            }
            
            const result = await executeWorkflow(workflowData);
            setExecutionOutput(result);
            toast.success('Workflow executed successfully!', { id: toastId });

        } catch (error: any) {
            console.error("Execution failed:", error);
            setExecutionOutput({ error: error.message });
            toast.error(`Execution failed: ${error.message}`, { id: toastId });
        } finally {
            setIsExecuting(false);
        }
    };

    const handleClearOutput = () => {
        setExecutionOutput(null);
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
                <ExecutionPanel
                    onExecute={handleExecute}
                    onClear={handleClearOutput}
                    output={executionOutput}
                    isLoading={isExecuting}
                />
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