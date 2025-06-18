"use client";
import React, { useState, useEffect } from 'react';
import styles from '@/app/assets/SideMenu.module.scss';
import NodeList from '@/app/components/NodeList';
import DraggableNodeItem from '@/app/components/DraggableNodeItem';
import { NODE_DATA } from '@/app/constants/nodes';
import { LuSearch, LuArrowLeft, LuBrainCircuit, LuShare2, LuWrench, LuX } from 'react-icons/lu';

const iconMap = {
    LuBrainCircuit: <LuBrainCircuit />,
    LuShare2: <LuShare2 />,
    LuWrench: <LuWrench />,
};

const AddNodePanel = ({ onBack }) => {
    const [nodeSpecs, setNodeSpecs] = useState([]);
    const [activeTab, setActiveTab] = useState(null);

    useEffect(() => {
        setNodeSpecs(NODE_DATA);
        if (NODE_DATA.length > 0) {
            // [수정] id -> categoryId
            setActiveTab(NODE_DATA[0].categoryId);
        }
    }, []);

    // [수정] id -> categoryId
    const activeTabData = nodeSpecs.find(tab => tab.categoryId === activeTab);

    if (nodeSpecs.length === 0) {
        return <div>Loading nodes...</div>;
    }

    return (
        <>
            <div className={styles.header}>
                <button onClick={onBack} className={styles.backButton}>
                    <LuArrowLeft />
                </button>
                <h3>Add Nodes</h3>
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