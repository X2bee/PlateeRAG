import React, { DragEvent } from 'react';
import styles from '@/app/canvas/assets/SideMenu.module.scss';

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
    is_api?: boolean;
    api_name?: string;
}

interface NodeData {
    id: string;
    nodeName: string;
    functionId?: string;
    inputs?: Port[];
    outputs?: Port[];
    parameters?: Parameter[];
}

interface DraggableNodeItemProps {
    nodeData: NodeData;
}

const DraggableNodeItem: React.FC<DraggableNodeItemProps> = ({ nodeData }) => {
    const onDragStart = (event: DragEvent<HTMLDivElement>): void => {
        const nodeDataString = JSON.stringify(nodeData);
        event.dataTransfer.setData('application/json', nodeDataString);
        event.dataTransfer.setData('text/plain', nodeDataString);
        event.dataTransfer.effectAllowed = 'copy';
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
