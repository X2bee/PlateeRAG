import { useState, useCallback } from 'react';
import type { PredictedNode, NodeData, Position, CanvasNode, CanvasEdge } from '@/app/canvas/types';
import { devLog } from '@/app/_common/utils/logger';

const VERTICAL_SPACING = 350;
const HORIZONTAL_SPACING = 500;

interface UsePredictedNodesProps {
    availableNodeSpecs: NodeData[];
    areTypesCompatible: (sourceType?: string, targetType?: string) => boolean;
}

interface UsePredictedNodesReturn {
    predictedNodes: PredictedNode[];
    setPredictedNodes: React.Dispatch<React.SetStateAction<PredictedNode[]>>;
    isDraggingOutput: boolean;
    isDraggingInput: boolean;
    currentOutputType: string | null;
    currentInputType: string | null;
    sourcePortForConnection: { nodeId: string; portId: string; portType: string; type: string } | null;
    setIsDraggingOutput: (value: boolean) => void;
    setIsDraggingInput: (value: boolean) => void;
    setCurrentOutputType: (value: string | null) => void;
    setCurrentInputType: (value: string | null) => void;
    setSourcePortForConnection: (value: { nodeId: string; portId: string; portType: string; type: string } | null) => void;
    generatePredictedNodes: (outputType: string, targetPos: Position) => PredictedNode[];
    generatePredictedOutputNodes: (inputType: string, targetPos: Position) => PredictedNode[];
    handlePredictedNodeHover: (nodeId: string, isHovered: boolean) => void;
    handlePredictedNodeClick: (nodeData: NodeData, position: Position) => CanvasNode | null;
    clearPredictedNodes: () => void;
    isPredictedNodeId: (nodeId: string) => boolean;
}

export const usePredictedNodes = ({ 
    availableNodeSpecs, 
    areTypesCompatible 
}: UsePredictedNodesProps): UsePredictedNodesReturn => {
    const [predictedNodes, setPredictedNodes] = useState<PredictedNode[]>([]);
    const [isDraggingOutput, setIsDraggingOutput] = useState<boolean>(false);
    const [isDraggingInput, setIsDraggingInput] = useState<boolean>(false);
    const [currentOutputType, setCurrentOutputType] = useState<string | null>(null);
    const [currentInputType, setCurrentInputType] = useState<string | null>(null);
    const [sourcePortForConnection, setSourcePortForConnection] = useState<{
        nodeId: string;
        portId: string;
        portType: string;
        type: string;
    } | null>(null);

    const canConnectTypes = (outputType: string, inputType: string): boolean => {
        return areTypesCompatible(outputType, inputType);
    };

    const findCompatibleNodes = (outputType: string): NodeData[] => {
        return availableNodeSpecs.filter(nodeSpec => {
            if (!nodeSpec.inputs) return false;
            return nodeSpec.inputs.some(input => canConnectTypes(outputType, input.type));
        });
    };

    const findCompatibleOutputNodes = (inputType: string): NodeData[] => {
        return availableNodeSpecs.filter(nodeSpec => {
            if (!nodeSpec.outputs) return false;
            return nodeSpec.outputs.some(output => canConnectTypes(output.type, inputType));
        });
    };

    const generatePredictedNodes = useCallback((outputType: string, targetPos: Position): PredictedNode[] => {
        const compatibleNodes = findCompatibleNodes(outputType);
        const predicted: PredictedNode[] = [];
        const OFFSET_DISTANCE = 100;

        if (compatibleNodes.length === 0) return predicted;

        const cols = Math.min(3, Math.ceil(Math.sqrt(compatibleNodes.length)));
        const rows = Math.ceil(compatibleNodes.length / cols);
        const totalGridWidth = (cols - 1) * HORIZONTAL_SPACING;
        const totalGridHeight = (rows - 1) * VERTICAL_SPACING;
        const startX = targetPos.x + OFFSET_DISTANCE;
        const startY = targetPos.y - totalGridHeight / 2;

        devLog.log('Generating output predicted nodes to the right of mouse:', {
            totalNodes: compatibleNodes.length,
            cols, rows,
            targetPos,
            startX, startY,
            gridSize: { width: totalGridWidth, height: totalGridHeight },
            direction: 'right'
        });

        compatibleNodes.forEach((nodeData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const position = {
                x: startX + (col * HORIZONTAL_SPACING),
                y: startY + (row * VERTICAL_SPACING)
            };

            predicted.push({
                id: `predicted-${nodeData.id}-${Date.now()}-${index}`,
                nodeData,
                position,
                isHovered: false
            });
        });

        return predicted;
    }, [availableNodeSpecs, areTypesCompatible]);

    const generatePredictedOutputNodes = useCallback((inputType: string, targetPos: Position): PredictedNode[] => {
        const compatibleNodes = findCompatibleOutputNodes(inputType);
        const predicted: PredictedNode[] = [];
        const OFFSET_DISTANCE = 550;

        if (compatibleNodes.length === 0) return predicted;

        const cols = Math.min(3, Math.ceil(Math.sqrt(compatibleNodes.length)));
        const rows = Math.ceil(compatibleNodes.length / cols);
        const totalGridWidth = (cols - 1) * HORIZONTAL_SPACING;
        const totalGridHeight = (rows - 1) * VERTICAL_SPACING;
        const startX = targetPos.x - OFFSET_DISTANCE - totalGridWidth;
        const startY = targetPos.y - totalGridHeight / 2;

        devLog.log('Generating input predicted nodes to the left of mouse:', {
            totalNodes: compatibleNodes.length,
            cols, rows,
            targetPos,
            startX, startY,
            gridSize: { width: totalGridWidth, height: totalGridHeight },
            direction: 'left'
        });

        compatibleNodes.forEach((nodeData, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const position = {
                x: startX + (col * HORIZONTAL_SPACING),
                y: startY + (row * VERTICAL_SPACING)
            };

            predicted.push({
                id: `predicted-output-${nodeData.id}-${Date.now()}-${index}`,
                nodeData,
                position,
                isHovered: false
            });
        });

        return predicted;
    }, [availableNodeSpecs, areTypesCompatible]);

    const handlePredictedNodeHover = useCallback((nodeId: string, isHovered: boolean): void => {
        setPredictedNodes(prev => prev.map(node =>
            node.id === nodeId ? { ...node, isHovered } : node
        ));
    }, []);

    const handlePredictedNodeClick = useCallback((nodeData: NodeData, position: Position): CanvasNode | null => {
        devLog.log('=== handlePredictedNodeClick called ===', {
            nodeData: nodeData.nodeName,
            isDraggingOutput,
            isDraggingInput
        });

        const newNode: CanvasNode = {
            id: `${nodeData.id}-${Date.now()}`,
            data: nodeData,
            position: position
        };

        // Clear predicted nodes state
        setPredictedNodes([]);
        setIsDraggingOutput(false);
        setIsDraggingInput(false);
        setCurrentOutputType(null);
        setCurrentInputType(null);
        setSourcePortForConnection(null);

        devLog.log('Predicted node converted to actual node:', newNode.id);
        return newNode;
    }, [isDraggingOutput, isDraggingInput]);

    const clearPredictedNodes = useCallback(() => {
        setPredictedNodes([]);
        setIsDraggingOutput(false);
        setIsDraggingInput(false);
        setCurrentOutputType(null);
        setCurrentInputType(null);
        setSourcePortForConnection(null);
    }, []);

    const isPredictedNodeId = useCallback((nodeId: string): boolean => {
        return nodeId.startsWith('predicted-') || nodeId.startsWith('predicted-output-');
    }, []);

    return {
        predictedNodes,
        setPredictedNodes,
        isDraggingOutput,
        isDraggingInput,
        currentOutputType,
        currentInputType,
        sourcePortForConnection,
        setIsDraggingOutput,
        setIsDraggingInput,
        setCurrentOutputType,
        setCurrentInputType,
        setSourcePortForConnection,
        generatePredictedNodes,
        generatePredictedOutputNodes,
        handlePredictedNodeHover,
        handlePredictedNodeClick,
        clearPredictedNodes,
        isPredictedNodeId
    };
};