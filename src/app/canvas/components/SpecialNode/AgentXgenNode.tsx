import React, { memo, useState, useMemo, useEffect, useRef } from 'react';
import styles from '@/app/canvas/assets/Node.module.scss';
import type { NodeProps, Port } from '@/app/canvas/types';
import { useNodeEditing } from '@/app/canvas/components/Node/hooks/useNodeEditing';
import {
    hasInputsAndOutputs,
    getNodeContainerClasses,
    getNodeContainerStyles
} from '@/app/canvas/components/Node/utils/nodeUtils';

// Components
import { NodeHeader } from '@/app/canvas/components/Node/components/NodeHeader';
import { NodePorts } from '@/app/canvas/components/Node/components/NodePorts';
import { NodePortsCollapsed } from '@/app/canvas/components/Node/components/NodePortsCollapsed';
import { NodeParameters } from '@/app/canvas/components/Node/components/NodeParameters';

/**
 * Agent Xgen 전용 Special Node
 * streaming 파라미터 값에 따라 output을 동적으로 변경합니다.
 * - streaming = true: {"id": "stream", "name": "Stream", "type": "STREAM STR", "stream": true}
 * - streaming = false: {"id": "result", "name": "Result", "type": "STR"}
 *
 * 프로덕션 환경 호환성:
 * - useRef를 사용하여 onOutputsUpdate 함수의 최신 참조 유지
 * - streamingValue만 의존성으로 사용하여 불필요한 재렌더링 방지
 * - outputs 업데이트는 실제 값 변경 시에만 실행
 */
const AgentXgenNode: React.FC<NodeProps & {
    onOutputsUpdate?: (nodeId: string, outputs: Port[]) => void;
}> = ({
    id,
    data,
    position,
    onNodeMouseDown,
    isSelected,
    onPortMouseDown,
    onPortMouseUp,
    registerPortRef,
    snappedPortKey,
    onParameterChange,
    isSnapTargetInvalid,
    isPreview = false,
    onNodeNameChange,
    onParameterNameChange,
    onParameterAdd,
    onParameterDelete,
    onClearSelection,
    isPredicted = false,
    predictedOpacity = 1.0,
    onPredictedNodeHover,
    onPredictedNodeClick,
    onOpenNodeModal,
    onSynchronizeSchema,
    currentNodes = [],
    currentEdges = [],
    isExpanded = true,
    onToggleExpanded,
    onOutputsUpdate
}) => {
    const { nodeName, inputs, parameters, outputs, functionId } = data;
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    // Ref to store the latest onOutputsUpdate function
    const onOutputsUpdateRef = useRef(onOutputsUpdate);
    useEffect(() => {
        onOutputsUpdateRef.current = onOutputsUpdate;
    }, [onOutputsUpdate]);

    // Custom hooks
    const nodeEditingHook = useNodeEditing(nodeName);

    // streaming 파라미터의 값만 추출 (안정적인 값 비교를 위해)
    const streamingValue = useMemo(() => {
        const streamingParam = parameters?.find(p => p.id === 'streaming');
        return streamingParam?.value ?? true; // 기본값 true
    }, [parameters]);

    // streaming 파라미터 값에 따라 outputs를 동적으로 생성
    const dynamicOutputs = useMemo((): Port[] => {
        if (streamingValue) {
            return [
                {
                    id: 'stream',
                    name: 'Stream',
                    type: 'STREAM STR',
                    stream: true
                }
            ];
        } else {
            return [
                {
                    id: 'result',
                    name: 'Result',
                    type: 'STR'
                }
            ];
        }
    }, [streamingValue]);

    // streaming 파라미터 변경 시 실제 노드 데이터의 outputs 업데이트
    useEffect(() => {
        const updateFn = onOutputsUpdateRef.current;
        if (!updateFn) return;

        // outputs가 실제로 변경되었는지 확인
        const currentOutputId = outputs?.[0]?.id;
        const newOutputId = dynamicOutputs[0]?.id;

        // 현재 outputs와 새로운 outputs가 다를 때만 업데이트
        if (currentOutputId !== newOutputId) {
            console.log('[AgentXgenNode] Updating outputs:', {
                nodeId: id,
                from: currentOutputId,
                to: newOutputId,
                streaming: streamingValue
            });
            updateFn(id, dynamicOutputs);
        }
    }, [streamingValue, id, dynamicOutputs, outputs]);

    // Event handlers
    const handleMouseDown = (e: React.MouseEvent): void => {
        if (isPreview) return;

        if (isPredicted && onPredictedNodeClick) {
            e.stopPropagation();
            onPredictedNodeClick(data, position);
            return;
        }

        e.stopPropagation();
        onNodeMouseDown(e, id);
    };

    const handleMouseEnter = (): void => {
        if (isPredicted && onPredictedNodeHover) {
            onPredictedNodeHover(id, true);
        }
    };

    const handleMouseLeave = (): void => {
        if (isPredicted && onPredictedNodeHover) {
            onPredictedNodeHover(id, false);
        }
    };

    const handleToggleAdvanced = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setShowAdvanced(prev => !prev);
    };

    const handleSynchronizeSchema = (portId: string): void => {
        if (!onSynchronizeSchema) return;
        onSynchronizeSchema(id, portId);
    };

    const handleToggleExpanded = (e: React.MouseEvent): void => {
        if (onToggleExpanded) {
            onToggleExpanded(id);
        }
    };

    // Utility calculations
    const { hasInputs, hasOutputs, hasIO } = hasInputsAndOutputs(inputs, dynamicOutputs);
    const hasParams = parameters && parameters.length > 0;

    // Compute node container classes and styles
    const nodeClasses = `${getNodeContainerClasses(isSelected, isPreview, isPredicted, styles)} ${!isExpanded ? styles.collapsed : ''}`;
    const nodeStyles = getNodeContainerStyles(position, isPredicted, predictedOpacity);

    return (
        <div
            className={nodeClasses}
            style={nodeStyles}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Header Section */}
            <NodeHeader
                nodeName={nodeName}
                functionId={functionId}
                isEditingName={nodeEditingHook.isEditingName}
                editingName={nodeEditingHook.editingName}
                isPreview={isPreview}
                isExpanded={isExpanded}
                onNameDoubleClick={(e) => nodeEditingHook.handleNameDoubleClick(e, nodeName, isPreview)}
                onNameChange={nodeEditingHook.handleNameChange}
                onNameKeyDown={nodeEditingHook.handleNameKeyDown}
                onNameBlur={() => nodeEditingHook.handleNameBlur(id, nodeName, onNodeNameChange)}
                onClearSelection={onClearSelection}
                onToggleExpanded={handleToggleExpanded}
            />

            {/* Body Section */}
            {isExpanded ? (
                <div className={styles.body}>
                    {/* Input/Output Ports */}
                    {hasIO && (
                        <NodePorts
                            nodeId={id}
                            inputs={inputs}
                            outputs={dynamicOutputs}
                            isPreview={isPreview}
                            isPredicted={isPredicted}
                            isSelected={isSelected}
                            onPortMouseDown={onPortMouseDown}
                            onPortMouseUp={onPortMouseUp}
                            registerPortRef={registerPortRef}
                            snappedPortKey={snappedPortKey}
                            isSnapTargetInvalid={isSnapTargetInvalid}
                            currentNodes={currentNodes}
                            currentEdges={currentEdges}
                            onSynchronizeSchema={handleSynchronizeSchema}
                        />
                    )}

                    {/* Parameters */}
                    {hasParams && !isPredicted && (
                        <>
                            {hasIO && <div className={styles.divider}></div>}
                            <NodeParameters
                                nodeId={id}
                                nodeDataId={data.id}
                                parameters={parameters}
                                isPreview={isPreview}
                                isPredicted={isPredicted}
                                onParameterChange={onParameterChange}
                                onParameterNameChange={onParameterNameChange}
                                onParameterAdd={onParameterAdd}
                                onParameterDelete={onParameterDelete}
                                onClearSelection={onClearSelection}
                                onOpenNodeModal={onOpenNodeModal}
                                showAdvanced={showAdvanced}
                                onToggleAdvanced={handleToggleAdvanced}
                            />
                        </>
                    )}
                </div>
            ) : (
                <div className={styles.collapsedBody}>
                    {hasIO && (
                        <NodePortsCollapsed
                            nodeId={id}
                            inputs={inputs}
                            outputs={dynamicOutputs}
                            isPreview={isPreview}
                            isPredicted={isPredicted}
                            isSelected={isSelected}
                            onPortMouseDown={onPortMouseDown}
                            onPortMouseUp={onPortMouseUp}
                            registerPortRef={registerPortRef}
                            snappedPortKey={snappedPortKey}
                            isSnapTargetInvalid={isSnapTargetInvalid}
                            currentNodes={currentNodes}
                            currentEdges={currentEdges}
                            onSynchronizeSchema={handleSynchronizeSchema}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

export default memo(AgentXgenNode);
