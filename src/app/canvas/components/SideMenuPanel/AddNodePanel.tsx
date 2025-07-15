"use client";
import React, { useState, useEffect, ReactElement } from 'react';
import styles from '@/app/canvas/assets/SideMenu.module.scss';
import NodeList from '@/app/canvas/components/Helper/NodeList';
import DraggableNodeItem from '@/app/canvas/components/Helper/DraggableNodeItem';
import { LuSearch, LuArrowLeft, LuBrainCircuit, LuShare2, LuWrench, LuX, LuRefreshCw } from 'react-icons/lu';
import { SiLangchain } from "react-icons/si";
import { useNodes } from '@/app/(common)/components/nodeHook';

// Type definitions
interface Port {
    id: string;
    name: string;
    type: string;
    required?: boolean;
    multi?: boolean;
}

interface Parameter {
    id: string;
    name: string;
    value: string | number;
    type?: string;
    required?: boolean;
    optional?: boolean;
    options?: Array<{ value: string | number; label?: string }>;
    step?: number;
    min?: number;
    max?: number;
}

interface NodeData {
    id: string;
    nodeName: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
}

interface NodeFunction {
    functionId: string;
    functionName: string;
    nodes?: NodeData[];
}

interface NodeCategory {
    categoryId: string;
    categoryName: string;
    icon: string;
    functions?: NodeFunction[];
}

interface AddNodePanelProps {
    onBack: () => void;
}

interface IconMapType {
    [key: string]: ReactElement;
}

const iconMap: IconMapType = {
    LuBrainCircuit: <LuBrainCircuit />,
    LuShare2: <LuShare2 />,
    LuWrench: <LuWrench />,
    SiLangchain: <SiLangchain />,
};

const AddNodePanel: React.FC<AddNodePanelProps> = ({ onBack }) => {
    const { nodes: nodeSpecs, isLoading, error, exportAndRefreshNodes } = useNodes();
    const [activeTab, setActiveTab] = useState<string | null>(null);

    useEffect(() => {
        if (nodeSpecs && nodeSpecs.length > 0) {
            setActiveTab((nodeSpecs as NodeCategory[])[0].categoryId);
        }
    }, [nodeSpecs]);

    const activeTabData = (nodeSpecs as NodeCategory[]).find((tab: NodeCategory) => tab.categoryId === activeTab);

    if (isLoading) {
        return (
            <>
                <div className={styles.header}>
                    <button onClick={onBack} className={styles.backButton}><LuArrowLeft /></button>
                    <h3>Add Nodes</h3>
                </div>
                <div className={styles.loadingContainer}>Loading nodes...</div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <div className={styles.header}>
                    <button onClick={onBack} className={styles.backButton}><LuArrowLeft /></button>
                    <h3>Add Nodes</h3>
                </div>
                <div className={styles.errorContainer}>Error: {error}</div>
            </>
        );
    }

    return (
        <>
            <div className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    <LuArrowLeft />
                </button>
                <h3>Add Nodes</h3>
                <button 
                    onClick={exportAndRefreshNodes} 
                    className={`${styles.refreshButton} ${isLoading ? styles.loading : ''}`}
                    disabled={isLoading}
                    title="Refresh Node List"
                >
                    <LuRefreshCw />
                </button>
            </div>

            <div className={styles.searchBar}>
                <LuSearch className={styles.searchIcon} />
                <input type="text" placeholder="Search nodes" />
                <LuX className={styles.clearIcon} />
            </div>

            <div className={styles.tabs}>
                {(nodeSpecs as NodeCategory[]).map((tab: NodeCategory) => (
                    <button
                        key={tab.categoryId}
                        className={`${styles.tab} ${activeTab === tab.categoryId ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.categoryId)}
                    >
                        {iconMap[tab.icon]}
                        <span>{tab.categoryName}</span>
                    </button>
                ))}
            </div>

            <div className={styles.nodeList}>
                {(activeTabData as NodeCategory | undefined)?.functions?.map((func: NodeFunction) => (
                    <NodeList key={func.functionId} title={func.functionName}>
                        {func.nodes?.map((node: NodeData) => (
                            <DraggableNodeItem key={node.id} nodeData={node} />
                        ))}
                    </NodeList>
                ))}
            </div>
        </>
    );
};

export default AddNodePanel;