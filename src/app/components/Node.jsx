import React from 'react';
import styles from '@/app/assets/Node.module.scss';

const Node = ({ data, position }) => {
    const { nodeName, parameters } = data;

    return (
        <div
            className={styles.node}
            style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
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

            {/* 시각적 효과를 위한 입출력 포트 */}
            <div className={`${styles.port} ${styles.inputPort}`}></div>
            <div className={`${styles.port} ${styles.outputPort}`}></div>
        </div>
    );
};

export default Node;