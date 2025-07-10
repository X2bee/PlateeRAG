"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/(canvas)/assets/SideMenu.module.scss';
import NodeList from '@/app/(canvas)/components/Helper/NodeList';
import DraggableNodeItem from '@/app/(canvas)/components/Helper/DraggableNodeItem';
import { LuSearch, LuArrowLeft, LuBrainCircuit, LuShare2, LuWrench, LuX, LuRefreshCw } from 'react-icons/lu';
import { SiLangchain } from "react-icons/si";
import { useNodes } from '@/app/(common)/components/nodeHook';

const iconMap = {
    LuBrainCircuit: <LuBrainCircuit />,
    LuShare2: <LuShare2 />,
    LuWrench: <LuWrench />,
    SiLangchain: <SiLangchain />,
};

const AddNodePanel = ({ onBack }) => {
    const { nodes: nodeSpecs, isLoading, error, exportAndRefreshNodes } = useNodes();
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        if (nodeSpecs && nodeSpecs.length > 0) {
            setActiveTab(nodeSpecs[0].categoryId);
        }
    }, [nodeSpecs]); 

    const activeTabData = nodeSpecs.find(tab => tab.categoryId === activeTab);
    if (isLoading) {
        return (
            <>
                <div className={styles.header}>
                    <button onClick={onBack} className={styles.backButton}><LuArrowLeft /></button>
                    <h3>Add Nodes</h3>
                </div>
                <div className={styles.loadingContainer}>Loading nodes...</div>
            </>
        )
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
        )
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
                {nodeSpecs.map(tab => (
                    <button
                        // [수정] key와 onClick 핸들러 변경
                        key={tab.categoryId}
                        className={`${styles.tab} ${activeTab === tab.categoryId ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.categoryId)}
                    >
                        {iconMap[tab.icon]}
                        {/* [수정] name -> categoryName */}
                        <span>{tab.categoryName}</span>
                    </button>
                ))}
            </div>

            <div className={styles.nodeList}>
                {/* [수정] categories -> functions, 내부 키 이름들도 변경 */}
                {activeTabData?.functions?.map(func => (
                    <NodeList key={func.functionId} title={func.functionName}>
                        {func.nodes?.map(node => (
                            <DraggableNodeItem key={node.id} nodeData={node} />
                        ))}
                    </NodeList>
                ))}
            </div>
        </>
    );
};

export default AddNodePanel;