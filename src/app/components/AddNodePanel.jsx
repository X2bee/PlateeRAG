"use client";
import React from 'react';
import styles from '@/app/assets/Sidebar.module.scss';
import { NODE_DATA } from '@/app/constants/nodes';
import { LuSearch, LuArrowLeft, LuBrainCircuit, LuShare2, LuWrench, LuX } from 'react-icons/lu';
import NodeList from '@/app/components/NodeList'; 

const iconMap = {
    LuBrainCircuit: <LuBrainCircuit />,
    LuShare2: <LuShare2 />,
    LuWrench: <LuWrench />,
};

// 'onBack' 함수를 prop으로 받음
const AddNodePanel = ({ onBack }) => {
    const [activeTab, setActiveTab] = React.useState(NODE_DATA[0].id);
    const activeTabData = NODE_DATA.find(tab => tab.id === activeTab);

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
                {NODE_DATA.map(tab => (
                    <button
                        key={tab.id}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {iconMap[tab.icon]}
                        <span>{tab.name}</span>
                    </button>
                ))}
            </div>

            <div className={styles.nodeList}>
                {activeTabData && activeTabData.categories.map(category => (
                    <NodeList key={category.id} title={category.name}>
                        <p style={{ padding: "16px", color: "#888" }}>Nodes for {category.name} will be here.</p>
                    </NodeList>
                ))}
            </div>
        </>
    );
};

export default AddNodePanel;