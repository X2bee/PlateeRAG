import React, { memo } from 'react';
import styles from '@/app/assets/Node.module.scss';

const Node = ({ id, data, position, onNodeMouseDown, isSelected }) => {
    // 새로운 데이터 구조에 맞게 비구조화 할당
    const { nodeName, inputs, parameters, outputs } = data;

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
                <div className={styles.ioContainer}>
                    {/* Input Section */}
                    <div className={styles.portColumn}>
                        {inputs?.map(input => (
                            <div key={input.id} className={styles.portRow}>
                                <div className={`${styles.port} ${styles.inputPort} ${input.multi ? styles.multi : ''}`}></div>
                                <span className={styles.portLabel}>{input.name}</span>
                            </div>
                        ))}
                    </div>
                    {/* Output Section */}
                    <div className={`${styles.portColumn} ${styles.outputColumn}`}>
                        {outputs?.map(output => (
                            <div key={output.id} className={styles.portRow}>
                                <span className={styles.portLabel}>{output.name}</span>
                                <div className={`${styles.port} ${styles.outputPort} ${output.multi ? styles.multi : ''}`}></div>
                            </div>
                        ))}
                    </div>
                </div>

                {parameters?.length > 0 && (
                    <>
                        <div className={styles.divider}></div>
                        <div className={styles.paramSection}>
                            {parameters.map(param => (
                                <div key={param.id} className={styles.param}>
                                    <span className={styles.paramKey}>{param.name}</span>
                                    <span className={styles.paramValue}>{String(param.value)}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(Node);