import React from 'react';
import styles from '@/app/assets/SideMenu.module.scss';

const DraggableNodeItem = ({ nodeData }) => {
    const onDragStart = (event) => {
        event.dataTransfer.setData('application/json', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={styles.menuItem}
            draggable="true"
            onDragStart={onDragStart}
            style={{ cursor: 'grab' }}
        >
            <span>{nodeData.nodeName}</span>
        </div>
    );
};

export default DraggableNodeItem;