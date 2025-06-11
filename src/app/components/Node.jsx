import React from 'react';
import styles from '@/app/assets/Node.module.scss';

const Node = ({ id, data, position, onNodeMouseDown, isSelected }) => {
    const { nodeName, parameters } = data;

    const handleMouseDown = (e) => {
        e.stopPropagation();
        onNodeMouseDown(e, id);
    };

    return (
        <div
            className={`${styles.node} ${isSelected ? styles.selected : ''}`}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
            onMouseDown={handleMouseDown}
        >
            <div className={styles.header}>
                {nodeName}
            </div>
            <div className={styles.body}>
                {Object.entries(parameters).map(([key, value]) => (
                    <div key={key} className={styles.param}>
                        <span className={styles.paramKey}>{key}</span>
                        <span className={styles.paramValue}>{String(value)}</span>
                    </div>
                ))}
            </div>

            <div className={`${styles.port} ${styles.inputPort}`}></div>
            <div className={`${styles.port} ${styles.outputPort}`}></div>
        </div>
    );
};

export default Node;