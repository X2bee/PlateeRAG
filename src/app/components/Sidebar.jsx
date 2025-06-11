"use client";
import React from 'react';
import styles from '@/app/assets/Sidebar.module.scss';
import { NODE_DATA } from '@/app/constants/nodes';
import { LuSearch, LuBrainCircuit, LuShare2, LuWrench, LuX } from 'react-icons/lu';
import Accordion from './Accordion';

// 데이터에 지정된 아이콘 이름과 실제 아이콘 컴포넌트를 매핑합니다.
const iconMap = {
    LuBrainCircuit: <LuBrainCircuit />,
    LuShare2: <LuShare2 />,
    LuWrench: <LuWrench />,
};

const Sidebar = () => {
    const [activeTab, setActiveTab] = React.useState(NODE_DATA[0].id);
    const activeTabData = NODE_DATA.find(tab => tab.id === activeTab);

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
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
                    <Accordion key={category.id} title={category.name}>
                        {/* 각 카테고리에 속한 노드들을 여기에 렌더링 할 예정 */}
                        <p style={{ padding: "16px", color: "#888" }}>Nodes for {category.name} will be here.</p>
                    </Accordion>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;