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
    const [activeTab, setActiveTab] = React.useState(null);

    // [수정] 컴포넌트가 마운트될 때 데이터를 불러옵니다.
    useEffect(() => {
        // --- 추후 이 부분을 API 호출로 대체 ---
        // const fetchNodeSpecs = async () => {
        //     const response = await fetch('http://<backend-url>/api/nodes');
        //     const data = await response.json();
        //     setNodeSpecs(data);
        //     if (data.length > 0) {
        //         setActiveTab(data[0].id);
        //     }
        // };
        // fetchNodeSpecs();
        // ------------------------------------

        // 임시 로컬 데이터 사용
        setNodeSpecs(NODE_DATA);
        if (NODE_DATA.length > 0) {
            setActiveTab(NODE_DATA[0].id);
        }
    }, []); // 빈 배열을 전달하여 최초 렌더링 시 한 번만 실행

    const activeTabData = nodeSpecs.find(tab => tab.id === activeTab);

    // 데이터가 로딩되기 전에 렌더링되는 것을 방지
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
                {/* [수정] NODE_DATA 대신 nodeSpecs 상태 사용 */}
                {nodeSpecs.map(tab => (
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
                {activeTabData?.categories?.map(category => (
                    <NodeList key={category.id} title={category.name}>
                        {category.nodes?.map(node => (
                            <DraggableNodeItem key={node.id} nodeData={node} />
                        ))}
                    </NodeList>
                ))}
            </div>
        </>
    );
};

export default AddNodePanel;