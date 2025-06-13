import React, { memo } from 'react';
import styles from '@/app/assets/Node.module.scss';

const Node = ({ id, data, position, onNodeMouseDown, isSelected, onPortMouseDown, onPortMouseUp, registerPortRef }) => {
    const { nodeName, inputs, parameters, outputs } = data;

    const handleMouseDown = (e) => {
        e.stopPropagation();
        onNodeMouseDown(e, id);
    };

    const hasInputs = inputs?.length > 0;
    const hasOutputs = outputs?.length > 0;
    const hasIO = hasInputs || hasOutputs;
    const hasParams = parameters?.length > 0;

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
                {/* Input/Output 섹션 컨테이너 */}
                {hasIO && (
                    <div className={styles.ioContainer}>
                        {/* Input Column */}
                        {hasInputs && (
                            <div className={styles.column}>
                                <div className={styles.sectionHeader}>INPUT</div>
                                {inputs.map(portData => (
                                    <div key={portData.id} className={styles.portRow}>
                                        <div
                                            ref={(el) => registerPortRef(id, portData.id, 'input', el)}
                                            className={`${styles.port} ${styles.inputPort} ${portData.multi ? styles.multi : ''}`}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                // [수정] isMulti 프로퍼티를 이벤트 객체에 추가하여 전달합니다.
                                                onPortMouseDown({ nodeId: id, portId: portData.id, portType: 'input', isMulti: !!portData.multi });
                                            }}
                                            onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp({ nodeId: id, portId: portData.id, portType: 'input' }) }}
                                        />
                                        <span className={styles.portLabel}>{portData.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* Output Column */}
                        {hasOutputs && (
                            <div className={`${styles.column} ${styles.outputColumn}`}>
                                <div className={styles.sectionHeader}>OUTPUT</div>
                                {outputs.map(portData => (
                                    <div key={portData.id} className={`${styles.portRow} ${styles.outputRow}`}>
                                        <span className={styles.portLabel}>{portData.name}</span>
                                        <div
                                            ref={(el) => registerPortRef(id, portData.id, 'output', el)}
                                            className={`${styles.port} ${styles.outputPort} ${portData.multi ? styles.multi : ''}`}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                 // [수정] 출력 포트는 항상 새로운 엣지를 생성하므로 isMulti는 false로 처리해도 무방합니다.
                                                onPortMouseDown({ nodeId: id, portId: portData.id, portType: 'output', isMulti: false });
                                            }}
                                            onMouseUp={(e) => { e.stopPropagation(); onPortMouseUp({ nodeId: id, portId: portData.id, portType: 'output' }) }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Parameter Section */}
                {hasParams && (
                    <>
                        {hasIO && <div className={styles.divider}></div>}
                        <div className={styles.paramSection}>
                            <div className={styles.sectionHeader}>PARAMETER</div>
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