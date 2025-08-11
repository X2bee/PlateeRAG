"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/canvas/assets/SideMenu.module.scss';
import NodeList from '@/app/canvas/components/Helper/NodeList';
import DraggableNodeItem from '@/app/canvas/components/Helper/DraggableNodeItem';
import { LuSearch, LuArrowLeft, LuBrainCircuit, LuShare2, LuWrench, LuX, LuRefreshCw } from 'react-icons/lu';
import { SiLangchain } from "react-icons/si";
import { GiRollingEnergy } from "react-icons/gi";
import type {
    NodeData,
    NodeFunction,
    NodeCategory,
    AddNodePanelProps,
    IconMapType
} from '@/app/canvas/types';

const iconMap: IconMapType = {
    LuBrainCircuit: <LuBrainCircuit />,
    LuShare2: <LuShare2 />,
    LuWrench: <LuWrench />,
    SiLangchain: <SiLangchain />,
    GiRollingEnergy: <GiRollingEnergy />,

};

const AddNodePanel: React.FC<AddNodePanelProps> = ({
    onBack,
    nodeSpecs = [],
    nodesLoading = false,
    nodesError = null,
    onRefreshNodes
}) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);

    useEffect(() => {
        if (nodeSpecs && nodeSpecs.length > 0) {
            setActiveTab((nodeSpecs as NodeCategory[])[0].categoryId);
        }
    }, [nodeSpecs]);

    const activeTabData = (nodeSpecs as NodeCategory[]).find((tab: NodeCategory) => tab.categoryId === activeTab);

    if (nodesLoading) {
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

    if (nodesError) {
        return (
            <>
                <div className={styles.header}>
                    <button onClick={onBack} className={styles.backButton}><LuArrowLeft /></button>
                    <h3>Add Nodes</h3>
                </div>
                <div className={styles.errorContainer}>Error: {nodesError}</div>
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
                {onRefreshNodes && (
                    <button
                        onClick={onRefreshNodes}
                        className={`${styles.refreshButton} ${nodesLoading ? styles.loading : ''}`}
                        disabled={nodesLoading}
                        title="Refresh Node List"
                    >
                        <LuRefreshCw />
                    </button>
                )}
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
